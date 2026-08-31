"use client";
import React, { useState, useContext } from "react";
import { ArrowRight, Loader } from "lucide-react";
import SignInDialog from "./SignInDialog";
import { MessagesContext } from "@/context/MessagesContext";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Colors from "@/data/Colors";
import Lookup from "@/data/Lookup";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Container variants for the entire hero section.
const heroContainerVariants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { staggerChildren: 0.2, duration: 1.2, ease: "easeOut" },
  },
};

// Variants for the hero heading with entrance.
const headingVariants = {
  hidden: { opacity: 0, y: -100, rotateX: -45, rotate: -15 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    rotate: 0,
    transition: { type: "spring", stiffness: 150, damping: 10 },
  },
};

// Variants for the hero description.
const descriptionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.4, duration: 1, ease: "easeOut" },
  },
};

// Variants for suggestion items.
const suggestionVariants = {
  hidden: { opacity: 0, x: -100, rotate: -20 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

// Floating decorative blob
const FloatingBlob = () => (
  <motion.div
    className="absolute z-[-1] rounded-full pointer-events-none"
    style={{
      width: 250,
      height: 250,
      background: "radial-gradient(circle, #adfa1d, transparent)",
    }}
    initial={{ x: -150, y: -100, opacity: 0 }}
    animate={{ x: 150, y: 100, opacity: 0.15 }}
    transition={{
      duration: 12,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
    }}
  />
);

// Pulsating gradient overlay
const PulsatingOverlay = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none"
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.1 }}
    transition={{
      duration: 3,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    }}
    style={{
      background: "linear-gradient(45deg, rgba(173,250,29,0.2), transparent 70%)",
    }}
  />
);

function Hero() {
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { setMessages } = useContext(MessagesContext);
  const { userDetail } = useContext(UserDetailsContext);
  const [openDialog, setOpenDialog] = useState(false);
  const CreateWorkspace = useMutation(api.workspace.CreateWorkspace);
  const router = useRouter();

  const onGenerate = async (input) => {
    if (isGenerating) return;

    if (!userDetail?.name) {
      setOpenDialog(true);
      return;
    }
    if ((userDetail?.token ?? Infinity) < 10) {
      toast.error("You don't have enough tokens to generate a response.");
      return;
    }

    const trimmedInput = input?.trim();
    if (!trimmedInput) return;

    setIsGenerating(true);
    const msg = { role: "user", content: trimmedInput };
    setMessages([msg]);

    try {
      const workspaceId = await CreateWorkspace({
        user: userDetail._id,
        messages: [msg],
      });
      console.log("Workspace ID:", workspaceId);
      // Append ?new=true so that middleware bypasses ownership check for this first load
      router.push(`/workspace/${workspaceId}?new=true`);
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create workspace. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="hero-wrapper w-full min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #000, #000)" }}
    >
      {/* Extra Floating Elements */}
      <FloatingBlob />
      <PulsatingOverlay />

      <motion.div
        className="hero-container flex flex-col items-center gap-4 text-center relative z-10 w-full max-w-4xl"
        variants={heroContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2
          className="hero-heading text-4xl sm:text-5xl md:text-6xl font-bold text-[#ADFA1D] shadow-lg tracking-tight"
          variants={headingVariants}
          animate={{
            textShadow: "0px 0px 20px rgba(173, 250, 29, 0.4)",
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {Lookup.HERO_HEADING}
        </motion.h2>
        <motion.p
          className="hero-description text-sm sm:text-base md:text-lg text-gray-400 font-medium max-w-3xl"
          variants={descriptionVariants}
        >
          {Lookup.HERO_DESC}
        </motion.p>

        {/* Input box */}
        <div
          className="input-container p-4 sm:p-5 border-2 border-[#ADFA1D]/60 rounded-xl max-w-2xl w-full mt-3 bg-[#0d0d0d] shadow-[0_0_25px_rgba(173,250,29,0.15)] focus-within:border-[#ADFA1D] focus-within:shadow-[0_0_35px_rgba(173,250,29,0.3)] transition-all duration-300"
        >
          <div className="input-inner flex flex-col sm:flex-row gap-2 relative">
            <textarea
              autoComplete="off"
              disabled={isGenerating}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && userInput.trim() && !isGenerating) {
                  e.preventDefault();
                  onGenerate(userInput);
                }
              }}
              className="hero-textarea outline-none bg-transparent resize-none w-full h-28 sm:h-32 md:h-36 max-h-56 text-base text-white placeholder-gray-500 font-sans"
              placeholder={Lookup.INPUT_PLACEHOLDER}
              value={userInput}
            />
            {userInput.trim() && (
              <div className="self-end sm:self-auto flex items-end">
                <button
                  type="button"
                  disabled={isGenerating || !userInput.trim()}
                  onClick={() => onGenerate(userInput)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
                    isGenerating
                      ? "bg-[#ADFA1D]/50 text-black cursor-not-allowed opacity-80"
                      : "bg-[#ADFA1D] text-black hover:bg-[#c8ff42] hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-[#ADFA1D]/20"
                  }`}
                  title="Generate application"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin text-black" />
                      <span className="text-xs font-semibold">Creating...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-5 w-5 text-black stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Suggestion pills */}
        <motion.div
          className="suggestions-container flex flex-wrap max-w-2xl items-center justify-center gap-2.5 mt-4"
          variants={suggestionVariants}
        >
          {Lookup.SUGGSTIONS.map((suggestion, index) => (
            <button
              key={index}
              disabled={isGenerating}
              onClick={() => onGenerate(suggestion)}
              className="suggestion-item p-1.5 px-3 border border-[#ADFA1D]/30 rounded-lg text-xs sm:text-sm text-gray-300 bg-white/5 hover:border-[#ADFA1D] hover:bg-[#ADFA1D]/10 hover:text-[#ADFA1D] transition duration-200 ease-in-out cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {suggestion}
            </button>
          ))}
        </motion.div>
      </motion.div>
      <SignInDialog
        openDialog={openDialog}
        closeDialog={(v) => setOpenDialog(v)}
      />
      {/* Extra placeholder lines for design (animated fade-in) */}
      <motion.div
        className="extra-lines flex flex-col gap-1 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="extra-line h-1 bg-[#adfa1d]"
            initial={{ scaleX: 0, rotate: -10 }}
            animate={{ scaleX: 1, rotate: 0 }}
            transition={{ delay: 1 + i * 0.2, duration: 0.5, ease: "easeOut" }}
          />
        ))}
      </motion.div>

      <style jsx>{`
        .hero-wrapper {
          /* Background already set inline */
        }
        .hero-container {
          padding: 0 1rem;
        }
        .hero-heading {
          transition: transform 0.3s ease;
          text-shadow: 1px 1px 4px rgba(173, 250, 29, 0.5);
        }
        .input-container {
          border: 2px solid #adfa1d;
          transition: box-shadow 0.3s ease;
        }
        .hero-textarea {
          font-size: 1.1rem;
        }
        .hero-arrow {
          transition: opacity 0.2s ease;
        }
        .hero-arrow:hover {
          opacity: 0.9;
        }
        .suggestion-item {
          border: 1px solid #adfa1d;
        }
        @media (max-width: 768px) {
          .hero-heading {
            font-size: 3rem;
          }
          .hero-description {
            font-size: 1rem;
          }
          .input-container {
            padding: 1rem;
          }
          .hero-textarea {
            font-size: 0.95rem;
          }
        }
        @media (max-width: 480px) {
          .hero-heading {
            font-size: 2.5rem;
          }
          .hero-description {
            font-size: 0.9rem;
          }
          .input-container {
            padding: 0.8rem;
          }
          .hero-textarea {
            font-size: 0.85rem;
            height: 110px;
          }
        }
      `}</style>
    </div>
  );
}

export default Hero;
