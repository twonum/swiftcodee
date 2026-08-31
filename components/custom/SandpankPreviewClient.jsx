"use client";

import { ActionContext } from "@/context/ActionContext";
import { SandpackPreview, useSandpack } from "@codesandbox/sandpack-react";
import React, { useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function SandpankPreviewClient() {
  const previewRef = useRef();
  const { sandpack } = useSandpack();
  const { action, setAction } = useContext(ActionContext);
  const router = useRouter();

  useEffect(() => {
    if (!action?.actionType) return;
    if (!sandpack) return;

    // Wait for the preview iframe to compile before grabbing the URL
    const timer = setTimeout(() => {
      handleAction();
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  const handleAction = async () => {
    try {
      const client = previewRef.current?.getClient();
      if (!client) {
        console.warn("[SandpackPreview] No client yet.");
        return;
      }

      const result = await client.getCodeSandboxURL();
      if (!result?.sandboxId) {
        console.warn("[SandpackPreview] No sandboxId:", result);
        return;
      }

      if (action?.actionType === "deploy") {
        const deployUrl = `https://${result.sandboxId}.csb.app/`;
        setAction(null);
        router.push(`/deploy-success?url=${encodeURIComponent(deployUrl)}&sandbox=${result.sandboxId}`);
      } else if (action?.actionType === "export") {
        const editorUrl = result.editorUrl || `https://codesandbox.io/s/${result.sandboxId}`;
        window.open(editorUrl, "_blank", "noopener,noreferrer");
        setAction(null);
      }
    } catch (err) {
      console.error("[SandpackPreview] Error:", err);
    }
  };

  return (
    <SandpackPreview
      ref={previewRef}
      style={{
        height: "100%",
        width: "100%",
        flexGrow: 1,
        "--sp-layout-height": "100%",
      }}
      showNavigator={true}
      showOpenInCodeSandbox={true}
      showRestartButton={true}
    />
  );
}

export default SandpankPreviewClient;
