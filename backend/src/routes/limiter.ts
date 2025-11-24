import { Router } from "express";

import { validate } from "../middleware/validate.js";
import { RequestSchema } from "../types/index.js";
import { fixedwindowalgo } from "../service/service.js";
const router = Router();

router.post('/test' , validate(RequestSchema) , fixedwindowalgo )

export default router;
