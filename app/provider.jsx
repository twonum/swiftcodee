"use client";

import React, { useState, useMemo } from "react";
import { ThemeProvider } from "next-themes";
import dynamic from "next/dynamic";
import { MessagesContext } from "@/context/MessagesContext";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useConvex, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ActionContext } from "@/context/ActionContext";
import { usePathname } from "next/navigation";

// Lazy load heavy components for faster initial load
const Header = dynamic(() => import("@/components/custom/Header"), {
  ssr: false,
});
const AppSideBar = dynamic(() => import("@/components/custom/AppSideBar"), {
  ssr: false,
});

function Provider({ children }) {
  const [messages, setMessages] = useState([]);
  const [action, setAction] = useState(null);
  const pathname = usePathname();

  // On workspace pages we don't render the global header/sidebar/footer
  const isWorkspace = pathname?.startsWith("/workspace/");

  // Retrieve user info from localStorage once.
  const storedUser = useMemo(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }, []);

  // Synchronize auth cookie
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const email = storedUser?.email;
      if (email) {
        document.cookie = `auth-token=${encodeURIComponent(email)}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
  }, [storedUser]);

  const userDetail = useQuery(
    api.users.GetUser,
    storedUser ? { email: storedUser.email } : undefined
  );

  React.useEffect(() => {
    if (typeof window !== "undefined" && userDetail?.email) {
      document.cookie = `auth-token=${encodeURIComponent(userDetail.email)}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [userDetail]);

  // Reset action when navigating away from workspace
  React.useEffect(() => {
    if (!isWorkspace) {
      setAction(null);
    }
  }, [isWorkspace]);

  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY}
    >
      <UserDetailsContext.Provider
        value={{ userDetail, setUserDetail: () => {} }}
      >
        <MessagesContext.Provider value={{ messages, setMessages }}>
          <ActionContext.Provider value={{ action, setAction }}>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              {isWorkspace ? (
                // Workspace: render ONLY children (full-screen, no global chrome)
                <>{children}</>
              ) : (
                // All other pages: render with Header + global sidebar
                <>
                  <Header />
                  <SidebarProvider defaultOpen={false}>
                    <AppSideBar />
                    {children}
                  </SidebarProvider>
                </>
              )}
            </ThemeProvider>
          </ActionContext.Provider>
        </MessagesContext.Provider>
      </UserDetailsContext.Provider>
    </GoogleOAuthProvider>
  );
}

export default Provider;
