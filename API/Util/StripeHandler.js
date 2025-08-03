import Stripe from "stripe";
import dotenv from "dotenv";
import { Creator } from "../../Models/Creator.js";
import Base from "../../Models/Base.js";
import Subscription from "../../Models/Subscription.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body,sig,process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.log("Webhook signature error",error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  //handle success checkout
  if(event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      //console.log("Checkout session received: ",session);

      const email = session.customer_email;
      const creatorId = session.metadata.creatorId;
      const total = session.amount_total;
      console.log(total);

      if (!email || !creatorId) {
        console.error("Missing email or creatorId in session");
        return res.status(400).send("Invalid session data");
      }
    
      const user = await Base.findOne({email});
      if(!user) return res.status(404).json({message: "User not found"});

      console.log("Session metadata:", session.metadata);
      const creator = await Creator.findById(creatorId);
      if(!creator) return res.status(404).json({message: "Creator not found"});

      //prevent duplicate sub
      const existing = await Subscription.findOne({
        subscriberId : user._id,
        creatorId : creator._id,
        active : true,
      });
      if (existing) return res.status(200).json({message: "Already subscribed"});

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);

      await Subscription.create({
        subscriberId : user._id,
        creatorId : creator._id,
        startDate,
        endDate,
      });

      //creator.subscribers.push(user._id);
      creator.earnings += total * 0.0085;
      await creator.save();

      console.log("Subscription created for ", email);
      return res.status(200).send("success");
    } catch (error) {
      console.error("Subscription creation failed: ", error);
      return res.status(500).send("server error");
    }
   }

   if (event.type === 'account.updated') {
    const account = event.data.object;
      try {
        const creator = await Creator.findOne({payoutInfo:  account.id});
        if(creator) {
          const isOnboardingComplete = account.charges_enabled && account.payouts_enabled;
            if(creator.onboardingComplete !== isOnboardingComplete) {
              creator.onboardingComplete = isOnboardingComplete;
              await creator.save();
              console.log(`Updated onboarding status for creator ${creator._id}`);
            }
        }
      } catch (error) {
        console.error("Error processing account update: ",error);
      }
   }
  return  res.sendStatus(200);
};

export const createCheckoutSession = async (creator, email) => {
    return await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Subscribe to ${creator.username}`,
            },
            unit_amount: creator.fee*100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        creatorId: creator.id.toString(),
      },
      success_url: `${process.env.REQ_ORIGIN}/success`,
      cancel_url: `${process.env.REQ_ORIGIN}/cancel`,
    });
};

  // Handles retrying Stripe onboarding for existing creators
export const retryStripeOnboarding = async (req, res) => {
    try {
      const userId = req.user.id;
      const creator = await Creator.findById(userId);
  
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
        refresh_url: `${process.env.REQ_ORIGIN}/onboarding-retry`,
        return_url: `${process.env.REQ_ORIGIN}/creator-dashboard`,
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
      const creator = await Creator.findById(req.user.id);
  
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
  
export const handleExistingCreator= async(creator, res) => {
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
  
export const handleStripeError = (error, res) => {
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