import express, { json} from "express";
import { connect } from "mongoose";
import authRoutes from "./Controller/AuthController.js";
import protectedResRoutes from "./Controller/PrivateResController.js";
import publicResRoutes from "./Controller/PublicResController.js"
import cors from "cors";
import { config } from "dotenv";
// import { PrismaClient } from '@prisma/client'
// import { withAccelerate } from '@prisma/extension-accelerate'

import {PrismaClient} from "@prisma/client";
import {withAccelerate} from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate())

const app = express();
app.use(json());

// Connect MongoDB
connect("mongodb+srv://Patreon:Patreon@cluster0.8hbbrxs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Mount APIs

app.use("/api/auth", authRoutes);
app.use("/api/private", protectedResRoutes);
app.use("/api/public", publicResRoutes);
app.use("/uploads", express.static("Uploads"))
app.use(cors({
  origin: process.env.REQ_ORIGIN, // or "*" for all origins (not recommended in production)
}));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
