import { Schema } from "mongoose";
import Base from "./Base.js";

const creatorSchema = new Schema({
    username: { type: String, required: true },        // duplicated but harmless
    profile_pic: {type:String},
    bio: String,
    fee: Number,
    payout_info: { type: String, required: true },      // creator‑only
})

export const Creator = Base.discriminator("creator", creatorSchema)