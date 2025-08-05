import mongoose from "mongoose";
import Base from "./Base.js";
import { type } from "os";

const userSchema = new mongoose.Schema({
    username: {type: String, require: true},
    bio: {type: String},
    profilePic: {
        url: {type: String},
        publicId: {type: String}
    },
    bookMarks: [{
        type: mongoose.Schema.ObjectId
    }]
})

export const User = Base.discriminator("user",userSchema)