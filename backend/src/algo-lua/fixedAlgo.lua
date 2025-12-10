---@diagnostic disable: undefined-global


local redisKey = KEYS[1]
local statsKey = KEYS[2]
local globalStats = KEYS[3]

local limit = tonumber(ARGV[1])
local windowSize = tonumber(ARGV[2])
local currentTime = tonumber(ARGV[3])
local windowStart = tonumber(ARGV[4])


local count = tonumber(redis.call("GET", redisKey)) or 0

if count >= limit then
    local blocked = redis.call("HINCRBY", statsKey, "blocked", 1)
    local total = redis.call("HINCRBY", statsKey, "total", 1)

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

redis.call("INCR", redisKey)
redis.call("EXPIRE", redisKey, windowSize)

local allowed = redis.call("HINCRBY", statsKey, "allowed", 1)
local total = redis.call("HINCRBY", statsKey, "total", 1)

redis.call("HINCRBY", globalStats, "allowed", 1)
redis.call("HINCRBY", globalStats, "total", 1)

return {
    1,                                      
    limit - (count + 1),                    
    0,                                    
    windowStart + windowSize,              
    total - allowed,                    
    total,                                  
    allowed                                
}
