import { Router } from "express";

import { validate } from "../middleware/validate.js";
import { RequestSchema } from "../types/index.js";
import { fixedwindowalgo, slidingWindowAlgo, tokenBucketAlgo } from "../service/service.js";
const router = Router();

router.post('/fixed' , validate(RequestSchema) , fixedwindowalgo )
router.post('/sliding' , validate(RequestSchema) , slidingWindowAlgo)
router.post('/tokenbucket', validate(RequestSchema) , tokenBucketAlgo)

export default router;
