"use client";

import { useState, useEffect, useMemo } from "react";
import AppShell from "../components/AppShell";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createCampaign, completeCampaign, linkContextToCampaign, unlinkContextFromCampaign, getContextItemsForPicker, deleteCampaign, getContextCategories, createContextCategory, createContextItem, createIdentity, deleteIdentity, createMissingDiscordThread } from "../actions";

interface ContextItem { id: string; name: string; text: string; categoryId: string; }
interface Campaign {
    id: string;
    name: string;
    rpm: string | null;
    platform: string | null;
    sound: string | null;
    niche: string | null;
    rules: string | null;
    customFields: any;
    isCompleted: boolean;
    clips: number | null;
    earned: number | null;
    views: string | null;
    lastExport: string | null;
    contexts: ContextItem[];
    identity?: { id: string; name: string } | null;
}
interface PickerItem { id: string; name: string; categoryId: string; }

function CampaignCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
    return (
        <div className={`dc-card ${campaign.isCompleted ? 'dc-completed' : ''}`} onClick={onClick}>
            {campaign.isCompleted ? (
                <div className="dc-love" style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, color: "rgba(255,255,255,0.5)", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "2px 8px", zIndex: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>COMPLETED <span style={{ fontSize: "0.85rem" }}>❤️</span></div>
            ) : (
                <div className="dc-live-emoji" title="Active Campaign" style={{ padding: "4px", zIndex: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", filter: "drop-shadow(0 0 4px rgba(0,230,118,0.4))" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#00e676" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                </div>
            )}
            <div className="dc-banner"><h2 className="dc-campaign-name">{campaign.name}</h2></div>
            <div className="dc-body">
                <div className="dc-rpm-line">{campaign.rpm?.startsWith('$') ? campaign.rpm : `$${campaign.rpm || 0}`} <span>RPM</span></div>
                <div className="dc-chips">
                    <span className="dc-chip">{campaign.platform || "Platform"}</span>
                    {campaign.niche && <span className="dc-chip">{campaign.niche}</span>}
                </div>
                <p className="dc-snippet">{campaign.rules ? (campaign.rules.length > 80 ? campaign.rules.substring(0, 80) + "..." : campaign.rules) : "No rules specified."}</p>

                {/* Discord Chat Action */}
                <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            if ((campaign as any).discordThreadUrl) {
                                window.open((campaign as any).discordThreadUrl, "_blank");
                            } else {
                                const url = await createMissingDiscordThread(campaign.id);
                                if (url) {
                                    window.open(url, "_blank");
                                    window.location.reload();
                                } else {
                                    alert("Could not create Discord thread. Make sure Bot is active.");
                                }
                            }
                        }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "10px", background: "#5865F2", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 4px 12px rgba(88,101,242,0.3)" }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                        title="Discord Thread"
                    >
                        <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
                            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CampaignsClient({ initialCampaigns, initialIdentities }: { initialCampaigns: Campaign[], initialIdentities: { id: string; name: string, _count?: { campaigns: number } }[] }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (searchParams.get("create") === "true") {
            setIsCreating(true);
            router.replace(pathname);
        }
    }, [searchParams, router, pathname]);

    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    // Filter state
    const [showFilter, setShowFilter] = useState(false);
    const [fName, setFName] = useState("");
    const [fPlatform, setFPlatform] = useState("");
    const [fNiche, setFNiche] = useState("");
    const [fIdentity, setFIdentity] = useState("");
    const [fStatus, setFStatus] = useState<"all" | "active" | "completed">("all");

    // Avatar tooltip hover state
    const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null);

    // Completion form state
    const [showForm, setShowForm] = useState(false);
    const [clips, setClips] = useState("");
    const [earned, setEarned] = useState("");
    const [views, setViews] = useState("");

    // Campaign creation form state
    const [identities, setIdentities] = useState<{ id: string; name: string, _count?: { campaigns: number } }[]>(initialIdentities);
    const [cIdentityId, setCIdentityId] = useState(initialIdentities.length > 0 ? initialIdentities[0].id : "NEW");
    const [newIdentityName, setNewIdentityName] = useState("");
    const [showCreateIdentity, setShowCreateIdentity] = useState(initialIdentities.length === 0);

    const [cName, setCName] = useState("");
    const [cRpm, setCRpm] = useState("");
    const [cPlatform, setCPlatform] = useState<string[]>([]);
    const [cSound, setCSound] = useState("");
    const [cNiche, setCNiche] = useState("");
    const [cRules, setCRules] = useState("");
    const [customFields, setCustomFields] = useState<{ id: number, label: string, value: string }[]>([]);
    const [fieldCounter, setFieldCounter] = useState(0);

    // Context linking state
    const [pickerItems, setPickerItems] = useState<PickerItem[]>([]);
    const [pickerSearch, setPickerSearch] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [linkingLoading, setLinkingLoading] = useState<string | null>(null);

    // Inline Create Context State
    const [showCreateContext, setShowCreateContext] = useState(false);
    const [newContextName, setNewContextName] = useState("");
    const [newContextText, setNewContextText] = useState("");
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [creatingContext, setCreatingContext] = useState(false);

    // Delete state
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Export state
    const [exportLoading, setExportLoading] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [exportText, setExportText] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const totalSteps = 4;
    const activeCampaign = activeCampaignId ? campaigns.find(c => c.id === activeCampaignId) ?? null : null;

    // Derived: Top 5 identities by campaign counts
    const topIdentities = useMemo(() => {
        return [...identities].sort((a, b) => (b._count?.campaigns || 0) - (a._count?.campaigns || 0)).slice(0, 5);
    }, [identities]);

    // Filtered campaigns
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter(c => {
            if (fName && !c.name.toLowerCase().includes(fName.toLowerCase())) return false;
            if (fPlatform && !(c.platform || "").toLowerCase().includes(fPlatform.toLowerCase())) return false;
            if (fNiche && !(c.niche || "").toLowerCase().includes(fNiche.toLowerCase())) return false;
            if (fIdentity && c.identity?.id !== fIdentity) return false;
            if (fStatus === "active" && c.isCompleted) return false;
            if (fStatus === "completed" && !c.isCompleted) return false;
            return true;
        });
    }, [campaigns, fName, fPlatform, fNiche, fIdentity, fStatus]);

    const handleBack = () => setStep(s => Math.max(s - 1, 1));
    const handleCancel = () => { setIsCreating(false); setStep(1); };

    const handleNext = async () => {
        if (step < totalSteps) {
            setStep(s => Math.min(s + 1, totalSteps));
        } else {
            const newCampaign = await createCampaign({
                name: cName || "Untitled Campaign",
                rpm: cRpm,
                platform: cPlatform.join(", "),
                sound: cSound,
                niche: cNiche,
                rules: cRules,
                customFields,
                identityId: cIdentityId !== "NEW" && cIdentityId !== "" ? cIdentityId : null,
            });
            setCampaigns(prev => [newCampaign as unknown as Campaign, ...prev]);

            // Recalculate identity counts locally to update top avatars without a full refresh
            if (cIdentityId !== "NEW" && cIdentityId !== "") {
                setIdentities(prev => prev.map(id => id.id === cIdentityId ? { ...id, _count: { campaigns: (id._count?.campaigns || 0) + 1 } } : id));
            }

            setIsCreating(false); setStep(1);
            setCName(""); setCRpm(""); setCPlatform([]); setCSound(""); setCNiche(""); setCRules(""); setCustomFields([]); setCIdentityId(identities.length > 0 ? identities[0].id : "NEW"); setNewIdentityName(""); setShowCreateIdentity(identities.length === 0);
        }
    };

    const addCustomField = () => { setCustomFields([...customFields, { id: fieldCounter, label: "", value: "" }]); setFieldCounter(f => f + 1); };
    const updateCustomField = (id: number, key: 'label' | 'value', val: string) => setCustomFields(customFields.map(f => f.id === id ? { ...f, [key]: val } : f));
    const removeCustomField = (id: number) => setCustomFields(customFields.filter(f => f.id !== id));

    const openPicker = async () => {
        if (pickerItems.length === 0) {
            const items = await getContextItemsForPicker();
            setPickerItems(items);
        }
        if (categories.length === 0) {
            const cats = await getContextCategories();
            setCategories(cats);
        }
        setSelectedCategoryId("PASS");
        setPickerSearch("");
        setShowCreateContext(false);
        setShowPicker(true);
    };

    const handleLink = async (contextItemId: string) => {
        if (!activeCampaignId) return;
        setLinkingLoading(contextItemId);
        const updated = await linkContextToCampaign(activeCampaignId, contextItemId);
        setCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...updated, earned: updated.earned } as Campaign : c));
        setLinkingLoading(null);
    };

    const handleUnlink = async (contextItemId: string) => {
        if (!activeCampaignId) return;
        setLinkingLoading(contextItemId);
        const updated = await unlinkContextFromCampaign(activeCampaignId, contextItemId);
        setCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...updated, earned: updated.earned } as Campaign : c));
        setLinkingLoading(null);
    };

    const handleCreateAndLinkContext = async () => {
        if (!activeCampaignId || !newContextName || !newContextText || !selectedCategoryId) return;
        setCreatingContext(true);
        try {
            let targetCategoryId = selectedCategoryId;

            if (selectedCategoryId === "NEW") {
                if (!newCategoryName) {
                    setCreatingContext(false);
                    return;
                }
                const cat = await createContextCategory(newCategoryName, "");
                if (cat) setCategories(prev => [...prev, { id: cat.id, name: cat.name }]);
                targetCategoryId = cat?.id ?? "";
            } else if (selectedCategoryId === "PASS") {
                let cat = categories.find(c => c.name === "no category context");
                if (!cat) {
                    const newCat = await createContextCategory("no category context", "");
                    if (newCat) setCategories(prev => [...prev, { id: newCat.id, name: newCat.name }]);
                    targetCategoryId = newCat?.id ?? "";
                } else {
                    targetCategoryId = cat.id;
                }
            }

            const newItem = await createContextItem(targetCategoryId, newContextName, newContextText);
            // Add to picker items
            const newPickerItem = { id: newItem.id, name: newItem.name, categoryId: newItem.categoryId };
            setPickerItems(prev => [...prev, newPickerItem]);

            // Link directly
            await handleLink(newItem.id);

            // Reset
            setNewContextName("");
            setNewContextText("");
            setNewCategoryName("");
            setSelectedCategoryId("PASS");
            setShowCreateContext(false);
        } catch (err) {
            console.error(err);
        }
        setCreatingContext(false);
    };

    const generateRawPrompt = () => {
        if (!activeCampaign) return "";
        const customFields = Array.isArray(activeCampaign.customFields)
            ? (activeCampaign.customFields as any[]).map((f: any) => `  - ${f.label}: ${f.value}`).join("\n")
            : "";

        const contextSection = activeCampaign.contexts.length > 0
            ? activeCampaign.contexts.map(c => `### ${c.name}\n${c.text}`).join("\n\n")
            : "No context items linked.";

        return `You are a creative director writing a concise, ready-to-use creative brief for a content creator.

## Campaign: ${activeCampaign.name}

**Platform:** ${activeCampaign.platform || "Not specified"}
**RPM:** ${activeCampaign.rpm ? `$${activeCampaign.rpm}` : "Not specified"}
**Sound/Music Style:** ${activeCampaign.sound || "Not specified"}
**Niche:** ${activeCampaign.niche || "Not specified"}
**Status:** ${activeCampaign.isCompleted ? "Completed" : "Active"}

**Rules & Guidelines:**
${activeCampaign.rules || "No rules specified."}

${customFields ? `**Custom Fields:**\n${customFields}` : ""}

## Linked Context
${contextSection}`;
    };

    const handleExport = async () => {
        if (!activeCampaignId || !activeCampaign) return;

        // If a generated brief already exists in the database, just show it to save AI credits.
        if (activeCampaign.lastExport && !exportText) {
            setExportText(activeCampaign.lastExport);
            return;
        }

        setExportLoading(true); setExportError(null); setExportText(null);
        try {
            const res = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ campaignId: activeCampaignId })
            });
            const data = await res.json();
            if (!res.ok) { setExportError(data.error || "Export failed"); }
            else {
                setExportText(data.text);
                // Update local state with cached export
                setCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, lastExport: data.text } : c));
            }
        } catch (e: any) {
            setExportError("Network error. Please try again.");
        }
        setExportLoading(false);
    };

    const handleDelete = async () => {
        if (!activeCampaignId) return;
        await deleteCampaign(activeCampaignId);
        setCampaigns(prev => prev.filter(c => c.id !== activeCampaignId));
        setActiveCampaignId(null);
        setDeleteConfirm(false);
    };

    const handleCopy = () => {
        const text = exportText || activeCampaign?.lastExport || "";
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filteredPickerItems = pickerItems.filter(p =>
        p.name.toLowerCase().includes(pickerSearch.toLowerCase())
    );

    return (
        <AppShell>
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="campaign-dashboard">
                    <div className="campaign-header">
                        <div className="campaign-header-left">
                            <div className="avatar-group">
                                {topIdentities.map((identity) => (
                                    <div
                                        key={identity.id}
                                        style={{ position: "relative" }}
                                        onMouseEnter={() => setHoveredAvatar(identity.id)}
                                        onMouseLeave={() => setHoveredAvatar(null)}
                                    >
                                        <div className="initial-avatar" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: hoveredAvatar === identity.id ? "2px solid rgba(255,255,255,0.8)" : "", transition: "all 0.2s ease" }}>
                                            <img src={`https://api.dicebear.com/9.x/glass/svg?seed=${identity.name}`} alt={identity.name} width={52} height={52} style={{ objectFit: "cover" }} />
                                        </div>
                                        {/* Stylish Tooltip */}
                                        <div style={{
                                            position: "absolute",
                                            top: "-42px",
                                            left: "50%",
                                            transform: `translateX(-50%) ${hoveredAvatar === identity.id ? "translateY(0) scale(1)" : "translateY(8px) scale(0.95)"}`,
                                            opacity: hoveredAvatar === identity.id ? 1 : 0,
                                            pointerEvents: "none",
                                            background: "linear-gradient(135deg, rgba(80,80,90,0.98), rgba(40,40,45,0.98))",
                                            border: "1px solid rgba(255,255,255,0.15)",
                                            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                                            padding: "6px 14px",
                                            borderRadius: "12px",
                                            color: "#fff",
                                            fontSize: "0.75rem",
                                            fontWeight: 700,
                                            letterSpacing: "0.05em",
                                            whiteSpace: "nowrap",
                                            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                                            zIndex: 100
                                        }}>
                                            {identity.name}
                                            {/* Tooltip triangle tail */}
                                            <div style={{ position: "absolute", bottom: "-4px", left: "50%", transform: "translateX(-50%) rotate(45deg)", width: "8px", height: "8px", background: "rgba(40,40,45,0.98)", borderBottom: "1px solid rgba(255,255,255,0.15)", borderRight: "1px solid rgba(255,255,255,0.15)" }} />
                                        </div>
                                    </div>
                                ))}
                                {topIdentities.length === 0 && (
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", fontStyle: "italic" }}>No creators yet</div>
                                )}
                            </div>
                        </div>
                        <div className="campaign-header-right">
                            <button className="btn-filter" title="Filter" onClick={() => setShowFilter(v => !v)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                </svg>
                            </button>
                            {!isCreating && !activeCampaignId && (
                                <button className="btn-ui neutral campaign-add-btn" onClick={() => setIsCreating(true)}>+ Add Campaign</button>
                            )}
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilter && !isCreating && !activeCampaignId && (
                        <div style={{ marginTop: 16, padding: "20px 24px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, animation: "fadeIn 0.2s ease" }}>
                            {/* Filter inputs row */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 150, flex: 1 }}>
                                    <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Name</label>
                                    <div style={{ position: "relative", width: "100%" }}>
                                        <input className="premium-input" style={{ padding: "8px 28px 8px 12px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }} placeholder="Search by name…" value={fName} onChange={e => setFName(e.target.value)} />
                                        {fName && <button onClick={() => setFName("")} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", cursor: "pointer", transition: "all 0.2s" }}>✕</button>}
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 130, flex: 1 }}>
                                    <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Platform</label>
                                    <div style={{ position: "relative", width: "100%" }}>
                                        <input className="premium-input" style={{ padding: "8px 28px 8px 12px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }} placeholder="e.g. TikTok…" value={fPlatform} onChange={e => setFPlatform(e.target.value)} />
                                        {fPlatform && <button onClick={() => setFPlatform("")} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", cursor: "pointer", transition: "all 0.2s" }}>✕</button>}
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 130, flex: 1 }}>
                                    <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Niche</label>
                                    <div style={{ position: "relative", width: "100%" }}>
                                        <input className="premium-input" style={{ padding: "8px 28px 8px 12px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }} placeholder="e.g. E-commerce…" value={fNiche} onChange={e => setFNiche(e.target.value)} />
                                        {fNiche && <button onClick={() => setFNiche("")} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", cursor: "pointer", transition: "all 0.2s" }}>✕</button>}
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 130, flex: 1 }}>
                                    <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Identity</label>
                                    <div style={{ position: "relative", width: "100%" }}>
                                        <select className="premium-input" value={fIdentity} onChange={e => setFIdentity(e.target.value)} style={{ padding: "8px 28px 8px 12px", fontSize: "0.85rem", appearance: "none", width: "100%", boxSizing: "border-box" }}>
                                            <option value="">All Identities</option>
                                            {identities.map(id => <option key={id.id} value={id.id}>{id.name}</option>)}
                                        </select>
                                        {fIdentity && <button onClick={() => setFIdentity("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", cursor: "pointer", transition: "all 0.2s" }}>✕</button>}
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
                                    <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</label>
                                    <div style={{ display: "flex", gap: 8, height: "35px", alignItems: "center" }}>
                                        {(["all", "active", "completed"] as const).map(s => (
                                            <button key={s} onClick={() => setFStatus(s)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: "0.82rem", fontFamily: "var(--font-sans)", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.2s", background: fStatus === s ? "#ffffff" : "transparent", color: fStatus === s ? "#000" : "rgba(255,255,255,0.5)", borderColor: fStatus === s ? "#ffffff" : "rgba(255,255,255,0.15)", height: "100%" }}>
                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <hr className="campaign-divider" />

                    {/* Campaign Grid */}
                    {!isCreating && !activeCampaignId && (
                        <div className="action-cards-grid" style={{ padding: "32px 0 0 0", marginTop: "12px" }}>
                            {filteredCampaigns.map(camp => (
                                <CampaignCard key={camp.id} campaign={camp} onClick={() => { setActiveCampaignId(camp.id); setShowPicker(false); setExportText(null); setExportError(null); }} />
                            ))}
                            {filteredCampaigns.length === 0 && (
                                <p style={{ color: "#aaa", fontFamily: "var(--font-sans)", fontStyle: "italic" }}>
                                    {campaigns.length === 0 ? "No campaigns yet." : "No campaigns match the current filters."}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Inline Bento Detail View */}
                    {!isCreating && activeCampaign && (
                        <div style={{ padding: "0 0 32px 0", animation: "fadeIn 0.3s ease", width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
                            {/* Main Inline Container */}
                            <div style={{ position: "relative", width: "100%", background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: "24px", display: "flex", flexDirection: "column" }}>

                                {/* Header Component */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "clamp(16px, 4vw, 32px)", paddingBottom: "24px", borderBottom: "1px solid #1a1a1a" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <h2 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: "#fff", overflowWrap: "break-word", wordBreak: "break-word" }}>{activeCampaign.name}</h2>
                                        </div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                            <span style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "8px", background: "#fff", color: "#000", fontWeight: 700 }}>RPM: {activeCampaign.rpm?.startsWith('$') ? activeCampaign.rpm : `$${activeCampaign.rpm || 0}`}</span>
                                            {activeCampaign.platform && <span style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "8px", background: "#222", color: "#fff", border: "1px solid #333" }}>{activeCampaign.platform}</span>}
                                            {activeCampaign.niche && <span style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "8px", background: "#222", color: "#fff", border: "1px solid #333" }}>{activeCampaign.niche}</span>}
                                            {activeCampaign.sound && <span style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "8px", background: "#222", color: "#fff", border: "1px solid #333" }}>{activeCampaign.sound}</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                        {/* Icon Actions */}
                                        {!deleteConfirm ? (
                                            <button onClick={() => setDeleteConfirm(true)} style={{ background: "transparent", border: "1px solid #222", color: "#666", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#ff6b6b"; e.currentTarget.style.background = "rgba(255,60,60,0.1)" }} onMouseOut={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.background = "transparent" }} title="Delete Campaign">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        ) : (
                                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                <button onClick={handleDelete} title="Confirm Delete?" style={{ background: "#ff6b6b", color: "#fff", border: "none", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg></button>
                                                <button onClick={() => setDeleteConfirm(false)} title="Cancel" style={{ background: "transparent", border: "1px solid #333", color: "#fff", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                            </div>
                                        )}
                                        <div style={{ width: "1px", height: "30px", background: "#222", margin: "0 8px" }} />
                                        <button onClick={() => { setActiveCampaignId(null); setShowForm(false); setShowPicker(false); setExportText(null); setExportError(null); setDeleteConfirm(false); }} style={{ background: "#222", border: "1px solid #333", color: "#fff", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#333"} onMouseOut={e => e.currentTarget.style.background = "#222"} title="Close Detail View">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Bento Layout */}
                                <div className="detail-bento-grid" style={{ padding: "clamp(16px, 4vw, 32px)" }}>

                                    {/* Left Column */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                        {/* BENTO: Guidelines */}
                                        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "20px", padding: "24px" }}>
                                            <h4 style={{ margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Guidelines</h4>
                                            <p style={{ margin: "0 0 12px", color: "#ddd", fontSize: "0.95rem", lineHeight: 1.6 }}>{activeCampaign.rules || "No rules specified."}</p>
                                            {(activeCampaign.customFields as any[])?.map((cf: any, idx: number) => (
                                                <div key={idx} style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #222" }}>
                                                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#888", display: "block", marginBottom: "4px" }}>{cf.label}</span>
                                                    <span style={{ color: "#fff", fontSize: "0.9rem" }}>{cf.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* BENTO: Linked Context */}
                                        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "20px", padding: "24px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                                <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> Linked Context</h4>
                                                <button onClick={openPicker} title="Link Context" style={{ background: "#222", border: "1px solid #333", borderRadius: "10px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#333"} onMouseOut={e => e.currentTarget.style.background = "#222"}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                </button>
                                            </div>

                                            {showPicker && (
                                                <div style={{ marginBottom: 16, padding: 16, background: "#1a1a1a", border: "1px solid #333", borderRadius: 14, animation: "fadeIn 0.2s ease" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                                        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "#aaa" }}>{showCreateContext ? "Create & Link Context" : "Search to link:"}</span>
                                                        <button onClick={() => setShowPicker(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                                                    </div>

                                                    {!showCreateContext ? (
                                                        <>
                                                            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                                                <input className="premium-input" style={{ padding: "8px 12px", fontSize: "0.85rem", width: "100%", background: "#050505", border: "1px solid #333", boxSizing: "border-box" }} placeholder="Search..." value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} autoFocus />
                                                                <button onClick={() => setShowCreateContext(true)} title="New" style={{ background: "#fff", color: "#000", border: "none", borderRadius: 8, width: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                                </button>
                                                            </div>
                                                            <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                                                                {filteredPickerItems.length === 0 && <p style={{ color: "#666", fontSize: "0.85rem", textAlign: "center", margin: "16px 0" }}>No items found.</p>}
                                                                {filteredPickerItems.map(item => {
                                                                    const alreadyLinked = activeCampaign.contexts.some(c => c.id === item.id);
                                                                    return (
                                                                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, background: alreadyLinked ? "rgba(255, 255, 255, 0.05)" : "#050505", border: `1px solid ${alreadyLinked ? "rgba(255, 255, 255, 0.2)" : "#222"}` }}>
                                                                            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.88rem", color: alreadyLinked ? "#fff" : "#ccc" }}>{item.name}</span>
                                                                            <button disabled={linkingLoading === item.id} onClick={() => alreadyLinked ? handleUnlink(item.id) : handleLink(item.id)} style={{ background: alreadyLinked ? "transparent" : "#fff", color: alreadyLinked ? "#aaa" : "#000", border: "none", borderRadius: 8, width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: linkingLoading === item.id ? 0.5 : 1 }}>
                                                                                {alreadyLinked ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>}
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            <input className="premium-input" style={{ background: "#050505", border: "1px solid #333" }} placeholder="Context Name..." value={newContextName} onChange={e => setNewContextName(e.target.value)} />
                                                            <input className="premium-input" style={{ background: "#050505", border: "1px solid #333" }} placeholder="Detailed note..." value={newContextText} onChange={e => setNewContextText(e.target.value)} />
                                                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                                                <button style={{ background: "transparent", color: "#aaa", border: "none", padding: "8px 16px", cursor: "pointer" }} onClick={() => setShowCreateContext(false)}>Cancel</button>
                                                                <button disabled={creatingContext || !newContextName || !newContextText} onClick={handleCreateAndLinkContext} style={{ background: "#fff", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer", opacity: (!newContextName || !newContextText) ? 0.5 : 1 }}>Add</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {activeCampaign.contexts.length === 0 ? (
                                                <p style={{ color: "#666", fontSize: "0.85rem", fontStyle: "italic", fontFamily: "var(--font-sans)", margin: 0 }}>No context items linked.</p>
                                            ) : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                    {activeCampaign.contexts.map(ctx => (
                                                        <div key={ctx.id} style={{ padding: "12px 16px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 12 }}>
                                                            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff", fontWeight: 700, marginBottom: 4 }}>{ctx.name}</div>
                                                            <div style={{ color: "#aaa", fontSize: "0.9rem", lineHeight: 1.5 }}>{ctx.text}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {/* Right Column */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                                        {/* BENTO: Identity */}
                                        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "20px", padding: "24px" }}>
                                            <h4 style={{ margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Identity</h4>
                                            {activeCampaign.identity ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <img src={`https://api.dicebear.com/9.x/glass/svg?seed=${activeCampaign.identity.name}`} alt="" width={42} height={42} style={{ borderRadius: "12px", border: "1px solid #333" }} />
                                                    <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>{activeCampaign.identity.name}</span>
                                                </div>
                                            ) : <span style={{ color: "#555", fontStyle: "italic", fontSize: "0.9rem" }}>Unassigned</span>}
                                        </div>

                                        {/* BENTO: AI Export */}
                                        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "20px", padding: "24px", position: "relative" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                                <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Brief</h4>

                                                <button onClick={handleExport} disabled={exportLoading} title="Generate Outline" style={{ background: "#222", border: "1px solid #333", borderRadius: "10px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: exportLoading ? "not-allowed" : "pointer", opacity: exportLoading ? 0.5 : 1, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#333"} onMouseOut={e => e.currentTarget.style.background = "#222"}>
                                                    {exportLoading ? <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path><path d="M5 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"></path></svg>}
                                                </button>
                                            </div>

                                            {exportError && (
                                                <div style={{ padding: 10, background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.3)", borderRadius: 10, marginTop: 12 }}>
                                                    <p style={{ color: "#ff6b6b", fontSize: "0.8rem", margin: 0 }}>⚠ Failed.</p>
                                                </div>
                                            )}

                                            {(exportText || activeCampaign.lastExport) && !exportError && (
                                                <div style={{ marginTop: 12, padding: 16, background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 12, position: "relative" }}>
                                                    <button onClick={handleCopy} title="Copy Brief" style={{ position: "absolute", top: 8, right: 8, background: copied ? "#fff" : "transparent", color: copied ? "#000" : "#fff", border: copied ? "none" : "1px solid rgba(255, 255, 255, 0.2)", borderRadius: 8, width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                                        {copied ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>}
                                                    </button>
                                                    <div style={{ color: "#ccc", fontSize: "0.8rem", lineHeight: 1.6, maxHeight: "160px", overflowY: "auto", paddingRight: 24, whiteSpace: "pre-wrap" }}>
                                                        {exportText || activeCampaign.lastExport}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* BENTO: Completion Phase */}
                                        {!activeCampaign.isCompleted && (
                                            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "20px", padding: "24px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showForm ? 16 : 0 }}>
                                                    <h4 style={{ margin: "0", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Post-Delivery</h4>
                                                    <button onClick={() => setShowForm(!showForm)} title="Finalize Stats" style={{ background: showForm ? "#fff" : "#222", color: showForm ? "#000" : "#fff", border: "1px solid #333", borderRadius: "10px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}>
                                                        {showForm ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                    </button>
                                                </div>
                                                {showForm && (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                                        <input className="premium-input" style={{ padding: "10px", fontSize: "0.85rem", background: "#050505", border: "1px solid #333" }} placeholder="Total Uploaded Clips" value={clips} onChange={e => setClips(e.target.value)} />
                                                        <input className="premium-input" style={{ padding: "10px", fontSize: "0.85rem", background: "#050505", border: "1px solid #333" }} placeholder="Total Views" value={views} onChange={e => setViews(e.target.value)} />
                                                        <input className="premium-input" style={{ padding: "10px", fontSize: "0.85rem", background: "#050505", border: "1px solid #333" }} placeholder="Amount Earned ($)" value={earned} onChange={e => setEarned(e.target.value)} />
                                                        <button onClick={async () => {
                                                            const updated = await completeCampaign(activeCampaign.id, parseInt(clips || "0"), parseFloat(earned || "0"), views || "0");
                                                            setCampaigns(prev => prev.map(c => c.id === updated.id ? { ...c, isCompleted: true, clips: parseInt(clips || "0"), earned: parseFloat(earned || "0"), views: views || "0" } : c));
                                                            setShowForm(false);
                                                        }} style={{ background: "#fff", color: "#000", border: "none", borderRadius: "8px", padding: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                                            FINALIZE <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    </div>
                                </div>

                                {/* FULL WIDTH: Completed Stats Visualization */}
                                {activeCampaign.isCompleted && (
                                    <div style={{ padding: "0 clamp(16px, 4vw, 32px) clamp(16px, 4vw, 32px)", animation: "fadeIn 0.4s ease-out" }}>
                                        <div className="detail-stats-grid">

                                            {/* Earnings Card (Black UI) */}
                                            <div style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "24px 24px", backgroundColor: "#080808", borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid #1f1f1f", position: "relative", overflow: "hidden" }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ opacity: 0.8 }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                <div style={{ position: "relative", zIndex: 2 }}>
                                                    <div style={{ color: "#fff", fontSize: "clamp(3rem, 5vw, 4.5rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>${activeCampaign.earned || "0"}</div>
                                                    <div style={{ fontSize: "0.9rem", color: "#aaa", marginTop: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>Total Earnings Paid. <span style={{ color: "#fff" }}>*</span></div>
                                                </div>
                                                <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)", pointerEvents: "none" }}></div>
                                            </div>

                                            {/* Clips Card (White UI) */}
                                            <div style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)", backgroundSize: "24px 24px", backgroundColor: "#f9f9f9", borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid #e1e1e1", boxShadow: "inset 0 2px 10px rgba(255,255,255,0.5)" }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" style={{ opacity: 0.8 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                                <div>
                                                    <div style={{ color: "#000", fontSize: "3.5rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{activeCampaign.clips || "0"}</div>
                                                    <div style={{ fontSize: "0.8rem", color: "#444", marginTop: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>Uploaded Clips.</div>
                                                </div>
                                            </div>

                                            {/* Views Card (White UI) */}
                                            <div style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)", backgroundSize: "24px 24px", backgroundColor: "#f9f9f9", borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid #e1e1e1", boxShadow: "inset 0 2px 10px rgba(255,255,255,0.5)" }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" style={{ opacity: 0.8 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                <div>
                                                    <div style={{ color: "#000", fontSize: "3.5rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{activeCampaign.views || "0"}</div>
                                                    <div style={{ fontSize: "0.8rem", color: "#444", marginTop: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>Total Audience Views.</div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Creation Stepper */}
                    {isCreating && (
                        <div className="inline-stepper-container">
                            <div className="stepper-progress-container">
                                {[{ id: 1, label: "Identity" }, { id: 2, label: "Details" }, { id: 3, label: "Targeting" }, { id: 4, label: "Guidelines" }].map(s => (
                                    <div key={s.id} className={`stepper-step ${step === s.id ? 'active' : step > s.id ? 'completed' : ''}`}>
                                        <div className="stepper-bar" /><span className="stepper-label">{s.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="inline-stepper-body">
                                {step === 1 && (
                                    <div className="step-fade-in">
                                        <div className="step-header-text"><h3 className="step-title">Identity</h3></div>
                                        <div className="form-group">
                                            <label>Select Identity</label>
                                            <div style={{ position: "relative" }}>
                                                <select className="premium-input" value={cIdentityId} onChange={e => {
                                                    setCIdentityId(e.target.value);
                                                    if (e.target.value === "NEW") setShowCreateIdentity(true);
                                                    else setShowCreateIdentity(false);
                                                }} style={{ appearance: "none", width: "100%", paddingRight: "40px" }}>
                                                    <option value="">— Select Identity —</option>
                                                    {identities.map(id => <option key={id.id} value={id.id}>{id.name}</option>)}
                                                    <option value="NEW">+ Create New Identity</option>
                                                </select>
                                                {cIdentityId !== "NEW" && cIdentityId !== "" && (
                                                    <button type="button" onClick={async () => {
                                                        if (confirm("Delete this identity?")) {
                                                            await deleteIdentity(cIdentityId);
                                                            setIdentities(prev => prev.filter(i => i.id !== cIdentityId));
                                                            setCIdentityId("");
                                                        }
                                                    }} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", padding: 0 }} onMouseOver={e => { e.currentTarget.style.color = "#ff4444"; }} onMouseOut={e => { e.currentTarget.style.color = "#fff"; }} title="Delete Selected Identity">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {showCreateIdentity && (
                                            <div className="form-group" style={{ marginTop: 10, background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                                                <label style={{ fontSize: "0.75rem", marginBottom: 6, display: "block" }}>New Creator Identity Name</label>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <input className="premium-input" placeholder="Enter name..." value={newIdentityName} onChange={e => setNewIdentityName(e.target.value)} />
                                                    <button type="button" className="btn-ui neutral" style={{ whiteSpace: "nowrap", padding: "0 16px" }} onClick={async () => {
                                                        if (!newIdentityName || newIdentityName.trim() === "") return;
                                                        const newId = await createIdentity(newIdentityName.trim());
                                                        setIdentities(prev => [...prev.filter(i => i.id !== newId.id), newId]);
                                                        setCIdentityId(newId.id);
                                                        setNewIdentityName("");
                                                        setShowCreateIdentity(false);
                                                    }}>Save</button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="form-group" style={{ marginTop: 20 }}><label>Campaign Name</label><input className="premium-input" value={cName} onChange={e => setCName(e.target.value)} /></div>
                                        <div className="form-group"><label>RPM</label><input className="premium-input" value={cRpm} onChange={e => setCRpm(e.target.value)} /></div>
                                    </div>
                                )}
                                {step === 2 && (
                                    <div className="step-fade-in">
                                        <div className="step-header-text"><h3 className="step-title">Details</h3></div>
                                        <div className="form-group">
                                            <label>Platform (select multiple)</label>
                                            <div className="platform-grid">
                                                {[
                                                    { id: "instagram", name: "Instagram", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg> },
                                                    { id: "youtube", name: "YouTube", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg> },
                                                    { id: "tiktok", name: "TikTok", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a3 3 0 0 1-3-3" /></svg> }
                                                ].map(p => (
                                                    <button key={p.id} type="button" className={`platform-card ${cPlatform.includes(p.name) ? 'selected' : ''}`} onClick={() => setCPlatform(prev => prev.includes(p.name) ? prev.filter(x => x !== p.name) : [...prev, p.name])}>
                                                        {p.icon}<span>{p.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="form-group"><label>Sound</label><input className="premium-input" value={cSound} onChange={e => setCSound(e.target.value)} /></div>
                                    </div>
                                )}
                                {step === 3 && (
                                    <div className="step-fade-in">
                                        <div className="step-header-text"><h3 className="step-title">Targeting</h3></div>
                                        <div className="form-group"><label>Niche</label><input className="premium-input" value={cNiche} onChange={e => setCNiche(e.target.value)} /></div>
                                    </div>
                                )}
                                {step === 4 && (
                                    <div className="step-fade-in">
                                        <div className="step-header-text"><h3 className="step-title">Guidelines</h3></div>
                                        <div className="custom-fields-wrapper">
                                            {customFields.map(field => (
                                                <div key={field.id} className="custom-field-row">
                                                    <div className="form-group custom-field-input-group"><input className="premium-input custom-label-input" placeholder="Label Name" value={field.label} onChange={e => updateCustomField(field.id, 'label', e.target.value)} /></div>
                                                    <div className="form-group custom-field-input-group flex-1"><input className="premium-input" value={field.value} onChange={e => updateCustomField(field.id, 'value', e.target.value)} /></div>
                                                    <button className="remove-field-btn" onClick={() => removeCustomField(field.id)}>&times;</button>
                                                </div>
                                            ))}
                                            <button className="add-field-btn" onClick={addCustomField}>+ Add Input Label</button>
                                        </div>
                                        <div className="form-group" style={{ marginTop: "24px" }}>
                                            <label>Rules</label>
                                            <textarea className="premium-input" rows={5} value={cRules} onChange={e => setCRules(e.target.value)} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="inline-stepper-footer">
                                <button className="btn-stepper back" onClick={step === 1 ? handleCancel : handleBack}>{step === 1 ? "Cancel" : "Back"}</button>
                                <button className="btn-stepper next" onClick={handleNext}>{step < totalSteps ? "Next" : "Finish"}</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </AppShell>
    );
}
