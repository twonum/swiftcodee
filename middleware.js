import { NextResponse } from "next/server";

// Run this middleware for all routes starting with /workspace/
export const config = {
  matcher: "/workspace/:path*",
};

async function convexQuery(functionName, args) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return null;

  try {
    const res = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: functionName, args, format: "json" }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.value ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Bypass workspace ownership check if ?new=true is present.
  if (searchParams.get("new") === "true") {
    return NextResponse.next();
  }

  // Extract the workspaceId from the URL (e.g. /workspace/[id]/...)
  const parts = pathname.split("/");
  const workspaceId = parts[2];
  if (!workspaceId) {
    return NextResponse.next();
  }

  // Retrieve and decode the email from the "auth-token" cookie.
  const authCookie = request.cookies.get("auth-token");
  if (!authCookie) {
    console.log("[Middleware] No auth-token cookie found for workspace:", workspaceId);
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  const cookieEmail = decodeURIComponent(authCookie.value || "").trim().toLowerCase();
  if (!cookieEmail) {
    console.log("[Middleware] Empty auth-token cookie.");
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  try {
    const workspace = await convexQuery("workspace:GetWorkspace", { workspaceId });

    if (!workspace) {
      // Workspace not yet created or Convex query failed — allow through
      return NextResponse.next();
    }

    if (!workspace.user) {
      return NextResponse.next();
    }

    const owner = await convexQuery("users:GetUserById", { userId: workspace.user });
    const ownerEmail = owner?.email ? owner.email.trim().toLowerCase() : null;

    if (ownerEmail && cookieEmail !== ownerEmail) {
      console.warn(
        `[Middleware] Ownership mismatch for workspace ${workspaceId}. Cookie: ${cookieEmail}, Owner: ${ownerEmail}`
      );
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[Middleware] Error verifying workspace ownership:", error);
    // Fail open — don't block the user on unexpected errors
    return NextResponse.next();
  }
}

