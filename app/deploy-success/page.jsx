"use client";

import React, { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Check, ExternalLink, ArrowLeft, Home, Code2 } from "lucide-react";

function DeploySuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deployUrl = searchParams.get("url") || "";
  const sandboxId = searchParams.get("sandbox") || "";

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(deployUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = deployUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-black">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        initial={{ backgroundPosition: "0% 50%" }}
        animate={{ backgroundPosition: "100% 50%" }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          background: "linear-gradient(270deg, #000, #111, #0a1a00, #1a2a00, #000)",
          backgroundSize: "600% 600%",
        }}
      />

      {/* Glowing ring */}
      <motion.div
        className="absolute rounded-full border border-[#ADFA1D]/20"
        style={{ width: 600, height: 600 }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main card */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
          className="relative z-10 bg-[#0a0a0a] border border-[#ADFA1D]/40 shadow-2xl shadow-[#ADFA1D]/10 rounded-2xl max-w-xl w-full p-8 space-y-6"
        >
          {/* Success icon */}
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            <div className="w-20 h-20 rounded-full bg-[#ADFA1D]/10 border-2 border-[#ADFA1D] flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Check className="h-10 w-10 text-[#ADFA1D]" />
              </motion.div>
            </div>
          </motion.div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-[#ADFA1D]">Deployed! 🚀</h1>
            <p className="text-gray-400 text-base">Your web app is live and ready to share.</p>
          </div>

          {/* URL display */}
          {deployUrl && (
            <div className="bg-black/60 border border-[#ADFA1D]/20 rounded-xl p-4 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-widest">Live URL</p>
              <p className="text-[#ADFA1D] font-mono text-sm break-all leading-relaxed">
                {deployUrl}
              </p>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleCopy}
                  className="flex-1 bg-[#ADFA1D] text-black hover:bg-[#c8ff42] font-semibold transition-all"
                >
                  {copied ? (
                    <><Check className="h-4 w-4 mr-2" /> Copied!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-2" /> Copy URL</>
                  )}
                </Button>
                <Button
                  onClick={() => window.open(deployUrl, "_blank", "noopener,noreferrer")}
                  variant="outline"
                  className="flex-1 border-[#ADFA1D]/40 text-[#ADFA1D] hover:bg-[#ADFA1D]/10 transition-all"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open App
                </Button>
              </div>
            </div>
          )}

          {/* Navigation options */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 border-white/10 text-white hover:border-[#ADFA1D]/50 hover:text-[#ADFA1D] hover:bg-[#ADFA1D]/5 transition-all text-xs"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 border-white/10 text-white hover:border-[#ADFA1D]/50 hover:text-[#ADFA1D] hover:bg-[#ADFA1D]/5 transition-all text-xs"
            >
              <Home className="h-5 w-5" />
              Home
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 border-white/10 text-white hover:border-[#ADFA1D]/50 hover:text-[#ADFA1D] hover:bg-[#ADFA1D]/5 transition-all text-xs"
            >
              <Code2 className="h-5 w-5" />
              Edit Code
            </Button>
          </div>

          <p className="text-center text-xs text-gray-600">
            This page will stay open until you navigate away.
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const DeploySuccessPage = () => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-screen bg-black text-[#ADFA1D]">
      Loading...
    </div>
  }>
    <DeploySuccessContent />
  </Suspense>
);

export default DeploySuccessPage;
