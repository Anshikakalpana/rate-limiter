import { createClient } from 'redis'


export const redis = createClient({
    // url : process.env.REDIS_URL!,
   url: "redis://redis:6379"
});

redis.on("connect",()=>{
    console.log("Redis client connected");

});


redis.on("error", (err) => {
  console.error(" Redis error:", err);
});

export async function redisClient() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}