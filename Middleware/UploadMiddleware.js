// middleware/upload.js
import multer from "multer";
import { extname } from "path";
import { body, validationResult } from "express-validator";

/* ──────────────────────────────────────────────────────────
   1)  FILE‑UPLOAD MIDDLEWARE  (for routes that handle files)
   ────────────────────────────────────────────────────────── */
// Use memory storage instead of saving to disk
const storage = multer.memoryStorage();

export const upload = multer({ storage }); // e.g. upload.single('profilePic')
   

/* ──────────────────────────────────────────────────────────
   2)  REGISTRATION PARSER  (no files, just fields)
   ────────────────────────────────────────────────────────── */
export const parse = multer().none(); // parses multipart/form-data fields only

/* ──────────────────────────────────────────────────────────
   3)  REGISTRATION VALIDATION  (email & password)
   ────────────────────────────────────────────────────────── */
export const validate = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required"),

  body("password")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 characters long"),

  // final gate
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

/* ──────────────────────────────────────────────────────────
   4)  Default export kept for backward compatibility
   ────────────────────────────────────────────────────────── */
export default upload;
