"use client";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import Lookup from "@/data/Lookup";
import React, { useContext, useState } from "react";
import PricingModel from "@/components/custom/PricingModel";
import { loadStripe } from "@stripe/stripe-js";
import { motion, AnimatePresence } from "framer-motion";

// Create a Stripe instance using your publishable key from .env.local
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

const pageVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
};

function Pricing() {
  const { userDetail } = useContext(UserDetailsContext);
  const [showModal, setShowModal] = useState(false);

  // Determine token message based on userDetail.token value
  let tokenMessage = "";
  if (userDetail?.token < 0) {
    tokenMessage = "You don't have tokens anymore";
  } else if (userDetail?.token === 1) {
    tokenMessage = "Only 1 token left";
  } else if (userDetail?.token < 15) {
    tokenMessage = "Only 15 tokens left";
  } else if (!userDetail) {
    tokenMessage = "Please log in to upgrade your plan.";
  } else {
    tokenMessage = `${userDetail.token} Tokens Left`;
  }

  // Scroll to pricing models section and show modal feedback
  const handleUpgradeClick = () => {
    setShowModal(true);
    setTimeout(() => {
      document
        .getElementById("pricing-models")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 500);
    setTimeout(() => {
      setShowModal(false);
    }, 3000);
  };

  // When a plan is selected, create a checkout session and redirect to Stripe
  const handleSelectPlan = async (planName) => {
    try {
      const currentUrl = typeof window !== "undefined" ? window.location.pathname : "/pricing";
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricingOption: planName,
          userId: userDetail._id,
          returnUrl: currentUrl,
        }),
      });
      const data = await response.json();
      if (data.sessionId) {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        if (error) {
          console.error("Stripe redirect error:", error);
        }
      } else {
        console.error("Failed to create checkout session", data.error);
      }
    } catch (err) {
      console.error("Error in handleSelectPlan:", err);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-black to-[#adfa1d78] flex flex-col items-center justify-center py-10 px-4 relative"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Main Heading with Stunning Animation */}
      <motion.h2
        className="text-5xl font-bold text-[#ADFA1D] drop-shadow-2xl"
        animate={{ scale: [0.8, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
      >
        Subscription Plans
      </motion.h2>
      {/* Description */}
      <motion.p
        className="text-gray-400 max-w-3xl mt-9 text-center tracking-wide font-medium text-lg font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        {Lookup.PRICING_DESC}
      </motion.p>
      <div className="mt-8">
        {/* Token Message with Animation */}
        <motion.h2
          className="p-5 border text-center border-gray-400 mt-5 text-2xl font-semibold bg-gradient-to-r from-[#ADFA1D] to-lime-500 text-transparent bg-clip-text drop-shadow-lg"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {tokenMessage}
        </motion.h2>
        {/* Call-to-Action Section */}
        <motion.div
          className="w-full flex flex-col items-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <motion.h2
            className="font-medium font-mono text-gray-400 text-center text-xl tracking-wide"
            animate={{ x: [-10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Need more tokens?
          </motion.h2>
          <motion.button
            onClick={handleUpgradeClick}
            whileHover={{ scale: 1.1, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 px-8 py-3 border border-[#ADFA1D] text-[#ADFA1D] font-semibold rounded-none transition-colors duration-300 hover:bg-[#ADFA1D] hover:text-black"
          >
            Upgrade your plan below with just one time payment!
          </motion.button>
        </motion.div>
      </div>
      {/* Pricing Models Section with Highlighted Border and Framer Motion */}
      <motion.div
        id="pricing-models"
        className="mt-10 border-2 border-[#ADFA1D] rounded-none p-5"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <PricingModel onSelectPlan={handleSelectPlan} />
      </motion.div>

      {/* Stunning Modal Overlay with Framer Motion */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="relative p-10 bg-black rounded-none border border-gray-400 shadow-2xl overflow-hidden">
              <motion.h2
                className="text-4xl font-bold text-[#ADFA1D] mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Taking you to the heavens!
              </motion.h2>
              <motion.p
                className="text-gray-400 text-xl font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Cooking up something special for you!
              </motion.p>
              {/* Confetti Animation Elements */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="confetti confetti-1"
                  animate={{ x: [0, 20, 0], y: [0, 100, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                ></motion.div>
                <motion.div
                  className="confetti confetti-2"
                  animate={{ x: [0, -20, 0], y: [0, 120, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                ></motion.div>
                <motion.div
                  className="confetti confetti-3"
                  animate={{ x: [0, 15, 0], y: [0, 80, 0] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                ></motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background-color: #adfa1d;
          border-radius: 50%;
        }
        @keyframes borderPulse {
          0% {
            box-shadow: 0 0 0px #adfa1d;
          }
          50% {
            box-shadow: 0 0 20px #adfa1d;
          }
          100% {
            box-shadow: 0 0 0px #adfa1d;
          }
        }
        .animate-borderPulse {
          animation: borderPulse 2s infinite;
        }
      `}</style>
    </motion.div>
  );
}

export default Pricing;
