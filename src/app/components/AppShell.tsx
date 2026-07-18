"use client";


import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Campaigns", href: "/campaigns" },
    { label: "Context", href: "/context" },
    { label: "Statistics", href: "/statistics" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

            {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
            <header className="app-header">
                <nav className="header-left-nav">
                    {NAV_LINKS.map(({ label, href }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`header-nav-link ${pathname === href ? "active" : ""}`}
                        >
                            {label}
                        </Link>
                    ))}
                    {status === "authenticated" && (
                        <Link
                            href="/admin"
                            className={`header-nav-link ${pathname === "/admin" ? "active" : ""}`}
                            style={{ color: pathname === "/admin" ? "#fff" : "rgba(255,255,255,0.35)" }}
                        >
                            Admin
                        </Link>
                    )}
                </nav>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <a
                        href="https://app.notion.com/p/Myclipping-3a0903bf1f0380a498ddfab3b244d4dc?source=copy_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "36px",
                            height: "36px",
                            background: "#262626",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "background 0.18s, transform 0.12s",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                        }}
                        onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#333"; }}
                        onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#262626"; }}
                        title="Open Notion"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                    </a>
                    {status === "authenticated" ? (
                        <a
                            href="https://discord.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "#5865F2",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "7px 16px",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                letterSpacing: "0.04em",
                                textDecoration: "none",
                                cursor: "pointer",
                                transition: "background 0.18s, transform 0.12s",
                                boxShadow: "0 2px 8px rgba(88,101,242,0.35)",
                            }}
                            onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#4752c4"; }}
                            onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#5865F2"; }}
                        >
                            <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                            </svg>
                            Discord
                        </a>
                    ) : (
                        <button
                            onClick={() => router.push("/login")}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "#fff",
                                color: "#000",
                                border: "none",
                                borderRadius: "8px",
                                padding: "7px 16px",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                letterSpacing: "0.02em",
                                cursor: "pointer",
                                transition: "transform 0.12s, box-shadow 0.2s",
                                boxShadow: "0 2px 8px rgba(255,255,255,0.15)",
                            }}
                            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(255,255,255,0.2)"; }}
                            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(255,255,255,0.15)"; }}
                        >
                            <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="#000" xmlns="http://www.w3.org/2000/svg">
                                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                            </svg>
                            Login
                        </button>
                    )}
                </div>
            </header>

            {/* ══ PAGE CONTENT ════════════════════════════════════════════════════ */}
            {children}

            {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
            <footer className="app-footer">
                <div className="footer-brand">clipping house</div>
                <nav className="footer-nav">
                    {NAV_LINKS.map(({ label, href }) => (
                        <Link key={href} href={href} className="footer-nav-link">
                            {label}
                        </Link>
                    ))}
                </nav>
            </footer>
        </div>
    );
}
