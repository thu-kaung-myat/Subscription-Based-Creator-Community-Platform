const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  role: {
    type: String,
    enum: ["USER", "CREATOR", "ADMIN"],
    default: "USER"
  },
  fee:          { type: Number, min: 0 }, // Only if role is CREATOR
  bio:          String,
  pic_url:      String,
  created_at:   { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
