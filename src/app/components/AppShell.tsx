"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

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
            {/* ══ TOP HEADER ══════════════════════════════════════════════════════ */}
            <header className="app-header">
                {/* Mobile Logo */}
                <div className="mobile-logo">
                    <img src="/myclipping.png" alt="MyClipping" style={{ height: "40px", width: "auto", objectFit: "contain", marginTop: "1px" }} />
                </div>

                {/* Desktop Nav Links */}
                <nav className="header-left-nav">
                    {NAV_LINKS.map(({ label, href }) => (
                        <Link key={href} href={href} className={`header-nav-link ${pathname === href ? "active" : ""}`}>
                            {label}
                        </Link>
                    ))}
                    <Link href="/admin" className={`header-nav-link ${pathname === "/admin" ? "active" : ""}`} style={{ color: pathname === "/admin" ? "#fff" : "rgba(255,255,255,0.35)" }}>
                        Admin
                    </Link>
                </nav>

                {/* Actions (Responsive) */}
                <div className="header-actions">
                    <a
                        href="https://app.notion.com/p/Myclipping-3a0903bf1f0380a498ddfab3b244d4dc?source=copy_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-header-notion"
                        title="Open Notion"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                    </a>

                    {status === "authenticated" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <a
                                href="https://discord.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-header-discord"
                            >
                                <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                                </svg>
                                <span className="hide-on-mobile">Discord</span>
                            </a>
                        </div>
                    ) : (
                        <button
                            onClick={() => router.push("/login")}
                            className="btn-header-login"
                        >
                            <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="#000" xmlns="http://www.w3.org/2000/svg">
                                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                            </svg>
                            <span className="hide-on-mobile">Login</span>
                        </button>
                    )}
                </div>
            </header>

            {/* ══ PAGE CONTENT ════════════════════════════════════════════════════ */}
            {children}

            {/* ══ FOOTER (Desktop) ════════════════════════════════════════════════ */}
            <footer className="app-footer">
                <div className="footer-brand">
                    <img src="/myclipping.png" alt="MyClipping" style={{ height: "40px", width: "auto", objectFit: "contain" }} />
                </div>
                <nav className="footer-nav">
                    {NAV_LINKS.map(({ label, href }) => (
                        <Link key={href} href={href} className="footer-nav-link">
                            {label}
                        </Link>
                    ))}
                    {status === "authenticated" && (
                        <button onClick={() => signOut({ callbackUrl: "/login" })} className="footer-nav-link" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem" }}>
                            Sign Out
                        </button>
                    )}
                </nav>
            </footer>

            {/* ══ MOBILE BOTTOM NAV ═══════════════════════════════════════════════ */}
            <nav className="mobile-bottom-nav">
                <Link href="/" className={`bottom-nav-item ${pathname === "/" ? "active" : ""}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    <span>Home</span>
                </Link>

                <Link href="/statistics" className={`bottom-nav-item ${pathname === "/statistics" ? "active" : ""}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    <span>Statistics</span>
                </Link>

                <Link href="/campaigns" className={`bottom-nav-item center-btn ${pathname === "/campaigns" ? "active" : ""}`}>
                    <div className="center-btn-inner">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
                    </div>
                </Link>

                <Link href="/context" className={`bottom-nav-item ${pathname === "/context" ? "active" : ""}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span>Context</span>
                </Link>

                <Link href="/admin" className={`bottom-nav-item ${pathname === "/admin" ? "active" : ""}`}>
                    <img
                        src={`https://api.dicebear.com/9.x/glass/svg?seed=${session?.user?.name?.replace(/ /g, '') || 'Admin'}`}
                        alt="Admin"
                        style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#111", border: pathname === "/admin" ? "2px solid #fff" : "1px solid rgba(255,255,255,0.3)" }}
                        className="admin-nav-avatar"
                    />
                    <span>Admin</span>
                </Link>
            </nav>
        </div >
    );
}
