const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./Controller/AuthController");
require("dotenv").config()

const app = express();
app.use(express.json());

// Connect MongoDB
mongoose.connect("mongodb+srv://Patreon:Patreon@cluster0.8hbbrxs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Mount APIs
app.use("/api", authRoutes);

const protectedRoutes = require("./Controller/DashboardController");
app.use("/api", protectedRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
