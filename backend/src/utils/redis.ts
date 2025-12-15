import Redis from "ioredis";


export const redis = new Redis.Cluster([
  { host: "redis-node-1", port: 6379 },
  { host: "redis-node-2", port: 6379 },
  { host: "redis-node-3", port: 6379 },
  { host: "redis-node-4", port: 6379 },
  { host: "redis-node-5", port: 6379 },
  { host: "redis-node-6", port: 6379 }
], {
  redisOptions: {
  
  }
});


redis.once("connect", () => {
  console.log(" Redis Cluster connected");
});

redis.once("error", (err) => {
  console.error(" Redis Cluster error:", err);
});



export default redis;
