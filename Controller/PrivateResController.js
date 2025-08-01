import { Router } from "express";
import upload from "../Middleware/UploadMiddleware.js";
import authMiddleware from "../Middleware/AuthMiddleware.js";
import { getDashboardData, updateDashboardData, upgradeToCreator, retryStripeOnboarding, getStripeDashboardLink } from "../API/Private/Dashboard.js";
import { uploadToCloudinary } from "../Middleware/CloudinaryUpload.js";


const router = Router();

router.get("/dashboard", authMiddleware, getDashboardData);
router.patch("/dashboard", authMiddleware, upload.single('profile_pic'), uploadToCloudinary, updateDashboardData);
router.patch("/upgrade", authMiddleware, upload.none(), upgradeToCreator)
router.get("/stripe/onboarding", authMiddleware, retryStripeOnboarding);
router.get("/stripe/dashboard", authMiddleware, getStripeDashboardLink);

export default router;

