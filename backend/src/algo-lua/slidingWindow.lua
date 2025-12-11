---@diagnostic disable: undefined-global

local redisKey = KEYS[1]
local statsKey = KEYS[2]
local globalStats = KEYS[3]

local limit = tonumber(ARGV[1])
local windowSize = tonumber(ARGV[2])
local tokenRequested = tonumber(ARGV[3])
local currentTime = tonumber(ARGV[4])


local windowStart = currentTime - windowSize
redis.call("ZREMRANGEBYSCORE", redisKey, 0, windowStart)
local count = tonumber(redis.call("ZCARD", redisKey)) or 0
local newCount = count + tokenRequested


if newCount > limit then
    local blocked= redis.call("HINCRBY", statsKey, "blocked", 1)
    local total= redis.call("HINCRBY", statsKey, "total", 1)
    redis.call("HINCRBY", globalStats, "blocked", 1)
    redis.call("HINCRBY", globalStats, "total", 1)
    return {
        0,
        limit - count,
        windowStart + windowSize - currentTime,
        windowStart + windowSize,
        blocked,
        total,
        total - blocked
    }
 
end
 
redis.call("ZADD", redisKey, currentTime, tostring(currentTime) .. "-" .. tostring(math.random()))

local allowed = redis.call("HINCRBY", statsKey, "allowed", 1)
local total= redis.call("HINCRBY", statsKey, "total", 1)
redis.call("HINCRBY", globalStats, "allowed", 1)
redis.call("HINCRBY", globalStats, "total", 1)

return {
    1,
    limit - newCount,
    windowStart + windowSize - currentTime,
    windowStart + windowSize,
    allowed,
    total,
    total - allowed
}


