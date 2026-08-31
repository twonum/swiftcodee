// /api/create-checkout-session.js
import Stripe from "stripe";
import { NextResponse } from "next/server";
import Lookup from "@/data/Lookup";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function POST(req) {
  try {
    const { pricingOption, userId, returnUrl } = await req.json();
    console.log("Received checkout session request:", { pricingOption, userId, returnUrl });

    // Look up the pricing product from your Lookup file
    const product = Lookup.PRICING_OPTIONS.find((p) => p.name === pricingOption);
    if (!product) {
      console.error("Invalid pricing option:", pricingOption);
      return NextResponse.json(
        { error: "Invalid pricing option" },
        { status: 400 }
      );
    }

    // Map the pricing option to the corresponding Stripe Price ID.
    // You can add the priceId to your Lookup file in the future.
    const priceMapping = {
      "Basic": "price_1QsJ7OJClRuYWlVdoOiv9TxP",
      "Starter": "price_1QsJaQJClRuYWlVdPgxPs2zW",
      "Pro": "price_1QsJZ5JClRuYWlVdDACE7zFy",
      "Unlimted (License)": "price_1QsJHrJClRuYWlVdAOKvBMzB",
    };
    const priceId = priceMapping[pricingOption];
    if (!priceId) {
      console.error("PriceId not found for pricing option:", pricingOption);
      return NextResponse.json(
        { error: "Invalid pricing option" },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const encodedReturn = returnUrl ? encodeURIComponent(returnUrl) : encodeURIComponent("/pricing");

    // Create a Stripe Checkout session and pass tokens in metadata.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        tokens: product.value.toString(), // product.value comes from Lookup
        pricingOption,
        returnUrl: returnUrl || "/pricing",
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&returnUrl=${encodedReturn}`,
      cancel_url: `${origin}/pricing`,
    });

    console.log("Checkout session created:", session.id);
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
