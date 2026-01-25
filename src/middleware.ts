import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";

const isProtectedRoute = createRouteMatcher([
]);

export const onRequest = clerkMiddleware(
  (auth, context) => {
    const { isAuthenticated, redirectToSignIn, userId } = auth();

    if (!isAuthenticated && isProtectedRoute(context.request)) {
      return redirectToSignIn();
    }

    context.locals.currentUserId = userId;
  },
  {
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
);
