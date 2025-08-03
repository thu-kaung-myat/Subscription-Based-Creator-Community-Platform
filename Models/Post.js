import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    title:        { type: String, required: true },
    body:         { type: String },
    attachments:   [{ 
      url : {type : String},
      publicId : {type : String}
     }], // URL to image or file
    author: {type: mongoose.Schema.ObjectId, ref: "Base", require: true},
    createdAt:   { type: Date, default: Date.now }
  });
  
  export default mongoose.model("Post", postSchema);
  