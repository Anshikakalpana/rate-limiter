---@diagnostic disable: undefined-global

local redisKey = KEYS[1]
local statsKey = KEYS[2]
local globalStats = KEYS[3]

local capacity = tonumber(ARGV[1])
local leakRatePerSec = tonumber(ARGV[2])
local tokenRequested = tonumber(ARGV[3])
local currentTime = tonumber(ARGV[4])

local lastLeakKey = redisKey .. ":last_leak_time"
local lastLeakTime = tonumber(redis.call("GET", lastLeakKey)) or currentTime

local tokensKey = redisKey
local currentTokens = tonumber(redis.call("GET", tokensKey)) or 0

-- Compute elapsed time in seconds
local elapsedSec = (currentTime - lastLeakTime) / 1000
local tokensToLeak = math.floor(elapsedSec * leakRatePerSec)

-- Leak tokens
if tokensToLeak > 0 then
    currentTokens = math.max(0, currentTokens - tokensToLeak)
    redis.call("SET", tokensKey, currentTokens)
    redis.call("SET", lastLeakKey, currentTime)
    redis.call("EXPIRE", tokensKey, 3600)
    redis.call("EXPIRE", lastLeakKey, 3600)
end

-- Can we allow request?
if currentTokens + tokenRequested > capacity then
    local tokensNeeded = (currentTokens + tokenRequested) - capacity
    local retryAfterMs = math.ceil((tokensNeeded / leakRatePerSec) * 1000)
    
    redis.call("HINCRBY", statsKey, "blocked", 1)
    redis.call("HINCRBY", statsKey, "total", 1)
    redis.call("HINCRBY", globalStats, "blocked", 1)
    redis.call("HINCRBY", globalStats, "total", 1)
    redis.call("EXPIRE", statsKey, 86400)
    redis.call("EXPIRE", globalStats, 86400)

    local blocked = tonumber(redis.call("HGET", statsKey, "blocked")) or 0
    local total = tonumber(redis.call("HGET", statsKey, "total")) or 0
    local allowed = total - blocked

    return {
        0,                                     
        math.max(0, capacity - currentTokens),
        retryAfterMs / 1000,                 
        currentTime + retryAfterMs,            
        blocked,
        total,
        allowed
    }
end

-- Accept request
currentTokens = currentTokens + tokenRequested
redis.call("SET", tokensKey, currentTokens)
redis.call("EXPIRE", tokensKey, 3600)

-- Update stats
redis.call("HINCRBY", statsKey, "allowed", 1)
redis.call("HINCRBY", statsKey, "total", 1)
redis.call("HINCRBY", globalStats, "allowed", 1)
redis.call("HINCRBY", globalStats, "total", 1)
redis.call("EXPIRE", statsKey, 86400)
redis.call("EXPIRE", globalStats, 86400)

local allowed = tonumber(redis.call("HGET", statsKey, "allowed")) or 0
local total = tonumber(redis.call("HGET", statsKey, "total")) or 0
local blocked = total - allowed

return {
    1,                                   
    math.max(0, capacity - currentTokens), 
    0,                                  
    currentTime,
    blocked,
    total,
    allowed
}
