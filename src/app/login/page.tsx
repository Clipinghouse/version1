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
            background: "#050505",
            color: "#fff",
            fontFamily: "var(--font-geist-sans)",
            overflow: "hidden"
        }}>
            {/* Animated Background Textures */}
            <div style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
                opacity: 0.4,
                zIndex: 0
            }} />

            <div className="bg-orb orb-1" />
            <div className="bg-orb orb-2" />

            <style>{`
                @keyframes floatOrb1 {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(4vw, -8vh) scale(1.1); }
                    66% { transform: translate(-3vw, 5vh) scale(0.9); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                @keyframes floatOrb2 {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-5vw, 6vh) scale(0.95); }
                    66% { transform: translate(4vw, -4vh) scale(1.05); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                .bg-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.15;
                    z-index: 0;
                    pointer-events: none;
                }
                .orb-1 {
                    top: -10%;
                    left: -10%;
                    width: 50vw;
                    height: 50vw;
                    background: #ffd700;
                    animation: floatOrb1 20s infinite ease-in-out;
                }
                .orb-2 {
                    bottom: -20%;
                    right: -10%;
                    width: 60vw;
                    height: 60vw;
                    background: #4a00e0;
                    animation: floatOrb2 25s infinite ease-in-out reverse;
                }
                .discord-btn {
                    position: relative;
                    width: 100%;
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 16px 24px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    alignItems: center;
                    justify-content: center;
                    gap: 12px;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .discord-btn::before {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%; width: 100%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
                    transition: all 0.5s ease;
                }
                .discord-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.4);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(255,255,255,0.1);
                }
                .discord-btn:hover::before {
                    left: 100%;
                }
                .discord-btn:active {
                    transform: translateY(1px);
                }
            `}</style>

            <div style={{
                position: "relative",
                zIndex: 10,
                background: "rgba(12, 12, 12, 0.65)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "24px",
                padding: "48px 40px",
                width: "90%",
                maxWidth: "440px",
                textAlign: "center",
                boxShadow: "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
                <Link href="/" style={{
                    position: "absolute",
                    top: "24px",
                    left: "24px",
                    color: "rgba(255,255,255,0.4)",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    transition: "color 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                }} onMouseOver={e => e.currentTarget.style.color = "#fff"} onMouseOut={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg> Returning
                </Link>

                <div style={{
                    width: "64px",
                    height: "64px",
                    background: "linear-gradient(135deg, #1f1f1f, #0a0a0a)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "12px auto 32px",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)"
                }}>
                    <svg width="32" height="32" viewBox="0 0 127.14 96.36" fill="#fff">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.1,46,96,53,91.08,65.69,84.69,65.69Z" />
                    </svg>
                </div>

                <h1 style={{ fontFamily: "var(--font-anton)", fontSize: "2rem", textTransform: "uppercase", margin: "0 0 8px 0", letterSpacing: "0.02em" }}>Authenticate</h1>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", margin: "0 0 36px 0", lineHeight: 1.5 }}>
                    Establish a secure uplink to access your isolated workspace environment.
                </p>

                {error === "AccessDenied" && (
                    <div style={{ background: "rgba(255, 68, 68, 0.1)", border: "1px solid rgba(255, 68, 68, 0.2)", color: "#ff6b6b", padding: "12px", borderRadius: "8px", marginBottom: "28px", fontSize: "0.85rem", fontWeight: 500 }}>
                        Unauthorized account.
                    </div>
                )}
                {error === "OAuthCallback" && (
                    <div style={{ background: "rgba(255, 215, 0, 0.1)", border: "1px solid rgba(255, 215, 0, 0.3)", color: "#ffd700", padding: "16px", borderRadius: "12px", marginBottom: "28px", fontSize: "0.85rem", fontWeight: 500, textAlign: "left", boxShadow: "0 8px 24px rgba(255,215,0,0.05)" }}>
                        <div style={{ fontWeight: 800, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>OAuth Target Rejected ⚠️</div>
                        Discord blocked the API return route. You must add the following exact URL string into the <strong>Redirect URIs</strong> list of your Discord Developer Portal:<br /><br />
                        <code style={{ display: "block", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px", borderRadius: "6px", fontFamily: "monospace", color: "#fff", wordBreak: "break-all", fontSize: "0.8rem" }}>
                            https://myclipping.onrender.com/api/auth/callback/discord
                        </code>
                    </div>
                )}
                {error && error !== "AccessDenied" && error !== "OAuthCallback" && (
                    <div style={{ background: "rgba(68, 68, 255, 0.1)", border: "1px solid rgba(68, 68, 255, 0.2)", color: "#8888ff", padding: "12px", borderRadius: "8px", marginBottom: "28px", fontSize: "0.85rem", fontWeight: 500 }}>
                        System Authentication Error: {error}
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

            <div style={{ position: "absolute", bottom: "32px", fontSize: "0.75rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                SECURE ACCESS PORTAL
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "#050505" }} />}>
            <LoginContent />
        </Suspense>
    );
}
