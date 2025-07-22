import { Router } from "express";
const router = Router();
import registerUser from "../API/Auth/Register.js";
import loginUser from "../API/Auth/Login.js";
import { parse, validate } from "../Middleware/UploadMiddleware.js";

router.post("/register",parse, validate, registerUser);
router.post("/login",parse, validate, loginUser)

export default router;
