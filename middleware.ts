import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production");
    }
    return new TextEncoder().encode("fallback_secret_for_development_only");
  }
  
  return new TextEncoder().encode(secret);
};

const publicPaths = ["/login", "/api/auth/login", "/api/auth/signup", "/api/auth/logout", "/api/auth/me"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass static files and Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.includes("favicon.ico") ||
    pathname.startsWith("/images/")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;
  let isValidToken = false;

  if (token) {
    try {
      await jwtVerify(token, getSecretKey());
      isValidToken = true;
    } catch (error) {
      isValidToken = false;
    }
  }

  const isPublicPath = publicPaths.includes(pathname);
  const isApiRoute = pathname.startsWith("/api/");

  // Protect internal API routes
  if (isApiRoute && !isPublicPath) {
    if (!isValidToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protect frontend routes
  if (!isApiRoute) {
    if (!isValidToken && !isPublicPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    if (isValidToken && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
