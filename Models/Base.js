import { Schema, model } from "mongoose";

const baseSchema = new Schema({
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  created_at:   { type: Date, default: Date.now }
},{discriminatorKey:"role", collection: "users"});

export default model("Base", baseSchema);
