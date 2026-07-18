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

    // Not logged in → redirect cleanly to /login with no callbackUrl
    // (avoids Render's internal localhost:10000 leaking into the URL)
    if (!token) {
        const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || `https://${request.headers.get("host")}`;
        return NextResponse.redirect(`${base}/login`);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
    ],
};
