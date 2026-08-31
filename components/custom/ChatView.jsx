"use client";
import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import { MessagesContext } from "@/context/MessagesContext";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import { api } from "@/convex/_generated/api";
import Colors from "@/data/Colors";
import Lookup from "@/data/Lookup";
import Prompt from "@/data/Prompt";
import axios from "axios";
import { useConvex, useMutation } from "convex/react";
import { ArrowUp, Loader, LockIcon } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Button } from "../ui/button";
import SignInDialog from "./SignInDialog";
import { toast } from "sonner";

// ──────────────────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────────────────

export const countToken = (inputText) => {
  try {
    if (typeof inputText !== "string") return 0;
    return inputText.trim().split(/\s+/).filter(Boolean).length;
  } catch {
    return 0;
  }
};

/** Strip code fences from AI chat responses — code should only appear in CodeView */
function stripCodeBlocks(text) {
  if (typeof text !== "string") return "";
  // Remove ```...``` blocks entirely
  return text.replace(/```[\s\S]*?```/g, "[Code generated — see editor →]").trim();
}

// ──────────────────────────────────────────────────────────
// ErrorBoundary
// ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("ChatView error:", error, info); }
  render() {
    if (this.state.hasError)
      return <div className="p-4 text-red-400 text-sm">Chat failed to load.</div>;
    return this.props.children;
  }
}

// ──────────────────────────────────────────────────────────
// Message bubble
// ──────────────────────────────────────────────────────────
function MessageBubble({ msg, userDetail }) {
  const isUser = msg.role === "user";
  const displayText = isUser ? msg.content : stripCodeBlocks(msg.content);

  return (
    <div className={`flex items-start gap-2.5 my-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {isUser && userDetail?.picture ? (
        <Image
          src={userDetail.picture}
          alt="You"
          width={28}
          height={28}
          className="rounded-full shrink-0 border border-[#ADFA1D]/40 mt-0.5"
        />
      ) : isUser ? (
        <div className="w-7 h-7 rounded-full bg-[#ADFA1D] flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-[#ADFA1D]/20">
          <span className="text-[10px] font-extrabold text-black">U</span>
        </div>
      ) : (
        <div className="w-7 h-7 rounded-xl bg-black border border-[#ADFA1D]/50 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(173,250,29,0.15)]">
          <span className="text-[9px] font-black text-[#ADFA1D] font-mono tracking-tighter">AI</span>
        </div>
      )}

      <div
        className={`max-w-[88%] min-w-0 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
          isUser
            ? "bg-[#ADFA1D] text-black font-medium rounded-tr-none border border-[#ADFA1D]"
            : "bg-[#111111] text-gray-200 border border-white/10 rounded-tl-none"
        }`}
      >
        <ReactMarkdown
          className="prose prose-sm prose-invert max-w-none break-words [&_pre]:hidden [&_code]:text-[#ADFA1D] [&_code]:bg-black/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_p]:my-1"
          components={{
            pre: () => (
              <span className="inline-flex items-center gap-1 text-[#ADFA1D] font-mono text-[11px] bg-black/60 px-2 py-1 rounded border border-[#ADFA1D]/30 my-1">
                ⚡ Code generated & updated in editor
              </span>
            ),
          }}
        >
          {displayText}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Main ChatView
// ──────────────────────────────────────────────────────────
function ChatView() {
  const { id } = useParams();
  const convex = useConvex();
  const { userDetail, setUserDetail } = useContext(UserDetailsContext);
  const { messages, setMessages } = useContext(MessagesContext);
  const [openDialog, setOpenDialog] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const updateMessagesMutation = useMutation(api.workspace.UpdateMessages);
  const updateTokensMutation = useMutation(api.users.UpdateToken);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Fetch workspace messages on mount
  const fetchWorkspaceData = useCallback(async () => {
    if (!id) return;
    try {
      const result = await convex.query(api.workspace.GetWorkspace, { workspaceId: id });
      if (result && Array.isArray(result.messages)) {
        setMessages(result.messages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching workspace data:", error);
    }
  }, [convex, id, setMessages]);

  useEffect(() => {
    if (id) {
      fetchWorkspaceData().catch(console.error);
    }
  }, [id, fetchWorkspaceData]);

  const processedUserPromptRef = useRef("");

  // Trigger AI response when last message is from user
  useEffect(() => {
    if (
      Array.isArray(messages) &&
      messages.length > 0 &&
      messages[messages.length - 1]?.role === "user"
    ) {
      const lastUserMsg = messages[messages.length - 1]?.content;
      // Prevent duplicate generation if this exact user prompt is already processing or was just processed
      if (processedUserPromptRef.current === `${id}-${messages.length}-${lastUserMsg}`) {
        return;
      }
      processedUserPromptRef.current = `${id}-${messages.length}-${lastUserMsg}`;
      fetchAiResponse(messages).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, id]);

  const fetchAiResponse = async (currentMessages) => {
    setLoading(true);
    try {
      const promptData = JSON.stringify(currentMessages || messages) + Prompt.CHAT_PROMPT;
      const response = await axios.post("/api/ai-chat", { prompt: promptData });

      if (!response?.data || typeof response.data.result !== "string") {
        throw new Error("Invalid AI response");
      }

      const aiMessage = { role: "ai", content: response.data.result };
      const updatedMessages = [...(Array.isArray(currentMessages || messages) ? (currentMessages || messages) : []), aiMessage];
      setMessages(updatedMessages);

      await updateMessagesMutation({ messages: updatedMessages, workspaceId: id });

      const tokenUsage = countToken(JSON.stringify(aiMessage));
      const currentToken = Number(userDetail?.token) || 0;
      const updatedToken = currentToken - tokenUsage;
      setUserDetail((prev) => ({ ...prev, token: updatedToken }));
      if (userDetail?._id) {
        await updateTokensMutation({ userId: userDetail._id, token: updatedToken });
      }
    } catch (error) {
      console.error("Error fetching AI response:", error?.response?.data || error);

      // Show a friendly error message in the chat instead of duplicate calls
      const status = error?.response?.status;
      const isOverload = status === 503 || status === 429 || /503|429|overload|quota|rate.?limit/i.test(error?.message || "");
      const errContent = isOverload
        ? "⚠️ The AI is currently overloaded. Please try again in a few seconds."
        : "⚠️ Something went wrong. Please try your message again.";

      setMessages((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        // Don't add duplicate error messages if the last one was already this error
        if (arr[arr.length - 1]?.content === errContent) return arr;
        return [...arr, { role: "ai", content: errContent }];
      });

      if (isOverload) {
        toast.error("AI is busy — please retry in a moment.", { duration: 4000 });
      }
    } finally {
      setLoading(false);
    }
  };


  const onGenerate = (input) => {
    const trimmed = input?.trim();
    if (!trimmed) return;
    if ((userDetail?.token ?? Infinity) < 10) {
      toast.error("You don't have enough tokens to generate a response.");
      return;
    }
    setMessages((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { role: "user", content: trimmed },
    ]);
    setUserInput("");
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full w-full min-h-0 overflow-hidden relative">

        {/* ── Header strip ── */}
        {messages.length > 0 && (
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-white/5 bg-[#0a0a0a]">
            <p className="text-xs text-gray-500 truncate">
              {messages[0]?.content?.slice(0, 60)}
            </p>
          </div>
        )}

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide px-3 py-3 flex flex-col gap-3 min-h-0">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
              <div className="w-12 h-12 rounded-xl bg-[#ADFA1D]/10 border border-[#ADFA1D]/30 flex items-center justify-center">
                <span className="text-[#ADFA1D] text-lg font-bold">AI</span>
              </div>
              <p className="text-gray-400 text-sm">Describe what you want to build and the AI will generate it for you.</p>
            </div>
          )}

          {Array.isArray(messages) &&
            messages.map((msg, idx) => (
              <MessageBubble key={idx} msg={msg} userDetail={userDetail} />
            ))}

          {loading && (
            <div className="flex items-center gap-2 px-2">
              <div className="w-6 h-6 rounded-full bg-[#ADFA1D]/20 border border-[#ADFA1D]/40 flex items-center justify-center shrink-0">
                <span className="text-[8px] font-bold text-[#ADFA1D]">AI</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5">
                <Loader className="h-3.5 w-3.5 animate-spin text-[#ADFA1D]" />
                <span className="text-xs text-gray-400">Generating...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area ── */}
        <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-white/5 bg-[#0a0a0a]">
          <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#ADFA1D]/40 transition-colors">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && userInput.trim()) {
                  e.preventDefault();
                  onGenerate(userInput);
                }
              }}
              placeholder={Lookup.INPUT_PLACEHOLDER || "What do you want to build?"}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 resize-none outline-none min-h-[44px] max-h-[120px] scrollbar-hide py-1"
              rows={1}
            />
            {/* Send button — always visible, disabled when empty */}
            <button
              onClick={() => onGenerate(userInput)}
              disabled={!userDetail || loading || !userInput.trim()}
              title="Send message (Enter)"
              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                userInput.trim() && userDetail && !loading
                  ? "bg-[#ADFA1D] text-black hover:bg-[#c8ff42] cursor-pointer"
                  : "bg-white/10 text-gray-500 cursor-not-allowed"
              }`}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>

        {/* ── Login overlay ── */}
        {!userDetail && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm gap-4 z-10">
            <LockIcon className="h-10 w-10 text-[#ADFA1D]" />
            <p className="text-white text-base font-semibold">Sign in to start building</p>
            <Button
              onClick={() => setOpenDialog(true)}
              className="px-5 py-2 bg-[#ADFA1D] text-black font-semibold rounded-lg hover:bg-[#c8ff42] transition-colors"
            >
              Sign In
            </Button>
          </div>
        )}
      </div>

      <SignInDialog openDialog={openDialog} closeDialog={(v) => setOpenDialog(v)} />
    </ErrorBoundary>
  );
}

export default ChatView;
