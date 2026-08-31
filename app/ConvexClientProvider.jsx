"use client";
import React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

function ConvexClientProvider({ children }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    console.error("Missing NEXT_PUBLIC_CONVEX_URL. Make sure your .env.local includes the Convex URL and restart Next.js.");
    return <>{children}</>;
  }

  const convex = new ConvexReactClient(convexUrl);
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

export default ConvexClientProvider;
