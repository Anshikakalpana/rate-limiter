---@diagnostic disable: undefined-global

local redisKey = KEYS[1]
local statsKey = KEYS[2]
local globalStats = KEYS[3]

local capacity = tonumber(ARGV[1])
local leakRatePerSec = tonumber(ARGV[2])
local tokenRequested = tonumber(ARGV[3])
local currentTime = tonumber(ARGV[4])

local lastLeakTimeKey = redisKey .. ":last_leak_time"

local count = tonumber(redis.call("GET", redisKey)) or 0
local lastLeakTime = tonumber(redis.call("GET", lastLeakTimeKey)) or currentTime

local elapsed = currentTime - lastLeakTime
local tokensToLeak = math.floor((elapsed * leakRatePerSec) / 1000)

if tokensToLeak > 0 then
    count = math.max(0, count - tokensToLeak)
    redis.call("SET", lastLeakTimeKey, currentTime)
    redis.call("EXPIRE", lastLeakTimeKey, 3600)
end

local totalTokensRequired = count + tokenRequested

if totalTokensRequired > capacity then
   
    local retryAfterMs = math.ceil(((tokenRequested + count - capacity) * 1000) / leakRatePerSec)
    
    redis.call("HINCRBY", statsKey, "blocked", 1)
    redis.call("HINCRBY", statsKey, "total", 1)
    redis.call("HINCRBY", globalStats, "blocked", 1)
    redis.call("HINCRBY", globalStats, "total", 1)
    redis.call("EXPIRE", statsKey, 86400)
    
    local blocked = redis.call("HGET", statsKey, "blocked")
    local total = redis.call("HGET", statsKey, "total")
    
    return {
        0,
        capacity - count,
        (retryAfterMs) / 1000,
        currentTime + retryAfterMs,
        tonumber(blocked),
        tonumber(total),
        tonumber(total) - tonumber(blocked)
    }
end

count = count + tokenRequested
redis.call("SET", redisKey, count)
redis.call("EXPIRE", redisKey, 3600)

redis.call("HINCRBY", statsKey, "allowed", 1)
redis.call("HINCRBY", statsKey, "total", 1)
redis.call("EXPIRE", statsKey, 86400)
redis.call("HINCRBY", globalStats, "allowed", 1)
redis.call("HINCRBY", globalStats, "total", 1)

local allowed = redis.call("HGET", statsKey, "allowed")
local total = redis.call("HGET", statsKey, "total")

return {
    1,
    capacity - count,
    0,
    currentTime,
    tonumber(total) - tonumber(allowed),
    tonumber(total),
    tonumber(allowed)
}