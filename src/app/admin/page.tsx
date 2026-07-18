import AppShell from "../components/AppShell";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
    const [campaigns, identities, categories, contextItems, completedCampaigns] = await Promise.all([
        prisma.campaign.count(),
        prisma.identity.count(),
        prisma.contextCategory.count(),
        prisma.contextItem.count(),
        prisma.campaign.count({ where: { isCompleted: true } }),
    ]);
    return { campaigns, identities, categories, contextItems, completedCampaigns };
}

async function checkDiscordBot(): Promise<{ ok: boolean; message: string; latencyMs?: number; username?: string }> {
    const token = process.env.DISCORD_BOT_TOKEN;
    const campaignsChannelId = process.env.DISCORD_CAMPAIGNS_CHANNEL_ID;
    const contextsChannelId = process.env.DISCORD_CONTEXTS_CHANNEL_ID;

    if (!token) return { ok: false, message: "DISCORD_BOT_TOKEN is missing in environment." };
    if (!campaignsChannelId) return { ok: false, message: "DISCORD_CAMPAIGNS_CHANNEL_ID is missing." };
    if (!contextsChannelId) return { ok: false, message: "DISCORD_CONTEXTS_CHANNEL_ID is missing." };

    try {
        const start = Date.now();
        const res = await fetch("https://discord.com/api/v10/users/@me", {
            headers: { Authorization: `Bot ${token}` },
            cache: "no-store",
        });
        const latencyMs = Date.now() - start;
        if (res.ok) {
            const data = await res.json();
            return { ok: true, message: `Active and authenticated`, latencyMs, username: data.username };
        } else {
            return { ok: false, message: `Discord API returned ${res.status} — Invalid or revoked token.` };
        }
    } catch (e) {
        return { ok: false, message: `Network error: ${String(e)}` };
    }
}

function checkEnvVars() {
    return [
        { key: "DATABASE_URL", label: "Database", group: "core" },
        { key: "NEXTAUTH_SECRET", label: "Auth Secret", group: "core" },
        { key: "DISCORD_BOT_TOKEN", label: "Bot Token", group: "discord" },
        { key: "DISCORD_CLIENT_ID", label: "Client ID", group: "discord" },
        { key: "DISCORD_CLIENT_SECRET", label: "Client Secret", group: "discord" },
        { key: "DISCORD_CAMPAIGNS_CHANNEL_ID", label: "Campaigns Channel", group: "discord" },
        { key: "DISCORD_CONTEXTS_CHANNEL_ID", label: "Contexts Channel", group: "discord" },
        { key: "ADMIN_DISCORD_EMAIL", label: "Admin Email", group: "core" },
        { key: "NEXT_PUBLIC_APP_URL", label: "App URL", group: "core" },
    ].map((v) => ({ ...v, present: !!process.env[v.key] }));
}

// Inline SVG Icon components (server-safe)
const Icons = {
    Video: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
    ),
    Bolt: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    Check: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    User: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Folder: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    File: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    Discord: () => (
        <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
        </svg>
    ),
    Shield: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
};

export default async function AdminPage() {
    const [stats, discordStatus, envChecks] = await Promise.all([
        getStats(),
        checkDiscordBot(),
        Promise.resolve(checkEnvVars()),
    ]);

    const activeCampaigns = stats.campaigns - stats.completedCampaigns;
    const completionRate = stats.campaigns > 0 ? Math.round((stats.completedCampaigns / stats.campaigns) * 100) : 0;
    const missingEnvCount = envChecks.filter((e) => !e.present).length;

    return (
        <AppShell>
            <main style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 24px 80px", flex: 1 }}>

                {/* Header */}
                <div style={{ marginBottom: "40px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div>
                        <p style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", margin: "0 0 8px" }}>System Overview</p>
                        <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>Admin Panel</h1>
                    </div>
                    {(() => {
                        const systemOk = discordStatus.ok && missingEnvCount === 0;
                        return (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px" }}>
                                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: systemOk ? "#fff" : "rgba(255,255,255,0.25)" }} />
                                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: systemOk ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)" }}>
                                    {systemOk ? "All Systems Operational" : `System Degraded${missingEnvCount > 0 ? ` — ${missingEnvCount} env var${missingEnvCount > 1 ? "s" : ""} missing` : ""}`}
                                </span>
                            </div>
                        );
                    })()}
                </div>

                {/* Bento Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gridTemplateRows: "auto", gap: "12px" }}>

                    {/* Total Campaigns — wide */}
                    <div style={{ gridColumn: "span 2", background: "linear-gradient(135deg, #111 0%, #0d0d0d 100%)", border: "1px solid #1f1f1f", borderRadius: "16px", padding: "24px" }}>
                        <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: "16px" }}><Icons.Video /></div>
                        <div style={{ fontSize: "2.8rem", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em" }}>{stats.campaigns}</div>
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "8px", fontWeight: 500 }}>Total Campaigns</div>
                    </div>

                    {/* Active Campaigns */}
                    <div style={{ gridColumn: "span 2", background: "linear-gradient(135deg, rgba(255,215,0,0.07) 0%, #0d0d0d 100%)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: "16px", padding: "24px" }}>
                        <div style={{ color: "#ffd700", marginBottom: "16px" }}><Icons.Bolt /></div>
                        <div style={{ fontSize: "2.8rem", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", color: "#ffd700" }}>{activeCampaigns}</div>
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "8px", fontWeight: 500 }}>Active Campaigns</div>
                    </div>

                    {/* Completion Rate */}
                    <div style={{ gridColumn: "span 2", background: "linear-gradient(135deg, rgba(255,215,0,0.05) 0%, #0d0d0d 100%)", border: "1px solid rgba(255,215,0,0.12)", borderRadius: "16px", padding: "24px" }}>
                        <div style={{ color: "#ffd700", marginBottom: "16px" }}><Icons.Check /></div>
                        <div style={{ fontSize: "2.8rem", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", color: "#ffd700" }}>{completionRate}<span style={{ fontSize: "1.4rem" }}>%</span></div>
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "8px", fontWeight: 500 }}>Completion Rate</div>
                    </div>

                    {/* Identities */}
                    <div style={{ gridColumn: "span 2", background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: "16px", padding: "24px" }}>
                        <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: "16px" }}><Icons.User /></div>
                        <div style={{ fontSize: "2.8rem", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em" }}>{stats.identities}</div>
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "8px", fontWeight: 500 }}>Identities</div>
                    </div>

                    {/* Categories */}
                    <div style={{ gridColumn: "span 2", background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: "16px", padding: "24px" }}>
                        <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: "16px" }}><Icons.Folder /></div>
                        <div style={{ fontSize: "2.8rem", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em" }}>{stats.categories}</div>
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "8px", fontWeight: 500 }}>Context Categories</div>
                    </div>

                    {/* Context Items */}
                    <div style={{ gridColumn: "span 2", background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: "16px", padding: "24px" }}>
                        <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: "16px" }}><Icons.File /></div>
                        <div style={{ fontSize: "2.8rem", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em" }}>{stats.contextItems}</div>
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "8px", fontWeight: 500 }}>Context Items</div>
                    </div>

                    {/* Discord Bot Card */}
                    <div style={{ gridColumn: "span 6", background: discordStatus.ok ? "#0d0d0d" : "#110000", border: `1px solid ${discordStatus.ok ? "#1f1f1f" : "rgba(255,255,255,0.15)"}`, borderRadius: "16px", overflow: "hidden" }}>
                        {/* Error banner */}
                        {!discordStatus.ok && (
                            <div style={{ background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "10px 24px", display: "flex", alignItems: "center", gap: "10px" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#fff", flexShrink: 0 }}>
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Bot Error — Discord notifications are not working. Check your token and channel IDs.</span>
                            </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", padding: "24px 28px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{ width: "44px", height: "44px", background: "#5865F2", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                                    <Icons.Discord />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
                                        Discord Bot
                                        <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 10px", borderRadius: "4px", background: discordStatus.ok ? "rgba(255,255,255,0.08)" : "transparent", color: discordStatus.ok ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                            {discordStatus.ok ? "ONLINE" : "OFFLINE"}
                                        </span>
                                    </div>
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginTop: "3px" }}>
                                        {discordStatus.username ? `@${discordStatus.username} — ` : ""}{discordStatus.message}
                                    </div>
                                </div>
                            </div>
                            {discordStatus.latencyMs !== undefined && (
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>
                                        {discordStatus.latencyMs}<span style={{ fontSize: "0.9rem", fontWeight: 400, color: "rgba(255,255,255,0.3)" }}>ms</span>
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>API Latency</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Env Vars Card — full width, responsive */}
                    <div style={{ gridColumn: "span 6", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "16px", overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #1a1a1a" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 600, fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>
                                <div style={{ color: "rgba(255,255,255,0.3)" }}><Icons.Shield /></div>
                                Environment Variables
                            </div>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "3px 12px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: missingEnvCount > 0 ? "rgba(255,255,255,0.5)" : "#fff", border: "1px solid rgba(255,255,255,0.08)" }}>
                                {missingEnvCount > 0 ? `${missingEnvCount} MISSING` : "ALL SET"}
                            </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                            {envChecks.map((e) => (
                                <div key={e.key} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "12px 20px",
                                    borderBottom: "1px solid #141414",
                                    gap: "12px",
                                }}>
                                    <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {e.label}
                                    </span>
                                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: e.present ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)", flexShrink: 0 }}>
                                        {e.present ? "✓" : "✗"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
        </AppShell>
    );
}
