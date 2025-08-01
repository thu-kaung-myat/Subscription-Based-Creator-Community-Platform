import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { Readable } from "stream";
import { URL } from "url";


// Configure using CLOUDINARY_URL
dotenv.config();
const cloudinaryUrl = new URL(process.env.CLOUDINARY_URL);

cloudinary.config({
  cloud_name: cloudinaryUrl.hostname,
  api_key: cloudinaryUrl.username,
  api_secret: cloudinaryUrl.password,
});


// Helper to convert buffer to stream
const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

export const uploadToCloudinary = (req, res, next) => {
  if (!req.file) return next();

  const stream = cloudinary.uploader.upload_stream(
    {
      folder: "uploads", // optional Cloudinary folder
    },
    (error, result) => {
      if (error) {
        console.error("Cloudinary upload failed:", error);
        return res.status(500).json({ message: "Upload to Cloudinary failed" });
      }

      req.cloudinaryUrl = result.secure_url;
      next();
    }
  );

  bufferToStream(req.file.buffer).pipe(stream);
};
