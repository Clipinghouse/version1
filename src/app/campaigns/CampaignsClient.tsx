"use client";

import { useState, useEffect, useMemo } from "react";
import AppShell from "../components/AppShell";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createCampaign, completeCampaign, linkContextToCampaign, unlinkContextFromCampaign, getContextItemsForPicker, deleteCampaign, getContextCategories, createContextCategory, createContextItem } from "../actions";

const AVATARS = ["A", "B", "C", "D"];

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
    views: number | null;
    lastExport: string | null;
    contexts: ContextItem[];
}
interface PickerItem { id: string; name: string; categoryId: string; }

function CampaignCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
    return (
        <div className={`dc-card ${campaign.isCompleted ? 'dc-completed' : ''}`} onClick={onClick}>
            {campaign.isCompleted ? (
                <div className="dc-love" style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, color: "rgba(255,255,255,0.5)", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "2px 8px", zIndex: 10, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>COMPLETED</div>
            ) : (
                <div className="dc-live-emoji" style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 900, color: "#000", background: "#00ff00", border: "none", borderRadius: "12px", padding: "2px 8px", zIndex: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 10px rgba(0, 255, 0, 0.4)" }}>ACTIVE</div>
            )}
            <div className="dc-banner"><h2 className="dc-campaign-name">{campaign.name}</h2></div>
            <div className="dc-body">
                <div className="dc-rpm-line">${campaign.rpm} <span>RPM</span></div>
                <div className="dc-chips">
                    <span className="dc-chip">{campaign.platform || "Platform"}</span>
                    {campaign.niche && <span className="dc-chip">{campaign.niche}</span>}
                </div>
                <p className="dc-snippet">{campaign.rules ? (campaign.rules.length > 80 ? campaign.rules.substring(0, 80) + "..." : campaign.rules) : "No rules specified."}</p>
            </div>
        </div>
    );
}

export default function CampaignsClient({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
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
    const [fStatus, setFStatus] = useState<"all" | "active" | "completed">("all");

    // Completion form state
    const [showForm, setShowForm] = useState(false);
    const [clips, setClips] = useState("");
    const [earned, setEarned] = useState("");
    const [views, setViews] = useState("");

    // Campaign creation form state
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

    // Filtered campaigns
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter(c => {
            if (fName && !c.name.toLowerCase().includes(fName.toLowerCase())) return false;
            if (fPlatform && !(c.platform || "").toLowerCase().includes(fPlatform.toLowerCase())) return false;
            if (fNiche && !(c.niche || "").toLowerCase().includes(fNiche.toLowerCase())) return false;
            if (fStatus === "active" && c.isCompleted) return false;
            if (fStatus === "completed" && !c.isCompleted) return false;
            return true;
        });
    }, [campaigns, fName, fPlatform, fNiche, fStatus]);

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
            });
            setCampaigns(prev => [newCampaign as Campaign, ...prev]);
            setIsCreating(false); setStep(1);
            setCName(""); setCRpm(""); setCPlatform([]); setCSound(""); setCNiche(""); setCRules(""); setCustomFields([]);
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
                                {AVATARS.map((initial, idx) => (
                                    <div key={initial} className="initial-avatar" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <img src={`https://api.dicebear.com/9.x/glass/svg?seed=${initial}`} alt={`Avatar ${idx}`} width={52} height={52} style={{ objectFit: "cover" }} />
                                    </div>
                                ))}
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
                                    <input className="premium-input" style={{ padding: "8px 12px", fontSize: "0.85rem" }} placeholder="Search by name…" value={fName} onChange={e => setFName(e.target.value)} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 130, flex: 1 }}>
                                    <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Platform</label>
                                    <input className="premium-input" style={{ padding: "8px 12px", fontSize: "0.85rem" }} placeholder="e.g. TikTok…" value={fPlatform} onChange={e => setFPlatform(e.target.value)} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 130, flex: 1 }}>
                                    <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Niche</label>
                                    <input className="premium-input" style={{ padding: "8px 12px", fontSize: "0.85rem" }} placeholder="e.g. E-commerce…" value={fNiche} onChange={e => setFNiche(e.target.value)} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</label>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        {(["all", "active", "completed"] as const).map(s => (
                                            <button key={s} onClick={() => setFStatus(s)} style={{ padding: "8px 16px", borderRadius: 20, fontSize: "0.82rem", fontFamily: "var(--font-sans)", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.2s", background: fStatus === s ? "#ffffff" : "transparent", color: fStatus === s ? "#000" : "rgba(255,255,255,0.5)", borderColor: fStatus === s ? "#ffffff" : "rgba(255,255,255,0.15)" }}>
                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Clear filters footer */}
                            {(fName || fPlatform || fNiche || fStatus !== "all") && (
                                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "center", width: "100%" }}>
                                    <button
                                        onClick={() => { setFName(""); setFPlatform(""); setFNiche(""); setFStatus("all"); }}
                                        style={{ background: "#ffffff", border: "1px solid #ffffff", borderRadius: 4, padding: "8px 24px", color: "#000000", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center", maxWidth: "300px" }}
                                    >
                                        CLEAR ALL FILTERS
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <hr className="campaign-divider" />

                    {/* Campaign Grid */}
                    {!isCreating && !activeCampaignId && (
                        <div style={{ padding: "32px 0 0 0", display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "24px" }}>
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

                    {/* Detail View */}
                    {!isCreating && activeCampaign && (
                        <div className="campaign-detail-view" style={{ maxWidth: 680 }}>
                            {/* Top nav: Back + Delete */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "20px" }}>
                                <button className="btn-back-link" onClick={() => { setActiveCampaignId(null); setShowForm(false); setShowPicker(false); setExportText(null); setExportError(null); setDeleteConfirm(false); }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                    Back to Campaigns
                                </button>
                                {!deleteConfirm ? (
                                    <button
                                        onClick={() => setDeleteConfirm(true)}
                                        style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 4, padding: "8px 20px", color: "#ffffff", fontFamily: "var(--font-sans)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                                    >
                                        DELETE CAMPAIGN
                                    </button>
                                ) : (
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <button onClick={handleDelete} style={{ background: "#ffffff", border: "1px solid #ffffff", borderRadius: 4, padding: "8px 20px", color: "#000000", fontFamily: "var(--font-sans)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, cursor: "pointer" }}>YES, DELETE</button>
                                        <button onClick={() => setDeleteConfirm(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 4, padding: "8px 16px", color: "#ffffff", fontFamily: "var(--font-sans)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", fontWeight: 700 }}>CANCEL</button>
                                    </div>
                                )}
                            </div>

                            <div className="detail-card">
                                <div className="detail-banner">
                                    <h2 className="detail-title">{activeCampaign.name}</h2>
                                    <div className="detail-subtitle-stats">
                                        <span className="detail-stat-badge highlight">RPM: ${activeCampaign.rpm}</span>
                                        {activeCampaign.platform && <span className="detail-stat-badge">{activeCampaign.platform}</span>}
                                        {activeCampaign.niche && <span className="detail-stat-badge">{activeCampaign.niche}</span>}
                                        {activeCampaign.sound && <span className="detail-stat-badge">{activeCampaign.sound}</span>}
                                    </div>
                                </div>

                                <div className="detail-body">
                                    {/* Rules */}
                                    <div className="detail-paper-rules">
                                        <p className="detail-paper-text">{activeCampaign.rules || "No rules given."}</p>
                                        {(activeCampaign.customFields as any[])?.map((cf: any, idx: number) => (
                                            <p className="detail-paper-text" key={idx}><strong>{cf.label}:</strong> {cf.value}</p>
                                        ))}
                                    </div>

                                    {/* Linked Context */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>Linked Context</span>
                                            <button onClick={openPicker} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 14px", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "0.78rem", cursor: "pointer", transition: "all 0.2s" }}>+ Link Context</button>
                                        </div>

                                        {/* Context Item Picker */}
                                        {showPicker && (
                                            <div style={{ marginBottom: 16, padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, animation: "fadeIn 0.2s ease" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>{showCreateContext ? "Create & Link Context" : "Select context items to link:"}</span>
                                                    <button onClick={() => setShowPicker(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                                                </div>

                                                {!showCreateContext ? (
                                                    <>
                                                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                                            <input
                                                                className="premium-input"
                                                                style={{ padding: "8px 12px", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }}
                                                                placeholder="Search context items…"
                                                                value={pickerSearch}
                                                                onChange={e => setPickerSearch(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => setShowCreateContext(true)}
                                                                style={{ background: "#ffffff", color: "#000", border: "none", borderRadius: 4, padding: "0 18px", fontSize: "0.75rem", fontFamily: "var(--font-sans)", fontWeight: 700, textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap" }}
                                                            >
                                                                + NEW
                                                            </button>
                                                        </div>
                                                        <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                                                            {filteredPickerItems.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", textAlign: "center", margin: "16px 0" }}>No context items found.</p>}
                                                            {filteredPickerItems.map(item => {
                                                                const alreadyLinked = activeCampaign.contexts.some(c => c.id === item.id);
                                                                return (
                                                                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, background: alreadyLinked ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${alreadyLinked ? "rgba(255,215,0,0.25)" : "rgba(255,255,255,0.07)"}` }}>
                                                                        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.88rem", color: alreadyLinked ? "#ffd700" : "#e0e0e0" }}>{item.name}</span>
                                                                        <button
                                                                            disabled={linkingLoading === item.id}
                                                                            onClick={() => alreadyLinked ? handleUnlink(item.id) : handleLink(item.id)}
                                                                            style={{ background: alreadyLinked ? "transparent" : "#ffffff", color: alreadyLinked ? "rgba(255,255,255,0.5)" : "#000", border: alreadyLinked ? "1px solid rgba(255,255,255,0.15)" : "none", borderRadius: 16, padding: "4px 14px", fontSize: "0.78rem", fontFamily: "var(--font-sans)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", opacity: linkingLoading === item.id ? 0.5 : 1 }}
                                                                        >
                                                                            {linkingLoading === item.id ? "…" : alreadyLinked ? "Unlink" : "Link"}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "10px 0" }}>
                                                        <select
                                                            className="premium-input"
                                                            value={selectedCategoryId}
                                                            onChange={e => setSelectedCategoryId(e.target.value)}
                                                            style={{ padding: "10px 14px", fontSize: "0.85rem", appearance: "none" }}
                                                        >
                                                            <option value="PASS">DEFAULT (NO CATEGORY)</option>
                                                            <option value="NEW">+ CREATE NEW CATEGORY</option>
                                                            {categories.map(c => (
                                                                <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                                                            ))}
                                                        </select>
                                                        {selectedCategoryId === "NEW" && (
                                                            <input
                                                                className="premium-input"
                                                                placeholder="New Category Name..."
                                                                value={newCategoryName}
                                                                onChange={e => setNewCategoryName(e.target.value)}
                                                            />
                                                        )}
                                                        <input
                                                            className="premium-input"
                                                            placeholder="Context name / label..."
                                                            value={newContextName}
                                                            onChange={e => setNewContextName(e.target.value)}
                                                        />
                                                        <input
                                                            className="premium-input"
                                                            placeholder="Context note or instruction..."
                                                            value={newContextText}
                                                            onChange={e => setNewContextText(e.target.value)}
                                                            onKeyDown={e => e.key === "Enter" && handleCreateAndLinkContext()}
                                                        />
                                                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                                                            <button className="btn-stepper back" style={{ padding: "0 16px", borderRadius: 4, height: 38 }} onClick={() => setShowCreateContext(false)}>✕ CANCEL</button>
                                                            <button
                                                                className="btn-stepper next"
                                                                style={{ padding: "0 22px", borderRadius: 4, height: 38, opacity: (!newContextName || !newContextText || !selectedCategoryId || (selectedCategoryId === "NEW" && !newCategoryName)) ? 0.5 : 1 }}
                                                                disabled={creatingContext || !newContextName || !newContextText || !selectedCategoryId || (selectedCategoryId === "NEW" && !newCategoryName)}
                                                                onClick={handleCreateAndLinkContext}
                                                            >
                                                                {creatingContext ? "CREATING..." : "ADD CONTEXT"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Linked items list */}
                                        {activeCampaign.contexts.length === 0 ? (
                                            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.85rem", fontStyle: "italic", fontFamily: "var(--font-sans)" }}>No context linked yet.</p>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                {activeCampaign.contexts.map(ctx => (
                                                    <div key={ctx.id} style={{ padding: "12px 16px", background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 12 }}>
                                                        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#ffd700", fontWeight: 700, marginBottom: 4 }}>{ctx.name}</div>
                                                        <div style={{ color: "#ccc", fontSize: "0.9rem", lineHeight: 1.5 }}>{ctx.text}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Export Section */}
                                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, marginBottom: 24 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>AI Creative Brief</span>
                                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                <button
                                                    onClick={handleExport}
                                                    disabled={exportLoading}
                                                    style={{ background: "#ffffff", color: "#000000", border: "1px solid #ffffff", borderRadius: 4, padding: "8px 20px", fontFamily: "var(--font-sans)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem", cursor: exportLoading ? "not-allowed" : "pointer", opacity: exportLoading ? 0.7 : 1, transition: "all 0.2s" }}
                                                >
                                                    {exportLoading ? "GENERATING..." : "EXPORT PROMPT"}
                                                </button>
                                            </div>
                                        </div>

                                        {exportError && (
                                            <div style={{ padding: 14, background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.2)", borderRadius: 12, marginBottom: 12 }}>
                                                <p style={{ color: "#ff6b6b", fontFamily: "var(--font-sans)", fontSize: "0.88rem", margin: 0 }}>⚠ {exportError}</p>
                                                <button onClick={handleExport} style={{ marginTop: 8, background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: "4px 14px", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "0.78rem", cursor: "pointer" }}>Try Again</button>
                                            </div>
                                        )}

                                        {(exportText || activeCampaign.lastExport) && !exportError && (
                                            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20, position: "relative", animation: "fadeIn 0.3s ease" }}>
                                                <button onClick={handleCopy} style={{ position: "absolute", top: 14, right: 14, background: copied ? "#ffd700" : "rgba(255,255,255,0.1)", color: copied ? "#000" : "#fff", border: "none", borderRadius: 16, padding: "4px 14px", fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                                                    {copied ? "✓ Copied!" : "Copy"}
                                                </button>
                                                <p style={{ color: "#ddd", fontFamily: "var(--font-sans)", fontSize: "0.9rem", lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0, paddingRight: 60 }}>
                                                    {exportText || activeCampaign.lastExport}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Completion Zone */}
                                    <div className="dc-completion-zone" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px" }}>
                                        {!activeCampaign.isCompleted ? (
                                            <>
                                                <label className="dc-checkbox-row">
                                                    <input type="checkbox" checked={showForm} onChange={e => setShowForm(e.target.checked)} />
                                                    Completed the campaign?
                                                </label>
                                                {showForm && (
                                                    <div className="dc-completion-form">
                                                        <input className="dc-stat-input" placeholder="Total Clips Uploaded" value={clips} onChange={e => setClips(e.target.value)} />
                                                        <input className="dc-stat-input" placeholder="Money Earned ($)" value={earned} onChange={e => setEarned(e.target.value)} />
                                                        <input className="dc-stat-input" placeholder="Total Views" value={views} onChange={e => setViews(e.target.value)} />
                                                        <button className="dc-submit-btn" onClick={async () => {
                                                            const updated = await completeCampaign(activeCampaign.id, parseInt(clips || "0"), parseFloat(earned || "0"), parseInt(views || "0"));
                                                            setCampaigns(prev => prev.map(c => c.id === updated.id ? { ...c, isCompleted: true, clips: parseInt(clips || "0"), earned: parseFloat(earned || "0"), views: parseInt(views || "0") } : c));
                                                            setShowForm(false);
                                                        }}>Submit</button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="dc-final-stats">
                                                <div className="dc-final-stat-row"><span>Clips Uploaded</span><span>{activeCampaign.clips || "—"}</span></div>
                                                <div className="dc-final-stat-row"><span>Total Views</span><span>{activeCampaign.views || "—"}</span></div>
                                                <div className="dc-final-stat-row"><span>Earnings</span><span>${activeCampaign.earned || "0.00"}</span></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                        <div className="form-group"><label>Name</label><input className="premium-input" value={cName} onChange={e => setCName(e.target.value)} /></div>
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
