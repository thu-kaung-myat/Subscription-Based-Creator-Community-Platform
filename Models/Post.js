const postSchema = new mongoose.Schema({
    title:        { type: String, required: true },
    body:         { type: String },
    attachment:   { type: String }, // URL to image or file
    user_id:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    created_at:   { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model("Post", postSchema);
  