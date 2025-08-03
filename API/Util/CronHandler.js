import cron from "node-cron";
import Subscription from "../../Models/Subscription.js";
import dotenv from "dotenv";
import Stripe from "stripe";
import {Creator} from "../../Models/Creator.js";

cron.schedule("0 0 * * *", async() => {
    console.log("Running daily subscription expiration check");

    const now = new Date();
    try {
        const expiredSubs = await Subscription.find({
            endDate : {$lt:now},
            active : true,
        });

        for (const sub of expiredSubs) {
            sub.active = false;
            await sub.save();

            const creator = await Creator.findById(sub.creatorId);
            if(creator) {
                /*creator.subscribers = creator.subscribers.filter(
                    id => id.toString() != sub.subscriber.toString()
                );
                await creator.save();*/

                console.log(`Expired: Removed Subscriber ${sub.subscriber} from creator ${creator._id}`);
            } else {
                console.log(`Creator not found for subscription ${sub._id}`);
            }
        }

        if (expiredSubs.length === 0) {
            console.log("No expired subscriptions found today.");
        }
    } catch (error) {
        console.error("Error in subscription expiration",error.message);
    }
});

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//export const runPayoutJob=   
cron.schedule("0 0 * * *", 
    async()=>{
    console.log("Running payout cron:",new Date().toISOString());

    try {
        const creators = await Creator.find({
            earnings : {$gt: 0},
            stripeAccountId: {$exists: true},
        });

        for (const creator of creators) {
            const payout = Math.floor(creator.earnings);
            if (payout <= 0) continue;

            await stripe.transfers.create({
                amount: payout,
                currency: "usd",
                destination: creator.stripeAccountId,
            });

            console.log(`Transferred $${payout/100} to ${creator.stripeAccountId} named ${creator.username}`);
            creator.earnings = 0;
            await creator.save();
        }
        console.log("Payout completed");
    } catch (error) {
        console.error("Payout cron failed:",error.message);
    }
}
);