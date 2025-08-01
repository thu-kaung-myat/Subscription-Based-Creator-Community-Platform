import mongoose from "mongoose";
import Base from "./Base.js";

const userSchema = new mongoose.Schema({
    username: {type: String, require: true},
    bio: {type: String},
    profilePic: {type: String}
})

export const User = Base.discriminator("user",userSchema)