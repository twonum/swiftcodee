"use client";
import React, { useContext, useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import { MessagesContext } from "@/context/MessagesContext";
import { ActionContext } from "@/context/ActionContext";
import ChatView from "@/components/custom/ChatView";
import CodeView from "@/components/custom/CodeView";
import SignInDialog from "@/components/custom/SignInDialog";
import {
  MessageSquarePlus,
  History,
  ChevronRight,
  X,
  PanelLeftOpen,
  LogOut,
  CreditCard,
  Mail,
  Settings,
  ExternalLink,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────── */
/*  Custom Workspace Sidebar                                        */
/* ──────────────────────────────────────────────────────────────── */

function WorkspaceSidebar({ open, onClose, workspaceId }) {
  const router = useRouter();
  const { userDetail, setUserDetail } = useContext(UserDetailsContext);
  const [openDialog, setOpenDialog] = useState(false);

  const workspaceList =
    useQuery(
      api.workspace.GetAllWorkspace,
      userDetail ? { userId: userDetail._id } : undefined
    ) ?? [];

  const handleSignOut = () => {
    localStorage.removeItem("user");
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = "/";
  };

  const menuItems = [
    { icon: History, label: "Recent Chats", href: "/recent-chats" },
    { icon: CreditCard, label: "Subscriptions", href: "/pricing" },
    { icon: Mail, label: "Contact", href: "/contact" },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#0a0a0a] border-r border-[#ADFA1D]/30 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#ADFA1D]/20">
          <Link
            href="/"
            className="text-2xl font-extrabold text-[#ADFA1D] tracking-tight hover:opacity-80 transition-opacity"
          >
            SwiftCodee
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={() => {
              router.push("/");
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#ADFA1D]/10 border border-[#ADFA1D]/30 text-[#ADFA1D] font-semibold text-sm hover:bg-[#ADFA1D]/20 transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        {/* Recent chats list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-hide">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 px-1">Recent</p>
          {!userDetail ? (
            <div className="text-xs text-gray-600 text-center py-4">
              Sign in to see your chats
            </div>
          ) : workspaceList.length === 0 ? (
            <div className="text-xs text-gray-600 text-center py-4">
              No chats yet
            </div>
          ) : (
            workspaceList.slice(0, 20).map((ws) => (
              <Link
                key={ws._id}
                href={`/workspace/${ws._id}`}
                onClick={onClose}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs mb-1 transition-colors group ${
                  ws._id === workspaceId
                    ? "bg-[#ADFA1D]/10 text-[#ADFA1D] border border-[#ADFA1D]/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <ChevronRight className="h-3 w-3 shrink-0 text-[#ADFA1D]/50 group-hover:text-[#ADFA1D]" />
                <span className="truncate">
                  {ws.messages?.[0]?.content?.slice(0, 40) || "Untitled"}
                </span>
              </Link>
            ))
          )}
        </div>

        {/* Footer menu */}
        <div className="border-t border-[#ADFA1D]/20 px-3 py-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}

          {userDetail ? (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => setOpenDialog(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#ADFA1D] hover:bg-[#ADFA1D]/10 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Sign In
            </button>
          )}

          {userDetail && (
            <div className="flex items-center gap-2 px-3 py-2 mt-1 border-t border-white/5">
              {userDetail.picture && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userDetail.picture}
                  alt="avatar"
                  className="w-7 h-7 rounded-full"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs text-white font-medium truncate">{userDetail.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{userDetail.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      <SignInDialog
        openDialog={openDialog}
        closeDialog={(v) => setOpenDialog(v)}
      />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/*  Workspace Page                                                  */
/* ──────────────────────────────────────────────────────────────── */

export default function Workspace() {
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { setMessages } = useContext(MessagesContext);
  const { setAction } = useContext(ActionContext);

  // Reset state when navigating to a new workspace
  useEffect(() => {
    setMessages([]);
    setAction(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="flex h-screen w-screen bg-[#0d0d0d] overflow-hidden">
      {/* Custom sidebar */}
      <WorkspaceSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        workspaceId={id}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top workspace bar */}
        <header className="flex-shrink-0 h-11 flex items-center gap-3 px-3 bg-[#0a0a0a] border-b border-[#ADFA1D]/20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded text-[#ADFA1D] hover:bg-[#ADFA1D]/10 transition-colors"
            title="Toggle sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
          <Link
            href="/"
            className="text-lg font-extrabold text-[#ADFA1D] tracking-tight hover:opacity-80 transition-opacity"
          >
            SwiftCodee
          </Link>
          <div className="h-4 w-px bg-[#ADFA1D]/20 mx-1" />
          <span className="text-xs text-gray-500">Workspace</span>
        </header>

        {/* Chat + Code area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Chat panel */}
          <div className="w-[320px] xl:w-[360px] flex-shrink-0 border-r border-[#ADFA1D]/15 bg-[#0a0a0a] flex flex-col overflow-hidden">
            <ChatView />
          </div>

          {/* Code / Preview panel */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <CodeView />
          </div>
        </div>
      </div>
    </div>
  );
}
