import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/icon.svg", "/api/cron(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (process.env.DISABLE_CLERK_LOCAL === "true") {
    return;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"]
};
