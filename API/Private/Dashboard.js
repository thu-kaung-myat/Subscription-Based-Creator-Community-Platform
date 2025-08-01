// controllers/dashboard.js
import Base from "../../Models/Base.js";
import dotenv from "dotenv";
import Stripe from "stripe";
import { User } from "../../Models/User.js";
import { Creator } from "../../Models/Creator.js";

export async function getDashboardData(req, res) {
  try {
    const userId = req.user.id;

    // Step 1: First get the base user to check role (discriminator key)
    const baseUser = await Base.findById(userId).lean();
    if (!baseUser) {
      return res.status(404).json({ message: "User not found." });
    }

    let detailedUser;

    // Step 2: Use the role to query the appropriate discriminator
    switch (baseUser.role) {
      case "user":
        detailedUser = await User.findById(userId)
          .select("username profile_pic bio role")
          .lean();
        break;

      case "creator":
        detailedUser = await Creator.findById(userId)
          .select("username profile_pic bio role")
          .lean();
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
    console.error("Dashboard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export const updateDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
  
    // 1. Start with body fields
    const updateData = { ...req.body };
  
    // 2. If a file is uploaded, save filename or full path
    if (req.file) {
      updateData.profile_pic = req.cloudinaryUrl; // or full path if needed
    }
    let updatedUser;
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
      )
    }

    updatedUser.save();
  
    return res.json({ success: true, user: updatedUser.role });
  } catch (error) {
    
  }
}

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const upgradeToCreator = async (req,res) => {
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
      refresh_url: `${process.env.FRONTEND_URL}/onboarding-retry`,
      return_url: `${process.env.FRONTEND_URL}/creator-dashboard`,
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
}

// Handles retrying Stripe onboarding for existing creators
export const retryStripeOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    const creator = await Creator.findOne({ user: userId });

    if (!creator) {
      return res.status(404).json({ 
        success: false,
        message: "Creator account not found" 
      });
    }

    if (!creator.payoutInfo) {
      return res.status(400).json({
        success: false,
        message: "No Stripe account associated with this creator"
      });
    }

    // Check current Stripe account status
    const stripeAccount = await stripe.accounts.retrieve(creator.payoutInfo);
    const isOnboardingComplete = stripeAccount.charges_enabled && stripeAccount.payouts_enabled;

    // Update local status if changed
    if (isOnboardingComplete !== creator.onboardingComplete) {
      creator.onboardingComplete = isOnboardingComplete;
      await creator.save();
    }

    // Return early if already complete
    if (isOnboardingComplete) {
      return res.status(200).json({
        success: true,
        message: "Onboarding already completed",
        onboardingComplete: true,
        creator
      });
    }

    // Generate new onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: creator.payoutInfo,
      refresh_url: `${process.env.FRONTEND_URL}/onboarding-retry`,
      return_url: `${process.env.FRONTEND_URL}/creator-dashboard`,
      type: "account_onboarding",
    });

    return res.status(200).json({
      success: true,
      message: "New onboarding link generated",
      onboardingUrl: accountLink.url,
      onboardingComplete: false,
      creator
    });

  } catch (error) {
    console.error("[Onboarding Retry Error]", error);
    return handleStripeError(error, res);
  }
};

export const getStripeDashboardLink = async (req, res) => {
  try {
    const creator = await Creator.findOne({ user: req.user.id });

    if (!creator || !creator.payoutInfo) {
      return res.status(404).json({ message: "Creator or Stripe account not found" });
    }

    const loginLink = await stripe.accounts.createLoginLink(creator.payoutInfo);

    res.status(200).json({
      success: true,
      url: loginLink.url,
    });
  } catch (error) {
    console.error("Failed to generate Stripe login link:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to create Stripe dashboard link",
    });
  }
};

async function handleExistingCreator(creator, res) {
  try {
    // Verify Stripe account exists
    if (!creator.payoutInfo) {
      return res.status(400).json({
        success: false,
        message: "Creator exists but has no Stripe account",
        creator
      });
    }

    // Check current onboarding status
    const stripeAccount = await stripe.accounts.retrieve(creator.payoutInfo);
    const isOnboardingComplete = stripeAccount.charges_enabled && stripeAccount.payouts_enabled;

    // Update local status if changed
    if (isOnboardingComplete !== creator.onboardingComplete) {
      creator.onboardingComplete = isOnboardingComplete;
      await creator.save();
    }

    // Return appropriate response based on status
    if (isOnboardingComplete) {
      return res.status(200).json({
        success: true,
        message: "You're already an active creator",
        creator,
        onboardingComplete: true
      });
    }

    // Generate new onboarding link if incomplete
    const accountLink = await stripe.accountLinks.create({
      account: creator.payoutInfo,
      refresh_url: `${process.env.FRONTEND_URL}/onboarding-retry`,
      return_url: `${process.env.FRONTEND_URL}/creator-dashboard`,
      type: "account_onboarding",
    });

    return res.status(200).json({
      success: true,
      message: "Continue Stripe onboarding to activate your account",
      onboardingUrl: accountLink.url,
      creator,
      onboardingComplete: false
    });

  } catch (error) {
    console.error("[Existing Creator Handler Error]", error);
    return handleStripeError(error, res);
  }
};

//Centralized Stripe error handling

function handleStripeError(error, res) {
  // Stripe-specific errors
  if (error.type === "StripeInvalidRequestError") {
    return res.status(400).json({
      success: false,
      error: "Stripe configuration error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }

  // Generic server errors
  return res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};