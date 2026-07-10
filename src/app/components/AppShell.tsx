"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Campaigns", href: "/campaigns" },
    { label: "Context", href: "/context" },
    { label: "Stored Contents", href: "/stored-contents" },
    { label: "Statistics", href: "/statistics" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [showTimer, setShowTimer] = useState(false);
    const [wastedSeconds, setWastedSeconds] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const secondsRef = useRef(wastedSeconds);

    // Initial local cache pull
    useEffect(() => {
        if (typeof window !== "undefined") {
            const cachedSeconds = Number(localStorage.getItem("ch_wasted_seconds")) || 0;
            const cachedRunning = localStorage.getItem("ch_timer_running") === "true";
            if (cachedSeconds) setWastedSeconds(cachedSeconds);
            if (cachedRunning) setTimerRunning(cachedRunning);
        }
    }, []);

    // Sync to local cache
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("ch_wasted_seconds", wastedSeconds.toString());
            localStorage.setItem("ch_timer_running", timerRunning.toString());
        }
    }, [wastedSeconds, timerRunning]);

    // Keep ref updated
    useEffect(() => { secondsRef.current = wastedSeconds; }, [wastedSeconds]);

    // Initial load
    useEffect(() => {
        let mounted = true;
        fetch("/api/timer").then(res => res.json()).then(data => {
            if (mounted && data.seconds !== undefined) {
                setWastedSeconds(data.seconds);
                if (data.isRunning) setTimerRunning(true);
            }
        }).catch(() => { });
        return () => { mounted = false; };
    }, []);

    // Tick
    useEffect(() => {
        if (!timerRunning) return;
        const id = setInterval(() => setWastedSeconds(s => s + 1), 1000);
        return () => clearInterval(id);
    }, [timerRunning]);

    // Sync to server periodically when running
    useEffect(() => {
        if (!timerRunning) return;
        const intervalId = setInterval(() => {
            fetch("/api/timer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "SYNC", clientSeconds: secondsRef.current })
            }).catch(() => { });
        }, 10000);
        return () => clearInterval(intervalId);
    }, [timerRunning]);

    const handleToggleTimer = async () => {
        const next = !timerRunning;
        setTimerRunning(next);
        try {
            const res = await fetch("/api/timer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: next ? "PLAY" : "PAUSE", clientSeconds: secondsRef.current })
            });
            const data = await res.json();
            if (data.seconds !== undefined) {
                setWastedSeconds(data.seconds);
                setTimerRunning(data.isRunning);
            }
        } catch (e) { }
    };

    const formatTime = (secs: number) => {
        const hh = Math.floor(secs / 3600).toString().padStart(2, '0');
        const mm = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        const ss = (secs % 60).toString().padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    };

    const handleResetTimer = async () => {
        if (!confirm("Reset today's timer to zero?")) return;
        setTimerRunning(false);
        setWastedSeconds(0);
        if (typeof window !== "undefined") {
            localStorage.setItem("ch_wasted_seconds", "0");
            localStorage.setItem("ch_timer_running", "false");
        }
        await fetch("/api/timer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "RESET" }),
        }).catch(() => { });
    };

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
                </nav>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {timerRunning && (
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff4444", animation: "pulse 1.5s infinite" }} />
                    )}
                    <button className="timer-button" onClick={() => setShowTimer(true)} style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, padding: "6px 16px" }}>TIMER</button>
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

            {/* ══ TIMER MODAL ══════════════════════════════════════════════════════ */}
            {showTimer && (
                <div onClick={() => setShowTimer(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", color: "#232220" }}>

                    {/* Independent Absolute Close Button */}
                    <button
                        onClick={() => setShowTimer(false)}
                        style={{ position: "absolute", top: 30, right: 30, background: "transparent", border: "none", color: "#666", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseOver={e => e.currentTarget.style.color = "#fff"}
                        onMouseOut={e => e.currentTarget.style.color = "#666"}
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
                        {/* Outer Retro Casing */}
                        <div style={{ position: "relative", background: "#f1f3dd", border: "16px solid #232220", borderRadius: 28, padding: "40px", display: "flex", flexDirection: "column", gap: 30, boxShadow: "0 25px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.05)" }}>

                            {/* Headline moved INSIDE the box */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: -10 }}>
                                <p style={{ margin: 0, fontSize: "0.9rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "#111", fontWeight: 900 }}>Time Wasted Today</p>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                {/* Top decorative switches */}
                                <div style={{ position: "absolute", top: -24, left: 60, width: 40, height: 20, background: "#232220", borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                                <div style={{ position: "absolute", top: -24, right: 60, width: 80, height: 20, background: "#232220", borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />

                                {/* Left Widget (ON/ACT) */}
                                <div style={{ display: "flex", flexDirection: "column", alignSelf: "flex-start", marginTop: 20 }}>
                                    <div style={{ position: "relative", width: 60, height: 40, background: "#262626", borderRadius: 6, color: "#fff", fontWeight: 800, fontSize: "1rem", letterSpacing: "1px", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                        ACT
                                        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#1a1a1a", transform: "translateY(-50%)" }} />
                                        <div style={{ position: "absolute", top: "50%", left: 0, width: 3, height: 6, background: "#a0a0a0", transform: "translateY(-50%)" }} />
                                        <div style={{ position: "absolute", top: "50%", right: 0, width: 3, height: 6, background: "#a0a0a0", transform: "translateY(-50%)" }} />
                                    </div>
                                </div>

                                {/* Digits Group */}
                                {(() => {
                                    const t = formatTime(wastedSeconds);
                                    const pairs = [
                                        { label: "HOUR", value: t.slice(0, 2) },
                                        { label: "MINUTES", value: t.slice(3, 5) },
                                        { label: "SECONDS", value: t.slice(6, 8) }
                                    ];

                                    return (
                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                            {pairs.map((pair, gi) => (
                                                <Fragment key={gi}>
                                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                                                        <div style={{ display: "flex", gap: 4 }}>
                                                            {pair.value.split("").map((digit, di) => (
                                                                <div key={di} style={{ position: "relative", width: 65, height: 95, background: "#262626", borderRadius: 8, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", color: "#f0f0f0", fontSize: "4.5rem", fontWeight: 900, fontFamily: "'Impact', 'Arial Black', sans-serif" }}>
                                                                    {digit}
                                                                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#151515", transform: "translateY(-50%)", zIndex: 2 }} />
                                                                    <div style={{ position: "absolute", top: "50%", left: 0, width: 4, height: 8, background: "#b0b0b0", transform: "translateY(-50%)", zIndex: 3, borderRight: "1px solid #444" }} />
                                                                    <div style={{ position: "absolute", top: "50%", right: 0, width: 4, height: 8, background: "#b0b0b0", transform: "translateY(-50%)", zIndex: 3, borderLeft: "1px solid #444" }} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <span style={{ fontSize: "1rem", fontWeight: 800, color: "#232220", letterSpacing: "1px" }}>{pair.label}</span>
                                                    </div>

                                                    {gi < 2 && (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 30 }}>
                                                            <div style={{ width: 8, height: 8, background: "#232220", borderRadius: "50%" }} />
                                                            <div style={{ width: 8, height: 8, background: "#232220", borderRadius: "50%" }} />
                                                        </div>
                                                    )}
                                                </Fragment>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {/* Right Widget (Date) */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignSelf: "flex-start", marginTop: 2 }}>
                                    <div style={{ position: "relative", width: 90, height: 45, background: "#262626", borderRadius: 6, color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: 800, fontSize: "1.2rem", overflow: "hidden" }}>
                                        {new Date().toLocaleString('default', { month: 'short' }).toUpperCase()}
                                        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#1a1a1a", transform: "translateY(-50%)" }} />
                                        <div style={{ position: "absolute", top: "50%", left: 0, width: 3, height: 6, background: "#a0a0a0", transform: "translateY(-50%)" }} />
                                        <div style={{ position: "absolute", top: "50%", right: 0, width: 3, height: 6, background: "#a0a0a0", transform: "translateY(-50%)" }} />
                                    </div>
                                    <div style={{ display: "flex", gap: 4 }}>
                                        <div style={{ position: "relative", flex: 1, height: 45, background: "#262626", borderRadius: 6, color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: 800, fontSize: "1rem", overflow: "hidden" }}>
                                            {new Date().toLocaleString('default', { weekday: 'short' }).toUpperCase()}
                                            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#1a1a1a", transform: "translateY(-50%)" }} />
                                            <div style={{ position: "absolute", top: "50%", left: 0, width: 3, height: 6, background: "#a0a0a0", transform: "translateY(-50%)" }} />
                                        </div>
                                        <div style={{ position: "relative", width: 40, height: 45, background: "#262626", borderRadius: 6, color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: 800, fontSize: "1rem", overflow: "hidden" }}>
                                            {new Date().getDate().toString().padStart(2, '0')}
                                            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#1a1a1a", transform: "translateY(-50%)" }} />
                                            <div style={{ position: "absolute", top: "50%", right: 0, width: 3, height: 6, background: "#a0a0a0", transform: "translateY(-50%)" }} />
                                        </div>
                                    </div>
                                </div>
                            </div> {/* THIS CLOSES the <div style={{ display: "flex", alignItems: "center", gap: 20 }}> that held the three main widgets */}
                        </div> {/* THIS CLOSES outer retro casing */}

                        {/* Controls Row */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                            {/* START / PAUSE */}
                            <button
                                onClick={handleToggleTimer}
                                style={{
                                    width: 140, height: 48, borderRadius: 8, padding: "0 20px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                    background: timerRunning ? "#1a0505" : "#f1f3dd",
                                    color: timerRunning ? "#ff4444" : "#232220",
                                    border: timerRunning ? "2px solid #ff4444" : "2px solid #232220",
                                    boxShadow: timerRunning ? "0 0 25px rgba(255,60,60,0.3), inset 0 0 10px rgba(255,60,60,0.2)" : "0 6px 0 #232220, 0 10px 20px rgba(0,0,0,0.5)"
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.transform = "translateY(2px)";
                                    if (!timerRunning) e.currentTarget.style.boxShadow = "0 4px 0 #232220, 0 8px 15px rgba(0,0,0,0.5)";
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    if (!timerRunning) e.currentTarget.style.boxShadow = "0 6px 0 #232220, 0 10px 20px rgba(0,0,0,0.5)";
                                }}
                                onMouseDown={e => {
                                    e.currentTarget.style.transform = "translateY(6px)";
                                    if (!timerRunning) e.currentTarget.style.boxShadow = "0 0 0 #232220, 0 2px 5px rgba(0,0,0,0.5)";
                                }}
                                onMouseUp={e => {
                                    e.currentTarget.style.transform = "translateY(2px)";
                                    if (!timerRunning) e.currentTarget.style.boxShadow = "0 4px 0 #232220, 0 8px 15px rgba(0,0,0,0.5)";
                                }}
                            >
                                {timerRunning
                                    ? <><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg><span style={{ fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em" }}>PAUSE</span></>
                                    : <><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg><span style={{ fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em" }}>START</span></>
                                }
                            </button>

                            {/* RESET */}
                            <button
                                onClick={handleResetTimer}
                                style={{
                                    height: 48, padding: "0 18px", borderRadius: 8, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 7, transition: "all 0.2s",
                                    background: "transparent",
                                    color: "#555",
                                    border: "2px solid #232220",
                                    boxShadow: "0 6px 0 #111, 0 10px 20px rgba(0,0,0,0.4)",
                                    fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em"
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.color = "#ff4444";
                                    e.currentTarget.style.borderColor = "#ff4444";
                                    e.currentTarget.style.transform = "translateY(2px)";
                                    e.currentTarget.style.boxShadow = "0 4px 0 #111, 0 8px 15px rgba(0,0,0,0.4)";
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.color = "#555";
                                    e.currentTarget.style.borderColor = "#232220";
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 6px 0 #111, 0 10px 20px rgba(0,0,0,0.4)";
                                }}
                                onMouseDown={e => {
                                    e.currentTarget.style.transform = "translateY(6px)";
                                    e.currentTarget.style.boxShadow = "0 0 0 #111";
                                }}
                                onMouseUp={e => {
                                    e.currentTarget.style.transform = "translateY(2px)";
                                    e.currentTarget.style.boxShadow = "0 4px 0 #111, 0 8px 15px rgba(0,0,0,0.4)";
                                }}
                            >
                                {/* Reset / loop icon */}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="1 4 1 10 7 10"></polyline>
                                    <path d="M3.51 15a9 9 0 1 0 .49-3.51"></path>
                                </svg>
                                RESET
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
