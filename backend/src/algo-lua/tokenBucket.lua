---@diagnostic disable: undefined-global

local redisKey = KEYS[1]
local statsKey = KEYS[2]
local globalStats = KEYS[3]

local limit = tonumber(ARGV[1]) or 0
local refillRatePerSec = tonumber(ARGV[2])
local currentTime = tonumber(ARGV[3])
local tokenRequested = tonumber(ARGV[4])

local lastRefillKey = redisKey .. ":last_refill"


local lastRefillTime = tonumber(redis.call("GET", lastRefillKey))
if not lastRefillTime then
    lastRefillTime = currentTime
end


local currentTokens = tonumber(redis.call("GET", redisKey)) or limit


local elapsedSec = (currentTime - lastRefillTime) / 1000
local tokensToAdd = math.floor(elapsedSec * refillRatePerSec)
currentTokens = math.min(limit, currentTokens + tokensToAdd)
if tokensToAdd > 0 then
  redis.call("SET", lastRefillKey, currentTime)
end

if tokenRequested > currentTokens then
    local retryAfterMs = math.ceil((tokenRequested - currentTokens) / refillRatePerSec * 1000)
    return {
        0,
        currentTokens,
        retryAfterMs,
        currentTime + retryAfterMs,
        blocked,
        total,
        total - blocked
    }
end



currentTokens = currentTokens - tokenRequested
redis.call("SET", redisKey, currentTokens)
redis.call("PEXPIRE", redisKey, math.ceil((limit / refillRatePerSec) * 1000))

local allowed = redis.call("HINCRBY", statsKey, "allowed", 1)
local total = redis.call("HINCRBY", statsKey, "total", 1)

redis.call("HINCRBY", globalStats, "allowed", 1)
redis.call("HINCRBY", globalStats, "total", 1)

return {
    1,                                      
    currentTokens,                         
    0,                                     
    currentTime,                            
    total - allowed,                    
    total,                                  
    allowed
      
}