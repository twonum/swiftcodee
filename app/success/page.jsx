"use client";
import React, { useContext, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const returnUrlParam = searchParams.get("returnUrl");
  const returnUrl = returnUrlParam ? decodeURIComponent(returnUrlParam) : "/pricing";

  const { userDetail, setUserData } = useContext(UserDetailsContext);
  const UpdateToken = useMutation(api.users.UpdateToken);

  useEffect(() => {
    const updateTokensAndRedirect = async () => {
      if (userDetail && sessionId) {
        try {
          // Retrieve the checkout session to access metadata
          const response = await fetch("/api/retrieve-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          const sessionData = await response.json();
          if (sessionData.metadata && sessionData.metadata.tokens) {
            const tokensToAdd = Number(sessionData.metadata.tokens);
            const updatedTokens = (Number(userDetail?.token) || 0) + tokensToAdd;
            console.log("Updated tokens:", updatedTokens);
            await UpdateToken({
              token: updatedTokens,
              userId: userDetail?._id,
            });
          }
        } catch (error) {
          console.error("Error updating tokens on success:", error);
        }
      }
      // Redirect back to original page (or pricing) after a delay
      setTimeout(() => {
        router.push(returnUrl);
      }, 5000);
    };

    updateTokensAndRedirect();
  }, [router, userDetail, sessionId, UpdateToken, setUserData, returnUrl]);

  // Determine the token message based on the updated token value.
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
    tokenMessage = `You have ${userDetail.token} Tokens!`;
  }

  return (
    <div className="success-page-container">
      <div className="overlay">
        <motion.div
          className="token-box p-8 border border-[#adfa1d] bg-black bg-opacity-70 rounded-none shadow-2xl"
          initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            duration: 1,
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
        >
          <h1 className="title">Tokens Updated!</h1>
          <p className="subtitle">{tokenMessage}</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => router.push(returnUrl)}
              className="px-6 py-2.5 bg-[#ADFA1D] text-black font-bold rounded hover:bg-[#c8ff42] transition-colors cursor-pointer text-sm"
            >
              Continue to {returnUrl === "/pricing" ? "Pricing" : "Workspace"}
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 border border-[#ADFA1D] text-[#ADFA1D] font-bold rounded hover:bg-[#ADFA1D]/10 transition-colors cursor-pointer text-sm"
            >
              Home
            </button>
          </div>
        </motion.div>
        <p className="redirect-msg">Redirecting back in 5 seconds...</p>
        <div className="animation-container">
          <div className="confetti confetti-1"></div>
          <div className="confetti confetti-2"></div>
          <div className="confetti confetti-3"></div>
          <div className="sparkle sparkle-1"></div>
          <div className="sparkle sparkle-2"></div>
          <div className="sparkle sparkle-3"></div>
          <div className="sparkle sparkle-4"></div>
          <div className="sparkle sparkle-5"></div>
          <div className="burst burst-1"></div>
          <div className="burst burst-2"></div>
          <div className="burst burst-3"></div>
          <div className="burst burst-4"></div>
          <div className="burst burst-5"></div>
          <div className="extra-glow"></div>
          <div className="detail detail-1"></div>
          <div className="detail detail-2"></div>
          <div className="detail detail-3"></div>
          <div className="detail detail-4"></div>
          <div className="detail detail-5"></div>
        </div>
      </div>
      <style jsx>{`
        /* Container Styles */
        .success-page-container {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(to bottom, #000, #adfa1d78);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          z-index: 1000;
        }
        /* Overlay Container */
        .overlay {
          position: relative;
          background-color: rgba(0, 0, 0, 0.85);
          padding: 3rem;
          border: 2px solid #adfa1d;
          border-radius: 0;
          box-shadow: 0 0 20px #adfa1d;
          animation: pulseBorder 2s infinite;
        }
        @keyframes pulseBorder {
          0% {
            box-shadow: 0 0 0px #adfa1d;
          }
          50% {
            box-shadow: 0 0 30px #adfa1d;
          }
          100% {
            box-shadow: 0 0 0px #adfa1d;
          }
        }
        /* Title & Subtitle */
        .title {
          font-size: 3rem;
          color: #adfa1d;
          margin-bottom: 1rem;
          animation: bounceIn 1.5s ease-out;
        }
        .subtitle {
          font-size: 1.75rem;
          color: #fff;
          margin-bottom: 2rem;
          animation: fadeInText 2s ease-out;
        }
        @keyframes bounceIn {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          60% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes fadeInText {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .redirect-msg {
          font-size: 1rem;
          color: #fff;
          margin-top: 1rem;
        }
        /* Animation Container */
        .animation-container {
          position: relative;
          width: 100%;
          height: 200px;
          margin-top: 1rem;
        }
        /* Confetti Animations */
        @keyframes confetti-fall {
          0% {
            transform: translateY(-150px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(250px) rotate(360deg);
            opacity: 0;
          }
        }
        .confetti {
          position: absolute;
          width: 12px;
          height: 12px;
          background-color: #adfa1d;
          border-radius: 0;
          animation: confetti-fall 3s infinite ease-in-out;
        }
        .confetti-1 {
          left: 10%;
          animation-delay: 0s;
        }
        .confetti-2 {
          left: 45%;
          animation-delay: 0.5s;
        }
        .confetti-3 {
          left: 80%;
          animation-delay: 1s;
        }
        /* Sparkle Animations */
        @keyframes sparkle {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.5);
            opacity: 1;
          }
          100% {
            transform: scale(0.5);
            opacity: 0;
          }
        }
        .sparkle {
          position: absolute;
          width: 14px;
          height: 14px;
          background-color: #fff;
          border-radius: 50%;
          animation: sparkle 2.5s infinite ease-in-out;
        }
        .sparkle-1 {
          top: 10%;
          left: 30%;
          animation-delay: 0.2s;
        }
        .sparkle-2 {
          top: 50%;
          left: 70%;
          animation-delay: 0.4s;
        }
        .sparkle-3 {
          top: 70%;
          left: 40%;
          animation-delay: 0.6s;
        }
        .sparkle-4 {
          top: 20%;
          left: 60%;
          animation-delay: 0.8s;
        }
        .sparkle-5 {
          top: 60%;
          left: 20%;
          animation-delay: 1s;
        }
        /* Burst Animations */
        @keyframes burst {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(0);
            opacity: 0;
          }
        }
        .burst {
          position: absolute;
          width: 20px;
          height: 20px;
          background-color: #adfa1d;
          border: 2px solid #fff;
          border-radius: 0;
          animation: burst 2s infinite ease-in-out;
        }
        .burst-1 {
          top: 5%;
          left: 50%;
          animation-delay: 0s;
        }
        .burst-2 {
          top: 40%;
          left: 10%;
          animation-delay: 0.3s;
        }
        .burst-3 {
          top: 80%;
          left: 60%;
          animation-delay: 0.6s;
        }
        .burst-4 {
          top: 30%;
          left: 80%;
          animation-delay: 0.9s;
        }
        .burst-5 {
          top: 65%;
          left: 35%;
          animation-delay: 1.2s;
        }
        /* Extra Glow */
        .extra-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle,
            rgba(173, 250, 29, 0.3),
            transparent
          );
          z-index: -1;
          animation: glowPulse 4s infinite ease-in-out;
        }
        @keyframes glowPulse {
          0% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 0.3;
          }
        }
        /* Floating Detail Elements */
        .detail {
          position: absolute;
          background-color: #adfa1d;
          opacity: 0.5;
          animation: floatDetail 5s infinite ease-in-out;
        }
        @keyframes floatDetail {
          0% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(20px, 20px);
          }
          100% {
            transform: translate(0, 0);
          }
        }
        .detail-1 {
          width: 8px;
          height: 8px;
          top: 15%;
          left: 20%;
          animation-delay: 0.1s;
        }
        .detail-2 {
          width: 10px;
          height: 10px;
          top: 40%;
          left: 30%;
          animation-delay: 0.3s;
        }
        .detail-3 {
          width: 12px;
          height: 12px;
          top: 70%;
          left: 50%;
          animation-delay: 0.5s;
        }
        .detail-4 {
          width: 8px;
          height: 8px;
          top: 30%;
          left: 80%;
          animation-delay: 0.7s;
        }
        .detail-5 {
          width: 10px;
          height: 10px;
          top: 60%;
          left: 10%;
          animation-delay: 0.9s;
        }
        /* Background Pattern */
        .background-pattern {
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(173, 250, 29, 0.1) 10px,
            rgba(173, 250, 29, 0.1) 20px
          );
          z-index: -2;
          opacity: 0.2;
        }
      `}</style>
      <div className="background-pattern"></div>
    </div>
  );
}
