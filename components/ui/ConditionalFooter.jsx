"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const Footer = dynamic(() => import("./Footer"), { ssr: false });

export default function ConditionalFooter() {
  const pathname = usePathname();
  // Hide footer on workspace and deploy-success pages
  if (pathname?.startsWith("/workspace/") || pathname?.startsWith("/deploy-success")) {
    return null;
  }
  return <Footer />;
}
