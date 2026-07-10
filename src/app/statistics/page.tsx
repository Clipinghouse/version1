"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";

interface DayRecord {
    date: string;
    seconds: number;
    isRunning: boolean;
}

function formatSeconds(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return {
        h, m, sec,
        label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`,
    };
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return {
        weekday: d.toLocaleString("default", { weekday: "short" }).toUpperCase(),
        day: d.getDate(),
        month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
        year: d.getFullYear(),
    };
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function StatisticsPage() {
    const [records, setRecords] = useState<DayRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState<string | null>(null);
    const today = new Date().toISOString().split("T")[0];

    const load = () => {
        setLoading(true);
        fetch("/api/timer/history")
            .then(r => r.json())
            .then(data => {
                // Filter out days with zero seconds (no activity)
                setRecords((data as DayRecord[]).filter(r => r.seconds > 0 || r.date === today));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleReset = async (date: string) => {
        if (!confirm(`Reset timer for ${date}?`)) return;
        setResetting(date);
        await fetch("/api/timer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "RESET", date }),
        });
        // Also clear localStorage if resetting today
        if (date === today && typeof window !== "undefined") {
            localStorage.setItem("ch_wasted_seconds", "0");
            localStorage.setItem("ch_timer_running", "false");
        }
        setResetting(null);
        load();
    };

    // Rank by seconds descending for medals/bar
    const ranked = [...records].sort((a, b) => b.seconds - a.seconds);
    const maxSeconds = ranked[0]?.seconds || 1;

    const totalSeconds = records.reduce((acc, r) => acc + r.seconds, 0);
    const avgSeconds = records.length ? Math.round(totalSeconds / records.length) : 0;
    const activeDays = records.filter(r => r.seconds > 0).length;
    const todayRec = records.find(r => r.date === today);

    return (
        <AppShell>
            <main style={{ minHeight: "100vh", background: "#0a0a0a", padding: "60px 40px", fontFamily: "'Inter', sans-serif", color: "#fff" }}>

                {/* Header */}
                <div style={{ maxWidth: 860, margin: "0 auto 48px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", letterSpacing: "0.4em", color: "#444", textTransform: "uppercase", fontWeight: 700 }}>Productivity Audit</p>
                    <h1 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>
                        Time Wasted<br />
                        <span style={{ color: "#2a2a2a" }}>Leaderboard</span>
                    </h1>
                </div>

                {/* Summary Cards */}
                <div style={{ maxWidth: 860, margin: "0 auto 48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
                    {[
                        { label: "Total Logged", value: formatSeconds(totalSeconds).label },
                        { label: "Daily Average", value: formatSeconds(avgSeconds).label },
                        { label: "Days Tracked", value: `${activeDays}d` },
                        { label: "Today", value: formatSeconds(todayRec?.seconds ?? 0).label, live: todayRec?.isRunning },
                    ].map((card, i) => (
                        <div key={i} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "20px 22px" }}>
                            <p style={{ margin: "0 0 6px", fontSize: "0.58rem", letterSpacing: "0.28em", color: "#3a3a3a", textTransform: "uppercase", fontWeight: 700 }}>{card.label}</p>
                            <p style={{ margin: "0 0 4px", fontSize: "1.45rem", fontWeight: 900, letterSpacing: "-0.02em", fontFamily: "'Courier New', monospace" }}>{card.value}</p>
                            {card.live !== undefined && (
                                <p style={{ margin: 0, fontSize: "0.58rem", color: card.live ? "#ff4444" : "#2a2a2a", fontWeight: 800, letterSpacing: "0.15em" }}>
                                    {card.live ? "● LIVE" : "PAUSED"}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Leaderboard */}
                <div style={{ maxWidth: 860, margin: "0 auto" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
                        <p style={{ margin: 0, fontSize: "0.65rem", letterSpacing: "0.3em", color: "#333", textTransform: "uppercase", fontWeight: 700 }}>Daily Log</p>
                        <p style={{ margin: 0, fontSize: "0.6rem", color: "#2a2a2a", fontWeight: 700 }}>{activeDays} active days</p>
                    </div>

                    {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                            <div style={{ width: 36, height: 36, border: "3px solid #1a1a1a", borderTop: "3px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        </div>
                    ) : records.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "80px 0", color: "#2a2a2a" }}>
                            <p style={{ fontSize: "2.5rem", margin: "0 0 14px" }}>⏱</p>
                            <p style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>No data yet — start the timer!</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {records.map(rec => {
                                const rank = ranked.findIndex(r => r.date === rec.date);
                                const { label, h, m } = formatSeconds(rec.seconds);
                                const { weekday, day, month, year } = formatDate(rec.date);
                                const barPct = `${Math.round((rec.seconds / maxSeconds) * 100)}%`;
                                const isToday = rec.date === today;
                                const isResetting = resetting === rec.date;
                                const barColor = isToday && rec.isRunning ? "#ff4444"
                                    : rank === 0 ? "#ffd700"
                                        : rank === 1 ? "#b0b0b0"
                                            : rank === 2 ? "#cd7f32"
                                                : "#252525";

                                return (
                                    <div key={rec.date} style={{
                                        background: isToday ? "#111" : "#0d0d0d",
                                        border: `1px solid ${isToday ? "#222" : "#141414"}`,
                                        borderRadius: 12,
                                        padding: "18px 22px",
                                        display: "grid",
                                        gridTemplateColumns: "36px 110px 1fr auto auto",
                                        gap: 16,
                                        alignItems: "center",
                                    }}>
                                        {/* Rank */}
                                        <div style={{ textAlign: "center" }}>
                                            {rank < 3
                                                ? <span style={{ fontSize: "1.3rem" }}>{MEDALS[rank]}</span>
                                                : <span style={{ fontSize: "0.7rem", color: "#2a2a2a", fontWeight: 800 }}>#{rank + 1}</span>
                                            }
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                                                <span style={{ fontSize: "1.6rem", fontWeight: 900, lineHeight: 1, color: isToday ? "#fff" : "#666" }}>{String(day).padStart(2, "0")}</span>
                                                <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#333", letterSpacing: "0.08em" }}>{month} {year}</span>
                                            </div>
                                            <span style={{ fontSize: "0.55rem", letterSpacing: "0.12em", color: "#2a2a2a", fontWeight: 700 }}>
                                                {weekday}{isToday ? " · TODAY" : ""}
                                            </span>
                                        </div>

                                        {/* Bar + sub-label */}
                                        <div>
                                            <div style={{ background: "#181818", borderRadius: 4, height: 5, overflow: "hidden" }}>
                                                <div style={{ width: barPct, height: "100%", background: barColor, borderRadius: 4, transition: "width 0.6s ease" }} />
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                                                <span style={{ fontSize: "0.58rem", color: "#2a2a2a", fontWeight: 700 }}>
                                                    {h > 0 ? `${h}h ` : ""}{m}m wasted
                                                </span>
                                                {isToday && rec.isRunning && (
                                                    <span style={{ fontSize: "0.48rem", color: "#ff4444", fontWeight: 800, letterSpacing: "0.15em" }}>● LIVE</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Time display */}
                                        <span style={{ fontSize: "1.25rem", fontWeight: 900, fontFamily: "'Courier New', monospace", color: isToday ? "#fff" : "#555", letterSpacing: "-0.02em" }}>
                                            {label}
                                        </span>

                                        {/* Reset button */}
                                        <button
                                            onClick={() => handleReset(rec.date)}
                                            disabled={isResetting}
                                            title={`Reset ${rec.date}`}
                                            style={{
                                                background: "transparent",
                                                border: "1px solid #1e1e1e",
                                                borderRadius: 6,
                                                padding: "5px 10px",
                                                cursor: isResetting ? "wait" : "pointer",
                                                color: "#282828",
                                                fontSize: "0.58rem",
                                                fontWeight: 800,
                                                letterSpacing: "0.12em",
                                                textTransform: "uppercase",
                                                transition: "all 0.15s",
                                            }}
                                            onMouseOver={e => {
                                                e.currentTarget.style.borderColor = "#ff4444";
                                                e.currentTarget.style.color = "#ff4444";
                                            }}
                                            onMouseOut={e => {
                                                e.currentTarget.style.borderColor = "#1e1e1e";
                                                e.currentTarget.style.color = "#282828";
                                            }}
                                        >
                                            {isResetting ? "…" : "Reset"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </main>
        </AppShell>
    );
}
