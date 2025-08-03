import mongoose, { Schema, model } from "mongoose";

const subscriptionSchema = new Schema ({
    subscriberId : {type : mongoose.Schema.ObjectId, ref : "Base", require : true},
    creatorId : {type : mongoose.Schema.ObjectId, ref : "Base", require : true},
    startDate: {type : Date, default : Date.now},
    endDate: {type : Date, require : true},
    active: {type : Boolean, default : true }
})

export default model("Subscription", subscriptionSchema);