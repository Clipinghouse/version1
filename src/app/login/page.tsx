"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function LoginContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    return (
        <div className="login-container" style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
            color: "#fff",
            fontFamily: "var(--font-geist-sans)"
        }}>
            {/* Ambient Background Glow Effect */}
            <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "400px",
                height: "400px",
                background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 70%)",
                zIndex: 0,
                pointerEvents: "none"
            }} />

            <div style={{
                position: "relative",
                zIndex: 1,
                background: "#0A0A0A",
                border: "1px solid #1f1f1f",
                borderRadius: "16px",
                padding: "48px 40px",
                width: "100%",
                maxWidth: "400px",
                textAlign: "center",
                boxShadow: "0 24px 80px rgba(0,0,0,0.5)"
            }}>
                <Link href="/" style={{
                    position: "absolute",
                    top: "24px",
                    left: "24px",
                    color: "#666",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    transition: "color 0.2s"
                }} onMouseOver={e => e.currentTarget.style.color = "#fff"} onMouseOut={e => e.currentTarget.style.color = "#666"}>
                    ← Back
                </Link>

                <div style={{
                    width: "56px",
                    height: "56px",
                    background: "#111",
                    border: "1px solid #222",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "16px auto 28px"
                }}>
                    <svg width="24" height="24" viewBox="0 0 127.14 96.36" fill="#fff">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.1,46,96,53,91.08,65.69,84.69,65.69Z" />
                    </svg>
                </div>

                <h1 style={{ fontSize: "1.4rem", fontWeight: 600, margin: "0 0 10px 0", letterSpacing: "-0.02em" }}>Authenticate</h1>
                <p style={{ color: "#888", fontSize: "0.9rem", margin: "0 0 32px 0", lineHeight: 1.5 }}>
                    Sign in to access your dashboard.
                </p>

                {error === "AccessDenied" && (
                    <div style={{
                        background: "rgba(255, 68, 68, 0.1)",
                        border: "1px solid rgba(255, 68, 68, 0.2)",
                        color: "#ff6b6b",
                        padding: "12px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                        fontSize: "0.85rem",
                        fontWeight: 500
                    }}>
                        Unauthorized account.
                    </div>
                )}

                <button
                    onClick={() => signIn("discord", { callbackUrl: "/campaigns" })}
                    style={{
                        width: "100%",
                        background: "#fff",
                        color: "#000",
                        border: "1px solid #fff",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        transition: "all 0.15s ease",
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.background = "#e6e6e6";
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.background = "#fff";
                    }}
                >
                    Continue with Discord
                </button>
            </div>

            <div style={{ marginTop: "32px", fontSize: "0.8rem", color: "#444" }}>
                Clipping House Admin Portal
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "#000" }} />}>
            <LoginContent />
        </Suspense>
    );
}
