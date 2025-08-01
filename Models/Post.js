const postSchema = new mongoose.Schema({
    title:        { type: String, required: true },
    body:         { type: String },
    attachment:   [{ type: String }], // URL to image or file
    createdAt:   { type: Date, default: Date.now }
  });
  
  export default mongoose.model("Post", postSchema);
  