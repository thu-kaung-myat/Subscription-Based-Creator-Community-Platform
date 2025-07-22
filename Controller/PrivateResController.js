import { Router } from "express";
import upload from "../Middleware/UploadMiddleware.js";
import authMiddleware from "../Middleware/AuthMiddleware.js";
import { getDashboardData, updateDashboardData, upgradeToCreator } from "../API/Private/Dashboard.js";

const router = Router();

router.get("/dashboard", authMiddleware, getDashboardData);
router.patch("/dashboard", authMiddleware, upload.single('profile_pic'), updateDashboardData);
router.patch("/upgrade", authMiddleware, upload.none(), upgradeToCreator)

export default router;

