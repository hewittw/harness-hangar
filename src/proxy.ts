import { clerkMiddleware } from "@clerk/nextjs/server";

// Auth checks live in each page and server action (via userDb() / auth()), as Clerk recommends.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals, static files and the MCP endpoint (it authenticates with Hangar tokens, not Clerk).
    "/((?!_next|api/mcp$|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/api/((?!mcp$).*)",
  ],
};
