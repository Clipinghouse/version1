"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const isPublicPath = pathname === "/" || pathname === "/login";

    useEffect(() => {
        if (status === "unauthenticated" && !isPublicPath) {
            router.push("/login");
        }
    }, [status, pathname, router, isPublicPath]);

    if (status === "loading" && !isPublicPath) {
        return (
            <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#666" }}>
                Checking Access...
            </div>
        );
    }

    if (status === "unauthenticated" && !isPublicPath) {
        return null;
    }

    return <>{children}</>;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthGuard>{children}</AuthGuard>
        </SessionProvider>
    );
}
