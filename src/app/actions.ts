"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
        include: { items: true },
        orderBy: { createdAt: 'asc' }
    });
}

export async function createContextCategory(name: string, description: string) {
    const cat = await prisma.contextCategory.create({
        data: { name, description }
    });
    revalidatePath("/context");
    return cat;
}

export async function createContextItem(categoryId: string, name: string, text: string) {
    const item = await prisma.contextItem.create({
        data: { categoryId, name, text }
    });
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
        include: { contexts: { select: { id: true, name: true, text: true, categoryId: true, createdAt: true, updatedAt: true } } },
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
        },
        include: { contexts: true }
    });
    revalidatePath("/campaigns");
    return { ...campaign, earned: campaign.earned ? Number(campaign.earned) : null };
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
