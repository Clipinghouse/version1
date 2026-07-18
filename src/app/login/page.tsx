"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

function LoginContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div style={{
            position: "relative",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#111111", /* Matte Black */
            color: "#f3f4f6",
            fontFamily: "var(--font-geist-sans), sans-serif",
        }}>

            <style>{`
                .discord-btn {
                    width: 100%;
                    background: #5865F2; /* Discord Brand Color */
                    color: white;
                    border: none;
                    padding: 14px 24px;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    alignItems: center;
                    justify-content: center;
                    gap: 12px;
                    transition: background 0.2s ease, transform 0.1s ease;
                    box-shadow: 0 4px 14px rgba(88, 101, 242, 0.4);
                }
                .discord-btn:hover {
                    background: #4752C4;
                    transform: translateY(-1px);
                }
                .discord-btn:active {
                    transform: translateY(0);
                }
            `}</style>

            <div style={{
                position: "relative",
                zIndex: 10,
                background: "#1a1a1a",
                border: "1px solid #333333",
                borderRadius: "16px",
                padding: "32px 24px",
                width: "100%",
                maxWidth: "320px",
                textAlign: "center",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.5s ease-out"
            }}>
                <Link href="/" style={{
                    position: "absolute",
                    top: "20px",
                    left: "20px",
                    color: "#888",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "color 0.2s"
                }} onMouseOver={e => e.currentTarget.style.color = "#ccc"} onMouseOut={e => e.currentTarget.style.color = "#888"}>
                    &larr; Back
                </Link>

                <div style={{
                    margin: "16px auto 12px",
                    display: "flex",
                    justifyContent: "center"
                }}>
                    <svg width="32" height="32" viewBox="0 0 127.14 96.36" fill="#f3f4f6">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.1,46,96,53,91.08,65.69,84.69,65.69Z" />
                    </svg>
                </div>

                <h1 style={{ fontSize: "1.35rem", fontWeight: "600", margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>Welcome Back</h1>
                <p style={{ color: "#a1a1aa", fontSize: "0.85rem", margin: "0 0 24px 0" }}>
                    Sign in to access your dashboard.
                </p>

                {error === "AccessDenied" && (
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#fca5a5", padding: "10px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.85rem" }}>
                        Access Denied. Unauthorized account.
                    </div>
                )}
                {error && error !== "AccessDenied" && (
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#fca5a5", padding: "10px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.85rem" }}>
                        Authentication Error: {error}
                    </div>
                )}

                <button
                    onClick={() => signIn("discord", { callbackUrl: "/" })}
                    className="discord-btn"
                >
                    <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.1,46,96,53,91.08,65.69,84.69,65.69Z" />
                    </svg>
                    Continue with Discord
                </button>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "#111111" }} />}>
            <LoginContent />
        </Suspense>
    );
}

