import type { Result } from "../types/index.js";

import  {redis} from "../utils/redis.js";




export async function fixedWindowAlgorithm(
     key:string ,
     limit: number,
     windowSize: number
    ): Promise<Result> {
   try{

    const currentTime = Math.floor(Date.now() / 1000);
const windowStartTime =  Math.floor(currentTime / windowSize) * windowSize;
const redisKey = `fixed_window:{${key}}:${windowStartTime}`;
const currentCount = await redis.get(redisKey);
const count = currentCount ? parseInt(currentCount) : 0;
if(count>=limit){
    return{
        allowed: false,
            tokensRemaining:0,
            resetTime: windowStartTime + windowSize,
            retryAfterTime: windowStartTime + windowSize-currentTime,
    }

}

    await redis.incr(redisKey);

    await redis.expire(redisKey , windowSize);

    return{
        allowed:true,
        tokensRemaining: limit-count-1,
        resetTime:windowSize+windowStartTime,

    }
    

   


   }catch(err){
    console.error('Fixed Window Error:');
    
    
    return {
      allowed: true,
      tokensRemaining: limit,
   }
}
}