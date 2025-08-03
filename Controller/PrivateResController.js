import { Router } from "express";
import upload from "../Middleware/UploadMiddleware.js";
import authMiddleware from "../Middleware/AuthMiddleware.js";
import { getDashboardData, updateDashboardData, upgradeToCreator} from "../API/Private/Dashboard.js";
import { retryStripeOnboarding, getStripeDashboardLink } from "../API/Util/StripeHandler.js";
import { uploadToCloudinary } from "../API/Util/CloudinaryUpload.js";
import { subscribeToCreator } from "../API/Private/Subscribing.js";
import { createPost, deletePost, editPost, getAllPosts, likePost } from "../API/Private/Posting.js";


const router = Router();

router.get("/dashboard", authMiddleware, getDashboardData);
router.patch("/dashboard", authMiddleware, upload.single('profilePic'), uploadToCloudinary, updateDashboardData);
router.patch("/upgrade", authMiddleware, upload.none(), upgradeToCreator)
router.get("/stripe/onboarding", authMiddleware, retryStripeOnboarding);
router.get("/stripe/dashboard", authMiddleware, getStripeDashboardLink);
router.post("/subscribe/:creatorId", authMiddleware, subscribeToCreator );
router.post("/post",authMiddleware,upload.array('attachments',3), uploadToCloudinary, createPost);
router.get("/post",authMiddleware, getAllPosts);
router.get("/post/:creatorId",authMiddleware, getAllPosts);
router.patch("/post/:postId", authMiddleware, upload.array('attachments',3), uploadToCloudinary, editPost);
router.delete("/post/:postId", authMiddleware, deletePost);
router.delete("/post/:postId", authMiddleware, likePost);


export default router;

