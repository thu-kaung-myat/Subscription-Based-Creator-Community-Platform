import mongoose, { model, Schema } from "mongoose";

const postLikeSchema = new Schema({
    postId : {type: mongoose.Schema.ObjectId, require: true},
    subscriberId : {type: mongoose.Schema.ObjectId, require: true},
    createdAt: {type: Date, default: Date.now()}
})

export default model('PostLike', postLikeSchema);