import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { URL } from "url";
import streamifier from "streamifier";

// Configure using CLOUDINARY_URL
dotenv.config();
const cloudinaryUrl = new URL(process.env.CLOUDINARY_URL);

cloudinary.config({
  cloud_name: cloudinaryUrl.hostname,
  api_key: cloudinaryUrl.username,
  api_secret: cloudinaryUrl.password,
});

export const uploadToCloudinary = async (req, res, next) => {
  const files = [];

  if (req.file) {
    files.push(req.file);
  } else if (Array.isArray(req.files)) {
    files.push(...req.files);
  }

  if (files.length==0) return next();

  try {
    const uploadPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "uploads" },
          (error, result) => {
            if (error) return reject(error);
            resolve({url : result.secure_url, publicId : result.public_id});
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    req.attachments = uploadedUrls; // store for next middleware
    next();
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ message: "Failed to upload images to Cloudinary." });
  }
};

export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary delete result:", result);
    return result;
  } catch (err) {
    console.error("Cloudinary deletion error:", err);
    throw err;
  }
};
