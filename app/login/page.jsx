"use client";
import React, { useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useMutation } from "convex/react";
import uuid4 from "uuid4";
import { api } from "@/convex/_generated/api";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import Lookup from "@/data/Lookup";
import { Button } from "@/components/ui/button";
import StunningLoader from "@/components/StunningLoader";
import { useRouter } from "next/navigation";

// Container variants for dramatic entry/exit.
const containerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.1,
    rotate: 150,
    filter: "blur(25px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    filter: "blur(0px)",
    transition: {
      duration: 2,
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.1,
    rotate: -150,
    filter: "blur(25px)",
    transition: { duration: 1.2, ease: "easeInOut" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -50, y: 20, rotate: -15 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const pulseTitle = {
  animate: {
    textShadow: [
      "0px 0px 5px #ADFA1D",
      "0px 0px 20px #ADFA1D",
      "0px 0px 5px #ADFA1D",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const mainHeadingVariants = {
  hidden: { opacity: 0, filter: "blur(8px)", scale: 0.7, rotate: -15 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    rotate: 0,
    transition: { duration: 1.2, ease: "easeOut" },
  },
};

const FloatingParticle = ({ left, delay, size }) => (
  <motion.div
    className="absolute rounded-full bg-[#adfa1d]"
    style={{ width: size, height: size, left }}
    initial={{ top: "-10%", opacity: 0 }}
    animate={{ top: "110%", opacity: [0, 1, 0] }}
    transition={{ duration: 8, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const PulsatingOverlay = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none"
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.15 }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
      repeatType: "reverse",
    }}
    style={{
      backgroundImage:
        "linear-gradient(45deg, rgba(173,250,29,0.2) 25%, transparent 25%), linear-gradient(-45deg, rgba(173,250,29,0.2) 25%, transparent 25%)",
      backgroundSize: "50px 50px",
      backgroundPosition: "0 0, 25px 25px",
    }}
  />
);

function LoginPage() {
  const router = useRouter();
  const { userDetail, setUserDetail } = useContext(UserDetailsContext);
  const CreateUser = useMutation(api.users.CreateUser);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // This state controls whether to show the 3-second "Signing In..." after reload.
  const [postReloadLoading, setPostReloadLoading] = useState(false);

  // On mount, check if the flag is present. If so, show the loading screen for 3 seconds.
  useEffect(() => {
    if (localStorage.getItem("postReloadLoading") === "true") {
      setPostReloadLoading(true);
      setTimeout(() => {
        localStorage.removeItem("postReloadLoading");
        setPostReloadLoading(false);
      }, 3000);
    }
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // Immediately disable the button and show the loading state.
      setIsLoggingIn(true);

      // Retrieve user info from Google.
      const userInfo = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: "Bearer " + tokenResponse.access_token } }
      );
      const user = userInfo.data;

      // Create the user in your backend.
      await CreateUser({
        name: user?.name,
        email: user?.email,
        picture: user?.picture,
        uid: uuid4(),
      });

      // Save user data locally and in cookies.
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user));
        document.cookie = `auth-token=${encodeURIComponent(user.email)}; path=/; max-age=31536000; SameSite=Lax`;
      }
      setUserDetail(user);

      // Set flag so that after reload the "Signing In..." state is shown.
      localStorage.setItem("postReloadLoading", "true");
      // Reload the window immediately.
      window.location.reload();
    },
    onError: (errorResponse) => {
      console.log(errorResponse);
      // Reset the state if an error occurs.
      setIsLoggingIn(false);
    },
  });

  const handleButtonClick = () => {
    if (!userDetail && !isLoggingIn) {
      googleLogin();
    } else {
      router.push("/");
    }
  };

  // After reload, if the flag is present, show the "Signing In..." state.
  if (postReloadLoading) {
    return <StunningLoader />;
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden p-4">
      <FloatingParticle left="5%" delay={0} size={15} />
      <FloatingParticle left="30%" delay={1} size={20} />
      <FloatingParticle left="60%" delay={0.5} size={12} />
      <FloatingParticle left="85%" delay={1.2} size={18} />
      <FloatingParticle left="40%" delay={0.8} size={10} />
      <PulsatingOverlay />
      <AnimatePresence>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="p-8 bg-black bg-opacity-70 border border-[#ADFA1D] rounded-none shadow-xl max-w-3xl w-full mx-4"
        >
          <motion.div
            variants={mainHeadingVariants}
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="mb-4"
          >
            <h1
              className="text-5xl font-extrabold text-center"
              style={{ color: "#ADFA1D" }}
            >
              SwiftCodee
            </h1>
          </motion.div>
          <motion.div variants={itemVariants} {...pulseTitle} className="mb-4">
            <h2 className="text-3xl font-bold text-center">
              {Lookup.SIGNIN_HEADING}
            </h2>
          </motion.div>
          <motion.div
            className="flex flex-col items-center gap-4"
            variants={itemVariants}
          >
            <p className="text-center text-gray-300 text-lg">
              {Lookup.SIGNIN_SUBHEADING}
            </p>
            <motion.button
              onClick={handleButtonClick}
              disabled={isLoggingIn}
              className={`w-full max-w-md py-4 text-black text-xl bg-[#ADFA1D] transition duration-300 ease-in-out rounded-none ${
                isLoggingIn ? "opacity-50 cursor-not-allowed" : "hover:bg-white"
              }`}
              whileHover={
                !isLoggingIn
                  ? {
                      scale: 1.2,
                      rotate: 3,
                      boxShadow: "0px 0px 20px rgba(173, 250, 29, 0.8)",
                    }
                  : {}
              }
              whileTap={!isLoggingIn ? { scale: 0.85, rotate: -3 } : {}}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {isLoggingIn
                ? "Signing In..."
                : userDetail
                  ? "Start Building"
                  : "Sign In with Google"}
            </motion.button>
            <p className="text-center text-sm text-gray-500">
              {Lookup.SIGNIn_AGREEMENT_TEXT}
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default LoginPage;
