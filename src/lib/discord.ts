/**
 * Discord Bot helper for Clipping House
 * Uses the Discord Bot API to send a rich, well-formatted embed to #campaigns.
 * Bot must have "Send Messages" and "Embed Links" permissions in the target channel.
 */

interface ContextItem {
    name: string;
    text: string;
}

interface CampaignPayload {
    id: string;
    name: string;
    platform?: string | null;
    rpm?: string | null;
    niche?: string | null;
    sound?: string | null;
    rules?: string | null;
    identity?: { name: string } | null;
    contexts?: ContextItem[];
}

interface ContextItemPayload {
    id: string;
    name: string;
    text: string;
    categoryName: string;
    identity?: { name: string } | null;
}

interface ContextCategoryPayload {
    id: string;
    name: string;
    description?: string | null;
    identity?: { name: string } | null;
}

function truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

export async function notifyDiscordNewContextCategory(payload: ContextCategoryPayload): Promise<void> {
    const token = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_CONTEXTS_CHANNEL_ID;

    console.log(`[Discord] notifyDiscordNewContextCategory called — channelId: ${channelId}, token present: ${!!token}`);

    if (!token || !channelId) {
        console.warn("[Discord] Category notification skipped — missing BOT_TOKEN or CONTEXTS_CHANNEL_ID");
        return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clipping-house.onrender.com";
    const identityName = payload.identity?.name;
    const identityAvatarUrl = identityName
        ? `https://api.dicebear.com/9.x/glass/png?seed=${encodeURIComponent(identityName)}&size=80`
        : undefined;

    const embed = {
        author: {
            name: identityName || "Global / Unassigned",
            icon_url: identityAvatarUrl || "https://api.dicebear.com/9.x/glass/png?seed=Global&size=80",
        },
        title: payload.name,
        description: payload.description ? truncate(payload.description, 300) : "New context category created",
        color: 0x00E676, // Bright Green
        fields: [
            {
                name: "👤  Creator",
                value: identityName || "*Global / Unassigned*",
                inline: true,
            },
        ],
        footer: { text: `Clipping House  ·  Context Lib  ·  ID: ${payload.id}` },
        timestamp: new Date().toISOString(),
    };

    const body = {
        content: `New context category created: **${payload.name}**`,
        embeds: [embed],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 5,
                        label: "View on Dashboard",
                        url: `${appUrl}/context`,
                        emoji: { name: "🔗" },
                    },
                ],
            },
        ],
    };

    try {
        console.log(`[Discord] Sending context category embed to channel ${channelId}...`);
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bot ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(`[Discord] Category Bot API error ${res.status}:`, err);
            return;
        }
        console.log("[Discord] Context category message sent successfully.");
    } catch (err) {
        console.error("[Discord] Category Request failed:", err);
    }

} export async function notifyDiscordNewCampaign(campaign: CampaignPayload): Promise<string | null> {
    const token = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_CAMPAIGNS_CHANNEL_ID;

    if (!token || !channelId) {
        console.warn("[Discord] Campaign notification skipped — missing BOT_TOKEN or CAMPAIGNS_CHANNEL_ID");
        return null;
    }

    // ── Build context block ──────────────────────────────────────────────
    let contextBlock = "";
    if (campaign.contexts && campaign.contexts.length > 0) {
        contextBlock = campaign.contexts
            .map((c) => `**▸ ${c.name}**\n\`\`\`${truncate(c.text, 300)}\`\`\``)
            .join("\n");
        contextBlock = truncate(contextBlock, 1800);
    }

    // ── Build rules block ────────────────────────────────────────────────
    const rulesBlock = campaign.rules
        ? truncate(campaign.rules, 900)
        : "*No rules specified.*";

    // ── Platform badge styling ───────────────────────────────────────────
    const platformEmojis: Record<string, string> = {
        tiktok: "🎵", youtube: "▶️", instagram: "📸", twitch: "🟣",
    };
    const platformKey = (campaign.platform || "").toLowerCase();
    const platformEmoji = platformEmojis[platformKey] || "🌐";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clipping-house.onrender.com";
    const identityName = campaign.identity?.name;
    const identityAvatarUrl = identityName
        ? `https://api.dicebear.com/9.x/glass/png?seed=${encodeURIComponent(identityName)}&size=80`
        : undefined;

    // ── Embed ────────────────────────────────────────────────────────────
    const embed = {
        author: {
            name: identityName || "Global / Unassigned",
            icon_url: identityAvatarUrl || "https://api.dicebear.com/9.x/glass/png?seed=Global&size=80",
        },
        title: campaign.name,
        description: "New campaign opportunity is now available",
        color: 0xFFD700, // Gold Yellow
        fields: [
            {
                name: "Pay Rate",
                value: campaign.rpm ? `**$${campaign.rpm}** per 100k views` : "—",
                inline: true,
            },
            {
                name: "Allowed Platforms",
                value: campaign.platform
                    ? campaign.platform.toUpperCase()
                    : "—",
                inline: true,
            },
            {
                name: "Niches",
                value: campaign.niche
                    ? campaign.niche.split(",").map(n => `• ${n.trim()}`).join("\n")
                    : "—",
                inline: false,
            },
            {
                name: "📋  Approval Process",
                value: rulesBlock,
                inline: false,
            },
            ...(campaign.sound
                ? [{
                    name: "🎵  Sound / Audio",
                    value: campaign.sound,
                    inline: false,
                }]
                : []),
            ...(contextBlock
                ? [{
                    name: `📚  Context  ·  ${campaign.contexts!.length} item${campaign.contexts!.length > 1 ? "s" : ""}`,
                    value: contextBlock,
                    inline: false,
                }]
                : []),
        ],
        footer: {
            text: `Clipping House  ·  ID: ${campaign.id}`,
        },
        timestamp: new Date().toISOString(),
    };

    const body = {
        content: `@everyone — New campaign opportunity for **${campaign.niche || "Content Creators"}**`,
        embeds: [embed],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 5,
                        label: "View on Dashboard",
                        url: `${appUrl}/campaigns`,
                        emoji: { name: "🔗" },
                    },
                ],
            },
        ],
    };

    try {
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bot ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(`[Discord] Bot API error ${res.status}:`, err);
            return null;
        }

        const msg = await res.json();

        // Start a thread on the new message
        const threadRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${msg.id}/threads`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bot ${token}`,
            },
            body: JSON.stringify({
                name: `💬 Chat: ${campaign.name}`,
                auto_archive_duration: 4320, // 3 days
            }),
        });

        if (threadRes.ok) {
            const threadData = await threadRes.json();
            const threadUrl = `https://discord.com/channels/${threadData.guild_id}/${threadData.id}`;
            return threadUrl;
        } else {
            console.error(`[Discord] Thread creation failed ${threadRes.status}:`, await threadRes.text());
        }

        return null;
    } catch (err) {
        // Non-fatal — never let Discord errors crash campaign creation
        console.error("[Discord] Request failed:", err);
        return null;
    }
}

export async function notifyDiscordNewContextItem(payload: ContextItemPayload): Promise<void> {
    const token = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_CONTEXTS_CHANNEL_ID;

    console.log(`[Discord] notifyDiscordNewContextItem called — channelId: ${channelId}, token present: ${!!token}`);

    if (!token || !channelId) {
        console.warn("[Discord] Context notification skipped — missing BOT_TOKEN or CONTEXTS_CHANNEL_ID");
        return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clipping-house.onrender.com";
    const identityName = payload.identity?.name;
    const identityAvatarUrl = identityName
        ? `https://api.dicebear.com/9.x/glass/png?seed=${encodeURIComponent(identityName)}&size=80`
        : undefined;

    const embed = {
        author: {
            name: identityName || "Global / Unassigned",
            icon_url: identityAvatarUrl || "https://api.dicebear.com/9.x/glass/png?seed=Global&size=80",
        },
        title: payload.name,
        description: `New content added to **${payload.categoryName}**`,
        color: 0x00E676, // Bright Green
        fields: [
            {
                name: "📁  Category",
                value: payload.categoryName,
                inline: true,
            },
            {
                name: "👤  Creator",
                value: identityName || "*Global / Unassigned*",
                inline: true,
            },
            {
                name: "📝  Content",
                value: `\`\`\`\n${truncate(payload.text, 3500)}\n\`\`\``,
                inline: false,
            },
        ],
        footer: { text: `Clipping House  ·  Context Lib  ·  ID: ${payload.id}` },
        timestamp: new Date().toISOString(),
    };

    const body = {
        content: `New context item added to **${payload.categoryName}**`,
        embeds: [embed],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 5,
                        label: "View on Dashboard",
                        url: `${appUrl}/context`,
                        emoji: { name: "🔗" },
                    },
                ],
            },
        ],
    };

    try {
        console.log(`[Discord] Sending context item embed to channel ${channelId}...`);
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bot ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(`[Discord] Context Bot API error ${res.status}:`, err);
            return;
        }

        console.log("[Discord] Context item message sent successfully.");
    } catch (err) {
        console.error("[Discord] Context Request failed:", err);
    }
}
