"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyDiscordNewCampaign, notifyDiscordNewContextItem, notifyDiscordNewContextCategory } from "@/lib/discord";

// --- STORED CONTENTS ---
export async function getStoredContents() {
    return prisma.storedContent.findMany({ orderBy: { updatedAt: 'desc' } });
}

export async function createStoredContent(title: string, body: string) {
    const item = await prisma.storedContent.create({
        data: { title, body }
    });
    revalidatePath("/stored-contents");
    return item;
}

export async function updateStoredContent(id: string, title: string, body: string) {
    const item = await prisma.storedContent.update({
        where: { id },
        data: { title, body }
    });
    revalidatePath("/stored-contents");
    return item;
}

export async function deleteStoredContent(id: string) {
    await prisma.storedContent.delete({ where: { id } });
    revalidatePath("/stored-contents");
}

// --- CONTEXT ---
export async function getContextCategories() {
    return prisma.contextCategory.findMany({
        include: { items: true, identity: true },
        orderBy: { createdAt: 'asc' }
    });
}

export async function createContextCategory(name: string, description: string, identityId?: string) {
    const cat = await prisma.contextCategory.create({
        data: { name, description, identityId: identityId === "PASS" || identityId === "NEW" || !identityId ? null : identityId },
        include: { identity: true }
    });

    // Notify Discord
    try {
        await notifyDiscordNewContextCategory({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            identity: cat.identity,
        });
    } catch (e) {
        console.error("[Discord] Failed to notify category creation:", e);
    }

    revalidatePath("/context");
    return cat;
}

export async function createContextItem(categoryId: string, name: string, text: string) {
    const item = await prisma.contextItem.create({
        data: { categoryId, name, text }
    });

    // Notify Discord (awaited so errors surface in logs)
    try {
        const cat = await prisma.contextCategory.findUnique({
            where: { id: categoryId },
            include: { identity: true }
        });
        if (cat) {
            await notifyDiscordNewContextItem({
                id: item.id,
                name: item.name,
                text: item.text,
                categoryName: cat.name,
                identity: cat.identity
            });
        }
    } catch (e) {
        console.error("[Discord] Failed to notify context item:", e);
    }

    revalidatePath("/context");
    return item;
}

export async function deleteContextCategory(id: string) {
    await prisma.contextCategory.delete({ where: { id } });
    revalidatePath("/context");
}

export async function deleteContextItem(id: string) {
    await prisma.contextItem.delete({ where: { id } });
    revalidatePath("/context");
}

// Lightweight list for picker — only id + name, no body text
export async function getContextItemsForPicker() {
    return prisma.contextItem.findMany({
        select: { id: true, name: true, categoryId: true },
        orderBy: { createdAt: 'asc' }
    });
}

// --- CAMPAIGNS ---
export async function getCampaigns() {
    const campaigns = await prisma.campaign.findMany({
        include: {
            contexts: { select: { id: true, name: true, text: true, categoryId: true, createdAt: true, updatedAt: true } },
            identity: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    // Prisma `Decimal` type cannot cross the Server→Client boundary — convert to plain number
    return campaigns.map(c => ({
        ...c,
        earned: c.earned ? Number(c.earned) : null,
    }));
}

export async function createCampaign(data: any) {
    const campaign = await prisma.campaign.create({
        data: {
            name: data.name,
            rpm: data.rpm,
            platform: data.platform,
            sound: data.sound,
            niche: data.niche,
            rules: data.rules,
            customFields: data.customFields || [],
            identityId: data.identityId || null,
        },
        include: { contexts: true, identity: true }
    });
    // Await discord thread creation lightly, fallback null if failure
    const threadUrl = await notifyDiscordNewCampaign({
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        rpm: campaign.rpm,
        niche: campaign.niche,
        sound: campaign.sound,
        rules: campaign.rules,
        identity: campaign.identity,
        contexts: campaign.contexts,
    }).catch(() => null);

    if (threadUrl) {
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: { discordThreadUrl: threadUrl }
        });
        (campaign as any).discordThreadUrl = threadUrl;
    }

    revalidatePath("/campaigns");
    const result = { ...campaign, earned: campaign.earned ? Number(campaign.earned) : null };
    return result;
}

export async function createMissingDiscordThread(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { contexts: true, identity: true }
    });
    if (!campaign) return null;
    if (campaign.discordThreadUrl) return campaign.discordThreadUrl;

    const threadUrl = await notifyDiscordNewCampaign({
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        rpm: campaign.rpm,
        niche: campaign.niche,
        sound: campaign.sound,
        rules: campaign.rules,
        identity: campaign.identity,
        contexts: campaign.contexts,
    }).catch(() => null);

    if (threadUrl) {
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { discordThreadUrl: threadUrl }
        });
        revalidatePath("/campaigns");
    }
    return threadUrl;
}

export async function completeCampaign(id: string, clips: number, earned: number, views: string) {
    const campaign = await prisma.campaign.update({
        where: { id },
        data: { isCompleted: true, clips, earned, views },
    });
    revalidatePath("/campaigns");
    return { ...campaign, earned: campaign.earned ? Number(campaign.earned) : null };
}

// --- CONTEXT LINKING (join table) ---
export async function linkContextToCampaign(campaignId: string, contextItemId: string) {
    const campaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: { contexts: { connect: { id: contextItemId } } },
        include: { contexts: { select: { id: true, name: true, text: true, categoryId: true, createdAt: true, updatedAt: true } } }
    });
    return { ...campaign, earned: campaign.earned ? Number(campaign.earned) : null };
}

export async function unlinkContextFromCampaign(campaignId: string, contextItemId: string) {
    const campaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: { contexts: { disconnect: { id: contextItemId } } },
        include: { contexts: { select: { id: true, name: true, text: true, categoryId: true, createdAt: true, updatedAt: true } } }
    });
    return { ...campaign, earned: campaign.earned ? Number(campaign.earned) : null };
}

export async function deleteCampaign(id: string) {
    try {
        await prisma.campaign.delete({ where: { id } });
    } catch (e) {
        // Record might not exist, safely ignore
    }
    revalidatePath("/campaigns");
}

// --- EXPORT (cache result in DB) ---
export async function saveExport(campaignId: string, text: string) {
    await prisma.campaign.update({
        where: { id: campaignId },
        data: { lastExport: text }
    });
}

// --- IDENTITIES ---
export async function getIdentities() {
    return prisma.identity.findMany({
        include: { _count: { select: { campaigns: true } } },
        orderBy: { name: 'asc' }
    });
}

export async function createIdentity(name: string) {
    const existing = await prisma.identity.findUnique({ where: { name } });
    if (existing) return existing;
    const identity = await prisma.identity.create({ data: { name } });
    revalidatePath("/campaigns");
    return identity;
}

export async function deleteIdentity(id: string) {
    try {
        await prisma.campaign.updateMany({
            where: { identityId: id },
            data: { identityId: null }
        });
        await prisma.contextCategory.updateMany({
            where: { identityId: id },
            data: { identityId: null }
        });
        await prisma.identity.delete({ where: { id } });
    } catch (e) {
        // safely ignore missing record
    }
    revalidatePath("/campaigns");
    revalidatePath("/context");
}
