import { Router } from "express";

import { validate } from "../middleware/validate.js";
import { RequestSchema } from "../types/index.js";
import { fixedwindowalgo, leakyBucketAlgo, slidingWindowAlgo, tokenBucketAlgo } from "../service/service.js";
import { AllAlgorithms } from "../service/commonapi.js";
const router = Router();

router.post('/test' , validate(RequestSchema) , fixedwindowalgo );
router.post('/sliding' , validate(RequestSchema) , slidingWindowAlgo);
router.post('/tokenbucket', validate(RequestSchema) , tokenBucketAlgo);
router.post('/leakybucket', validate(RequestSchema) , leakyBucketAlgo);
router.post('/all' , validate(RequestSchema) , AllAlgorithms );

export default router;
