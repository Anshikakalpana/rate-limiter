---@diagnostic disable: undefined-global
---@
---@
local redisKey = KEYS[1]
local statsKey = KEYS[2]
local globalStats = KEYS[3]

local limit = tonumber(ARGV[1])
local windowSize = tonumber(ARGV[2])
local currentTime = tonumber(ARGV[3])

local windowStart = currentTime - windowSize

local count = tonumber(redis.call("ZCOUNT", redisKey, windowStart, currentTime)) or 0

if count>limit then
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

