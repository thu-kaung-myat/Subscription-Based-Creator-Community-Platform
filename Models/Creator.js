import { Schema } from "mongoose";
import Base from "./Base.js";

const creatorSchema = new Schema({
    username: { type: String, required: true },        // duplicated but harmless
    profilePic: {type:String},
    bio: String,
    fee: Number,                                       // creator‑only
    category: {type: String, required: true},
    payoutInfo: { type: String, required: true },      
    onboardingComplete: {type: String, default: false},
    upgradedAt: {type: Date, default: Date.now}
})

export const Creator = Base.discriminator("creator", creatorSchema)