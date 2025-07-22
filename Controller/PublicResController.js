import { Router } from "express";
import { getRandomCreator } from "../API/Public/CreatorInfo.js";

const router = Router();

router.get('/creators/random', getRandomCreator)

export default router;