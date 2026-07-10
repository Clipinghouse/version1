import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { campaignId } = await req.json();

        if (!campaignId) {
            return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey || apiKey.includes("replace-with-your-key")) {
            return NextResponse.json({ error: "OPENROUTER_API_KEY not configured. Add it to your .env file." }, { status: 503 });
        }

        // Fetch campaign with all linked context items (single query)
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { contexts: { select: { id: true, name: true, text: true } } }
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // Build the prompt
        const customFields = Array.isArray(campaign.customFields)
            ? (campaign.customFields as any[]).map((f: any) => `  - ${f.label}: ${f.value}`).join("\n")
            : "";

        const contextSection = campaign.contexts.length > 0
            ? campaign.contexts.map(c => `### ${c.name}\n${c.text}`).join("\n\n")
            : "No context items linked.";

        const prompt = `You are an expert campaign manager delegating tasks. Write a direct, comprehensive system prompt that I can copy and paste to another AI (or content creator) who will be executing this campaign. 

The output prompt you generate MUST:
1. Start by explicitly stating that we are embarking on a newly launched campaign.
2. Clearly explain all the campaign parameters (niche, platform, goals), the strict rules, and all the relevant context provided below so the receiver fully understands exactly what the campaign entails from top to bottom.
3. Be written in the second person ("You will be doing...", "This is the campaign you are working on").
4. NOT be a JSON file or bullet-point list, but a well-woven, practical briefing guide.

## Campaign: ${campaign.name}

**Platform:** ${campaign.platform || "Not specified"}
**RPM:** ${campaign.rpm ? `$${campaign.rpm}` : "Not specified"}
**Sound/Music Style:** ${campaign.sound || "Not specified"}
**Niche:** ${campaign.niche || "Not specified"}

**Rules & Guidelines:**
${campaign.rules || "No rules specified."}

${customFields ? `**Custom Fields:**\n${customFields}` : ""}

## Linked Context
${contextSection}

Generate ONLY the prompt that will be passed on.`;

        // Call OpenRouter
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://clipping-house.app",
                "X-Title": "Clipping House"
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-3-ultra-550b-a55b:free",
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            if (response.status === 429) {
                return NextResponse.json({ error: "Rate limit reached. Please wait a moment and try again." }, { status: 429 });
            }
            return NextResponse.json({ error: `OpenRouter error (${response.status}): ${errBody}` }, { status: response.status });
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (!text) {
            return NextResponse.json({ error: "No content returned from the model. Please try again." }, { status: 500 });
        }

        // Cache in DB
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { lastExport: text }
        });

        return NextResponse.json({ text });
    } catch (err: any) {
        console.error("Export error:", err);
        return NextResponse.json({ error: "Unexpected server error. Please try again." }, { status: 500 });
    }
}
