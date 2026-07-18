import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = request.nextUrl;

    // Allow public paths through
    if (
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico"
    ) {
        return NextResponse.next();
    }

    // Not logged in → redirect to login using the public NEXTAUTH_URL
    // so Render's internal port (10000) never leaks into the callbackUrl
    if (!token) {
        const base = process.env.NEXTAUTH_URL || request.nextUrl.origin;
        const loginUrl = new URL("/login", base);
        loginUrl.searchParams.set("callbackUrl", new URL(pathname, base).toString());
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
    ],
};
