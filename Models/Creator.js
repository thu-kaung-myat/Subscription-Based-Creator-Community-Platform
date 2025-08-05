import mongoose, { Schema } from "mongoose";
import Base from "./Base.js";

const creatorSchema = new Schema({
    username: { type: String, required: true },        // duplicated but harmless
    profilePic: {
        url: {type: String},
        publicId: {type: String}
    },
    bio: String,
    fee: {type : Number, require: true},               // creator‑only
    earnings: {type: Number, default: 0},              
    category: {type: String, required: true},
    payoutInfo: { type: String, required: true },      
    onboardingComplete: {type: String, default: false},
    bookMarks: [{
        type: mongoose.Schema.ObjectId
    }],
    upgradedAt: {type: Date, default: Date.now}
})

export const Creator = Base.discriminator("creator", creatorSchema)