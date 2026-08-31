"use client";
import React, { useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Lookup from "@/data/Lookup";
import { useGoogleLogin } from "@react-oauth/google";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import axios from "axios";
import { useMutation } from "convex/react";
import uuid4 from "uuid4";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";

// Hyper-extreme dialog container variants for dramatic compact entry/exit
const dialogVariants = {
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
function SignInDialog({ openDialog, closeDialog }) {
  const { userDetail, setUserDetail } = useContext(UserDetailsContext);
  const CreateUser = useMutation(api.users.CreateUser);
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log(tokenResponse);
      const userInfo = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: "Bearer " + tokenResponse.access_token } }
      );
      console.log(userInfo);
      const user = userInfo.data;
      await CreateUser({
        name: user?.name,
        email: user?.email,
        picture: user?.picture,
        uid: uuid4(),
      });
      if (typeof window !== "undefined") {
        // Store the full user object in localStorage.
        localStorage.setItem("user", JSON.stringify(user));
        // Set a cookie storing only the user's email, with encoding to ensure safe characters.
        document.cookie = `auth-token=${encodeURIComponent(user.email)}; path=/; max-age=31536000; SameSite=Lax`;
      }
      setUserDetail(userInfo?.data);
      closeDialog(false);
      window.location.reload();
    },
    onError: (errorResponse) => console.log(errorResponse),
  });

  return (
    <Dialog open={openDialog} onOpenChange={closeDialog}>
      <AnimatePresence>
        {openDialog && (
          <motion.div
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <DialogContent className="p-6 max-w-3xl">
              <DialogHeader>
                <motion.div
                  variants={mainHeadingVariants}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="mb-3"
                >
                  <h1
                    className="text-4xl font-extrabold text-center"
                    style={{ color: "#ADFA1D" }}
                  >
                    SwiftCodee
                  </h1>
                </motion.div>
                <motion.div variants={itemVariants} {...pulseTitle}>
                  <DialogTitle className="text-2xl font-bold text-center">
                    {Lookup.SIGNIN_HEADING}
                  </DialogTitle>
                </motion.div>
                <DialogDescription asChild>
                  <motion.div
                    className="flex flex-col items-center gap-3 mt-3"
                    variants={itemVariants}
                  >
                    <motion.p
                      className="text-center text-gray-700 text-base"
                      variants={itemVariants}
                    >
                      {Lookup.SIGNIN_SUBHEADING}
                    </motion.p>
                    <motion.div variants={itemVariants}>
                      <motion.button
                        onClick={googleLogin}
                        className="w-[400px] mx-auto py-3 text-black text-lg bg-[#ADFA1D] hover:bg-white transition duration-300 ease-in-out rounded-none"
                        whileHover={{
                          scale: 1.2,
                          rotate: 3,
                          boxShadow: "0px 0px 20px rgba(173, 250, 29, 0.8)",
                        }}
                        whileTap={{ scale: 0.85, rotate: -3 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        Sign In with Google
                      </motion.button>
                    </motion.div>
                    <motion.p
                      className="text-center text-sm text-gray-600"
                      variants={itemVariants}
                    >
                      {Lookup.SIGNIn_AGREEMENT_TEXT}
                    </motion.p>
                  </motion.div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

export default SignInDialog;
