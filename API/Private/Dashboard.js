// controllers/dashboard.js
import Base from "../../Models/Base.js";
import Subscription from "../../Models/Subscription.js"
import dotenv from "dotenv";
import Stripe from "stripe";
import { User } from "../../Models/User.js";
import { Creator } from "../../Models/Creator.js";
import { handleExistingCreator, handleStripeError } from "../Util/StripeHandler.js";
import { checkAuthorization } from "./Authorization.js";
import { deleteImage } from "../Util/CloudinaryUpload.js";

export const getBookMarks = async (req,res) => {
  try{
    checkAuthorization(req,res);
    let user;
    switch(req.user.role){
      case "user" : user = User.findById(req.user.id).select('bookMarks');break;
      case "creator" : user = User.findById(req.user.id).select('bookMarks');break;
      default : return res.status(404).json({message : "Requested data not found"});
    }
    return res.status(200).json({bookMarks : user.bookMarks});
  }catch(error){
    return res.status(500).json({message : error});
  }
};

export async function getDashboardData(req, res) {
  try {
    checkAuthorization(req,res);
    const userId = req.user.id;
    const userRole = req.user.role;

    let detailedUser;

    // Step 2: Use the role to query the appropriate discriminator
    switch (userRole) {
      case "user":
        detailedUser = await User.findById(userId)
          .select("username profilePic bio role")
          .lean();
        detailedUser.subscriptions = getSubs(userId);
        break;

      case "creator":
        detailedUser = await Creator.findById(userId)
          .select("username profilePic bio role")
          .lean();
        detailedUser.subscriptions = getSubs(userId);
        detailedUser.subscribers = getFans(userId);
        break;

      default:
        return res.status(400).json({ message: "Unknown user role." });
    }

    if (!detailedUser) {
      return res.status(404).json({ message: "Full user data not found." });
    }

    // Step 3: Return data
    return res.status(200).json(detailedUser);

  } catch (err) {
    return res.status(500).json({ message: err});
  }
};

const getSubs = async (userId) => {
  try{
    const subs =  await Subscription.find({subscriberId : userId}).select("creatorId");
  }catch(err){
    throw new Error(err);
  }
};

const getFans = async (userId) => {
  try{
    return fans = await Subscription.find({creatorId : userId}).select("subscriberId");
  }catch(err){
    throw new Error(err);
  }
};

export const getSubscriptions = (req,res) => {
  try{
    const subscriptions = getSubs(req.user.id);
    let creatorIds;
    subscriptions.map(subscription => creatorIds.push(subscription.creatorId));
    return res.status(200).json(creatorIds);
  }catch(err){
    return res.status(404).json({message : err});
  }
};

export const getSubscribers = (req,res) => {
  try{
    const subscriptions = getSubs(req.user.id);
    let subscriberIds;
    subscriptions.map(subscription => subscriberIds.push(subscription.creatorId));
    return res.status(200).json(subscriberIds);
  }catch(err){
    return res.status(404).json({message : err});
  }
};

export const updateDashboardData = async (req, res) => {
  try {
    checkAuthorization(req,res);
    const userId = req.user.id;
    const userRole = req.user.role;
  
    // 1. Start with body fields
    const updateData = { ...req.body };

    
  
    // 2. If a file is uploaded, save filename or full path
    if (req.file) {
      const [pic] = req.attachments // or full path if needed
      updateData.profilePic = pic;
    }

    let updatedUser;
    const oldUser = await User.findById(userId).select('profilePic');
    switch(userRole){
      case "user": updatedUser = await User.findByIdAndUpdate(
                   userId,
                   { $set: updateData },
                   { new: true, runValidators: true, overwriteDiscriminatorKey: true }
                  );break;
      case "creator": updatedUser = await Creator.findByIdAndUpdate(
                    userId,
                    { $set: updateData},
                    { new: true, runValidators: true, overwriteDiscriminatorKey: true }
                  );
    }

    await updatedUser.save();
    if(oldUser.profilePic.publicId)deleteImage(oldUser.profilePic.publicId);
    return res.json({ success: true, user: updatedUser.role });
  } catch (error) {
    console.error(error);
    const [pic] = req.attachments;
    deleteImage(pic.publicId);
    return res.status(500).json({success: false, message: "Update Failed"});
  }
};

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const upgradeToCreator = async (req,res) => {
  checkAuthorization(req,res);
  const userId = req.user.id;
  let upgradeData = {...req.body}

  const user = await Base.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  // Check if already a creator
  if (user.role === "creator") {
    return handleExistingCreator(user, res);
  }

  try{

    const stripeAccount = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
      individual: {
        email: user.email,
      },
    });

    const creator = await User.findByIdAndUpdate(
      userId,
      { role: "creator",
        payoutInfo: stripeAccount.id,
        onboardingComplete: false,
        $set: upgradeData
      },
      { new: true, runValidators: true, overwriteDiscriminatorKey: true }
    )

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.id,
      refresh_url: `${process.env.REQ_ORIGIN}/onboarding-retry`,
      return_url: `${process.env.REQ_ORIGIN}/creator-dashboard`,
      type: "account_onboarding",
    });

    return res.status(201).json({
      success: true,
      message: "Creator account created. Complete Stripe onboarding to receive payments.",
      onboardingUrl: accountLink.url,
      creator: creator,
      onboardingComplete: false
    });
  }catch(err){
    console.error("Update error:", err);
    return handleStripeError(err, res);
  }
};

