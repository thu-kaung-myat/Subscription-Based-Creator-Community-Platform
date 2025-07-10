const subscriptionSchema = new mongoose.Schema({
    subscriber_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    creator_id:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    created_at:    { type: Date, default: Date.now }
  });
  
  // Optional: prevent duplicates
  subscriptionSchema.index({ subscriber_id: 1, creator_id: 1 }, { unique: true });
  
  module.exports = mongoose.model("Subscription", subscriptionSchema);
  