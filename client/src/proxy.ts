import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isExplicitPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/items",
]);

export default clerkMiddleware(async (auth, request) => {
  const path = request.nextUrl.pathname;
  const isPublicItemDetail = /^\/items\/[^/]+$/.test(path) && path !== "/items/post";

  if (!isExplicitPublicRoute(request) && !isPublicItemDetail) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
