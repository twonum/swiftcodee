"use client";

import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";
import Lookup from "@/data/Lookup";
import axios from "axios";
import { MessagesContext } from "@/context/MessagesContext";
import Prompt from "@/data/Prompt";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Code, Download, Loader, LockIcon, RefreshCw, Send, LayoutTemplate } from "lucide-react";
import { countToken } from "./ChatView";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import { Button } from "../ui/button";
import SignInDialog from "./SignInDialog";
import SandpankPreviewClient from "./SandpankPreviewClient";
import { ActionContext } from "@/context/ActionContext";
import { toast } from "sonner";

// ── ErrorBoundary ──────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("CodeView error:", error, info); }
  render() {
    if (this.state.hasError)
      return (
        <div className="flex items-center justify-center h-full text-red-400 p-4 text-sm">
          Editor failed to load. Please refresh.
        </div>
      );
    return this.props.children;
  }
}

// ── File normalisation ─────────────────────────────────────────
function normalizeFiles(rawFiles) {
  const merged = { ...Lookup.DEFAULT_FILE, ...rawFiles };

  if (merged["/App.jsx"]) {
    merged["/App.js"] = merged["/App.jsx"];
    delete merged["/App.jsx"];
  } else if (merged["/src/App.jsx"] || merged["/src/App.js"]) {
    const srcApp = merged["/src/App.jsx"] || merged["/src/App.js"];
    if (!merged["/App.js"]) merged["/App.js"] = srcApp;
    delete merged["/src/App.jsx"];
    delete merged["/src/App.js"];
  }

  // Force ALL files to be editable — Sandpack template sometimes marks files readOnly
  const result = {};
  for (const [path, file] of Object.entries(merged)) {
    if (typeof file === "string") {
      result[path] = { code: file, readOnly: false };
    } else if (file && typeof file === "object") {
      result[path] = { ...file, readOnly: false };
    } else {
      result[path] = file;
    }
  }
  return result;
}

// ── Main component ─────────────────────────────────────────────
function CodeView() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("code");
  const [files, setFiles] = useState(normalizeFiles({}));
  const [loading, setLoading] = useState(false);
  // Track whether we've loaded files from the server (not just defaults)
  const [filesReady, setFilesReady] = useState(false);
  const containerRef = useRef(null);
  const [editorHeight, setEditorHeight] = useState(500);

  const { action, setAction } = useContext(ActionContext);
  const { messages } = useContext(MessagesContext);
  const { userDetail, setUserDetail } = useContext(UserDetailsContext);
  const [openDialog, setOpenDialog] = useState(false);

  const convex = useConvex();
  const updateFilesMutation = useMutation(api.workspace.UpdateFiles);
  const updateTokensMutation = useMutation(api.users.UpdateToken);

  // ── Measure container height for Sandpack ──────────────────
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const h = containerRef.current.getBoundingClientRect().height;
        if (h > 100) setEditorHeight(h);
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const onActionButtonClick = (actionType) => {
    setAction({ actionType, timeStamp: Date.now() });
    setActiveTab("preview");
  };

  // ── Load workspace files ────────────────────────────────────
  const fetchWorkspaceFiles = useCallback(async () => {
    if (!id) return;
    setFilesReady(false); // reset so Sandpack remounts cleanly
    setLoading(true);
    try {
      const result = await convex.query(api.workspace.GetWorkspace, { workspaceId: id });
      const normalized = normalizeFiles(result?.fileData || {});
      setFiles(normalized);
    } catch (error) {
      console.error("Error fetching workspace files:", error);
    } finally {
      setLoading(false);
      setFilesReady(true); // files are ready — mount/remount Sandpack now
    }
  }, [convex, id]);

  useEffect(() => {
    fetchWorkspaceFiles().catch(console.error);
  }, [fetchWorkspaceFiles]);

  // Switch to preview on action trigger
  useEffect(() => {
    if (action?.actionType) setActiveTab("preview");
  }, [action]);

  const processedCodePromptRef = useRef("");

  // Generate AI code when last message is from user
  useEffect(() => {
    if (
      Array.isArray(messages) &&
      messages.length > 0 &&
      messages[messages.length - 1]?.role === "user"
    ) {
      const lastUserMsg = messages[messages.length - 1]?.content;
      // Prevent duplicate generation if this exact user prompt is already processing or was just processed
      if (processedCodePromptRef.current === `${id}-${messages.length}-${lastUserMsg}`) {
        return;
      }
      processedCodePromptRef.current = `${id}-${messages.length}-${lastUserMsg}`;
      generateAiCode(messages).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, id]);

  const generateAiCode = async (currentMessages) => {
    if (!id) return;
    setLoading(true);
    try {
      const promptData = JSON.stringify(currentMessages || messages) + Prompt.CODE_GEN_PROMPT;
      const response = await axios.post("/api/gen-ai-code", { prompt: promptData });
      const aiResponse = response.data || {};
      const mergedFiles = normalizeFiles(aiResponse?.files || {});
      setFiles(mergedFiles);

      if (aiResponse?.files) {
        await updateFilesMutation({ workspaceId: id, files: mergedFiles });
      }

      const tokenUsage = countToken(JSON.stringify(aiResponse));
      const currentToken = Number(userDetail?.token) || 0;
      const updatedToken = currentToken - tokenUsage;
      if (userDetail?._id) {
        setUserDetail((prev) => ({ ...prev, token: updatedToken }));
        await updateTokensMutation({ userId: userDetail._id, token: updatedToken });
      }

      setActiveTab("preview");
    } catch (error) {
      console.error("Error generating AI code:", error?.response?.data || error);
      const isRateOrOverload = /503|429|overload|rate.?limit|quota/i.test(error?.response?.data?.error || error?.message || "");
      if (isRateOrOverload) {
        toast.error("AI service is experiencing high load. Please try sending a quick follow-up prompt to re-trigger code generation.");
      } else {
        toast.error("Code generation encountered an issue. Try sending another prompt.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full w-full min-h-0" style={{ overflow: "hidden" }}>

        {/* ── Toolbar ──────────────────────────────────────── */}
        <div className="flex-shrink-0 bg-[#ADFA1D] w-full px-3 py-1.5 border-b border-black">
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-black/90 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "code"
                    ? "bg-[#ADFA1D] text-black shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                Code
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-[#ADFA1D] text-black shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                Preview
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 bg-black/90 p-1 rounded-lg">
              <button
                onClick={() => onActionButtonClick("export")}
                disabled={loading || !filesReady}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold text-white hover:text-[#ADFA1D] hover:bg-white/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
              <button
                onClick={() => onActionButtonClick("deploy")}
                disabled={loading || !filesReady}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold text-white hover:text-[#ADFA1D] hover:bg-white/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" />
                Deploy
              </button>
            </div>
          </div>
        </div>

        {/* ── Sandpack area ─────────────────────────────────── */}
        <div
          ref={containerRef}
          className="flex-1 relative"
          style={{ minHeight: 0, overflow: "hidden" }}
        >
          {/* Sandpack Provider: key includes files version count so any newly generated files force immediate fresh compilation */}
          {filesReady ? (
            <SandpackProvider
              key={`${id}-${Object.keys(files).length}-${files["/App.js"]?.code?.length || 0}`}
              template="react"
              theme="dark"
              files={files}
              customSetup={{
                dependencies: { ...Lookup.DEPENDANCY },
              }}
              options={{
                externalResources: ["https://unpkg.com/@tailwindcss/browser@4"],
                recompileMode: "delayed",
                recompileDelay: 200,
                autoReload: true,
              }}
            >
              {/* Code tab */}
              <div
                style={{
                  display: activeTab === "code" ? "flex" : "none",
                  height: "100%",
                  width: "100%",
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                }}
              >
                {/* File explorer — 220px wide */}
                <div style={{ width: 220, minWidth: 180, flexShrink: 0, height: "100%", overflowY: "auto", overflowX: "hidden", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                  <SandpackFileExplorer style={{ height: "100%", width: "100%" }} />
                </div>

                {/* Code editor with full scrollability and visible Run button */}
                <div style={{ flex: 1, minWidth: 0, height: "100%", position: "relative", overflow: "hidden" }}>
                  <SandpackCodeEditor
                    style={{ height: "100%", width: "100%" }}
                    showTabs
                    showLineNumbers
                    showInlineErrors
                    closableTabs
                    readOnly={false}
                    showRunButton={true}
                  />
                </div>
              </div>

              {/* Preview tab — always mounted in DOM with inset 0 so it compiles without lag */}
              <div
                style={{
                  display: activeTab === "preview" ? "flex" : "none",
                  height: "100%",
                  width: "100%",
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                }}
              >
                <SandpankPreviewClient />
              </div>
            </SandpackProvider>
          ) : (
            /* Files not yet loaded — show a skeleton */
            <div className="flex items-center justify-center h-full gap-3 text-gray-600">
              <Loader className="animate-spin h-6 w-6 text-[#ADFA1D]/50" />
              <span className="text-sm">Loading project...</span>
            </div>
          )}

          {/* Loading overlay (AI generation) */}
          {loading && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-30 gap-4">
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-[#ADFA1D]/20 animate-ping absolute" />
                <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-[#ADFA1D] flex items-center justify-center shadow-[0_0_30px_rgba(173,250,29,0.3)]">
                  <Loader className="animate-spin h-8 w-8 text-[#ADFA1D]" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-[#ADFA1D] text-lg font-bold tracking-wide animate-pulse">
                  Cooking Files & Compiling...
                </p>
                <p className="text-gray-400 text-xs font-mono">
                  Writing components · Setting up state · Bundling React app
                </p>
              </div>
            </div>
          )}

          {/* Login overlay */}
          {!userDetail && !loading && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-20 gap-4">
              <LockIcon className="h-12 w-12 text-[#ADFA1D]" />
              <h2 className="text-white text-xl font-bold">Please login first.</h2>
              <Button
                onClick={() => setOpenDialog(true)}
                className="px-6 py-2 bg-[#ADFA1D] text-black font-semibold rounded-lg hover:bg-[#c8ff42] transition-colors"
              >
                Login
              </Button>
            </div>
          )}
        </div>
      </div>

      <SignInDialog openDialog={openDialog} closeDialog={(v) => setOpenDialog(v)} />
    </ErrorBoundary>
  );
}

export default CodeView;
