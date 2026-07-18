"use client";
import { useState, useEffect } from "react";
import AppShell from "../components/AppShell";
import { useSearchParams, useRouter, usePathname } from "next/navigation";



import { createContextCategory, createContextItem, deleteContextCategory, deleteContextItem, createIdentity, deleteIdentity } from "../actions";

interface ContextItem { id: string; name: string; text: string; categoryId: string; }
interface Category { id: string; name: string; description: string | null; items: ContextItem[]; identityId?: string | null; identity?: { id: string; name: string } | null; }

export default function ContextClient({ initialCategories, identities }: { initialCategories: Category[]; identities: { id: string; name: string }[] }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [isCreating, setIsCreating] = useState(false);
    const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null);

    useEffect(() => {
        if (searchParams.get("create") === "true") {
            setIsCreating(true);
            router.replace(pathname);
        }
    }, [searchParams, router, pathname]);
    const [catName, setCatName] = useState("");
    const [catDesc, setCatDesc] = useState("");
    const [catIdentityId, setCatIdentityId] = useState<string>("");
    const [newCreatorName, setNewCreatorName] = useState("");
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [descExpanded, setDescExpanded] = useState<Record<string, boolean>>({});
    const [addingContextId, setAddingContextId] = useState<string | null>(null);
    const [newContextName, setNewContextName] = useState("");
    const [newContextText, setNewContextText] = useState("");
    const [search, setSearch] = useState("");
    const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

    const toggleDescExpand = (id: string) =>
        setDescExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const handleNext = async () => {
        if (!catName.trim()) return;

        let finalIdentityId = catIdentityId;
        let createdIdentity: any = null;

        if (catIdentityId === "NEW" && newCreatorName.trim()) {
            createdIdentity = await createIdentity(newCreatorName.trim());
            finalIdentityId = createdIdentity.id;
        }

        const newCat = await createContextCategory(catName, catDesc, finalIdentityId || undefined);
        const matchingId = createdIdentity || identities.find(i => i.id === finalIdentityId);
        setCategories(prev => [...prev, { ...newCat, description: newCat.description ?? null, items: [], identityId: finalIdentityId || null, identity: matchingId || null }]);

        setCatName(""); setCatDesc(""); setCatIdentityId(""); setNewCreatorName(""); setIsCreating(false);
    };

    const handleAddContext = async (catId: string) => {
        if (!newContextText.trim()) return;
        const newItem = await createContextItem(catId, newContextName || "Untitled", newContextText);
        setCategories(prev => prev.map(c =>
            c.id === catId
                ? { ...c, items: [...c.items, newItem] }
                : c
        ));
        setNewContextName("");
        setNewContextText("");
        setAddingContextId(null);
    };

    const handleDeleteCategory = async (catId: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;
        if (selectedCatId === catId) setSelectedCatId(null);
        await deleteContextCategory(catId);
        setCategories(prev => prev.filter(c => c.id !== catId));
    };

    const handleDeleteContext = async (catId: string, ctxId: string) => {
        if (!confirm("Are you sure you want to delete this context?")) return;
        await deleteContextItem(ctxId);
        setCategories(prev => prev.map(c =>
            c.id === catId
                ? { ...c, items: c.items.filter(i => i.id !== ctxId) }
                : c
        ));
    };

    const filteredCategories = categories.filter(cat =>
        !search ||
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        cat.items.some(item => item.name.toLowerCase().includes(search.toLowerCase()) || item.text.toLowerCase().includes(search.toLowerCase()))
    );

    const activeIdentities = identities.filter(identity =>
        categories.some(c => c.identityId === identity.id || c.identity?.id === identity.id)
    ).slice(0, 5);

    return (
        <AppShell>
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="campaign-dashboard">

                    {/* Header */}
                    <div className="campaign-header">
                        <div className="campaign-header-left">
                            <div className="avatar-group">
                                {activeIdentities.length === 0 && (
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", fontStyle: "italic", marginLeft: 8 }}>No assigned creators</div>
                                )}
                                {activeIdentities.map((identity) => (
                                    <div key={identity.id} style={{ position: "relative" }} onMouseEnter={() => setHoveredAvatar(identity.id)} onMouseLeave={() => setHoveredAvatar(null)}>
                                        <img
                                            src={`https://api.dicebear.com/9.x/glass/svg?seed=${identity.name}`}
                                            alt={identity.name}
                                            className="initial-avatar"
                                            style={{ border: hoveredAvatar === identity.id ? "2px solid rgba(255,255,255,0.8)" : "" }}
                                        />
                                        <div style={{
                                            position: "absolute", top: "-42px", left: "50%", transform: `translateX(-50%) ${hoveredAvatar === identity.id ? "translateY(0) scale(1)" : "translateY(8px) scale(0.95)"}`, opacity: hoveredAvatar === identity.id ? 1 : 0, pointerEvents: "none", background: "linear-gradient(135deg, rgba(80,80,90,0.98), rgba(40,40,45,0.98))", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", padding: "6px 14px", borderRadius: "12px", color: "#fff", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", zIndex: 100
                                        }}>
                                            {identity.name}
                                            <div style={{ position: "absolute", bottom: "-4px", left: "50%", transform: "translateX(-50%) rotate(45deg)", width: "8px", height: "8px", background: "rgba(40,40,45,0.98)", borderBottom: "1px solid rgba(255,255,255,0.15)", borderRight: "1px solid rgba(255,255,255,0.15)" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="campaign-header-right">
                            {/* Search bar replaces the old filter icon */}
                            <div style={{ position: "relative" }}>
                                <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search context…"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24, padding: "10px 16px 10px 38px", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "0.88rem", outline: "none", width: 200, transition: "border-color 0.2s" }}
                                />
                            </div>
                            <button className="campaign-add-btn" onClick={() => setIsCreating(true)}>+ Add Category</button>
                        </div>
                    </div>

                    {/* Inline category creator */}
                    {isCreating && (
                        <div className="inline-stepper-container" style={{ marginTop: 24 }}>
                            <div className="inline-stepper-body">
                                <div className="step-fade-in">
                                    <div className="step-header-text">
                                        <h3 className="step-title">New Category</h3>
                                    </div>
                                    <div className="form-group">
                                        <label>Category Label</label>
                                        <input
                                            className="premium-input"
                                            placeholder="e.g. Hooks, Calls to Action"
                                            value={catName}
                                            onChange={e => setCatName(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Attributed Creator Identity (Optional)</label>
                                        <div style={{ position: "relative" }}>
                                            <select
                                                className="premium-input"
                                                style={{ appearance: "none", width: "100%", paddingRight: "40px" }}
                                                value={catIdentityId}
                                                onChange={e => setCatIdentityId(e.target.value)}
                                            >
                                                <option value="">None / Global</option>
                                                {identities.map((id) => (
                                                    <option key={id.id} value={id.id}>{id.name}</option>
                                                ))}
                                                <option value="NEW">+ Add New Creator...</option>
                                            </select>
                                            {catIdentityId !== "NEW" && catIdentityId !== "" && (
                                                <button type="button" onClick={async () => {
                                                    if (confirm("Delete this identity?")) {
                                                        await deleteIdentity(catIdentityId);
                                                        setCatIdentityId("");
                                                        router.refresh();
                                                    }
                                                }} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", padding: 0 }} onMouseOver={e => { e.currentTarget.style.color = "#ff4444"; }} onMouseOut={e => { e.currentTarget.style.color = "#fff"; }} title="Delete Selected Identity">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            )}
                                        </div>
                                        {catIdentityId === "NEW" && (
                                            <input
                                                className="premium-input"
                                                style={{ marginTop: 8 }}
                                                placeholder="e.g. John Doe"
                                                value={newCreatorName}
                                                onChange={e => setNewCreatorName(e.target.value)}
                                            />
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Description (Optional)</label>
                                        <textarea
                                            className="premium-input"
                                            placeholder="What kind of contexts belong here..."
                                            style={{ minHeight: 80, resize: "none" }}
                                            value={catDesc}
                                            onChange={e => setCatDesc(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <button className="btn-stepper back" onClick={() => setIsCreating(false)}>Cancel</button>
                                <button className="btn-stepper next" onClick={handleNext} disabled={!catName.trim()} style={{ opacity: !catName.trim() ? 0.5 : 1 }}>Save Category</button>
                            </div>
                        </div>
                    )}

                    {/* Category Grid with Inline Expansion */}
                    <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
                        {filteredCategories.map(cat => {
                            const isExpanded = selectedCatId === cat.id;

                            return (
                                <div key={cat.id} onClick={() => !isExpanded && setSelectedCatId(cat.id)} style={{
                                    gridColumn: isExpanded ? "1 / -1" : "auto",
                                    backgroundImage: isExpanded ? "none" : "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                                    backgroundSize: isExpanded ? "auto" : "24px 24px",
                                    backgroundColor: isExpanded ? "#080808" : "#0a0a0a",
                                    border: isExpanded ? "1px solid #333" : "1px solid #1f1f1f",
                                    borderRadius: "20px",
                                    padding: "32px",
                                    cursor: isExpanded ? "default" : "pointer",
                                    transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                                    display: "flex", flexDirection: "column",
                                    position: "relative",
                                    overflow: "hidden",
                                    boxShadow: isExpanded ? "inset 0 2px 20px rgba(255,255,255,0.02), 0 20px 60px rgba(0,0,0,0.6)" : "none"
                                }} onMouseOver={e => { if (!isExpanded) { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)"; } }} onMouseOut={e => { if (!isExpanded) { e.currentTarget.style.borderColor = "#1f1f1f"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; } }}>

                                    {/* Unexpanded background aesthetic */}
                                    {!isExpanded && (
                                        <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }}></div>
                                    )}

                                    {/* Header Section */}
                                    <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontFamily: "var(--font-anton)", fontSize: isExpanded ? "2.5rem" : "1.8rem", color: "#fff", margin: 0, textTransform: "uppercase", letterSpacing: "0.02em", transition: "font-size 0.3s" }}>{cat.name}</h3>
                                            {cat.description && <p style={{ color: "#777", fontSize: "0.85rem", marginTop: "12px", fontFamily: "var(--font-sans)", lineHeight: 1.5, maxWidth: "600px" }}>{cat.description}</p>}
                                        </div>

                                        {/* Actions */}
                                        {isExpanded ? (
                                            <div style={{ display: "flex", gap: "12px" }}>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} style={{ background: "transparent", border: "1px solid rgba(255,100,100,0.2)", borderRadius: "10px", width: "36px", height: "36px", color: "#ff6b6b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,100,100,0.1)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedCatId(null); }} style={{ background: "#222", border: "none", borderRadius: "10px", width: "36px", height: "36px", color: "#fff", cursor: "pointer", transition: "0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#333"} onMouseOut={e => e.currentTarget.style.background = "#222"}>✕</button>
                                            </div>
                                        ) : (
                                            <div style={{ background: "#222", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                            </div>
                                        )}
                                    </div>

                                    {!isExpanded && (
                                        <div style={{ position: "relative", zIndex: 1, marginTop: "auto", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                                            {/* Left side: Avatar attribution */}
                                            {cat.identity ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <img src={`https://api.dicebear.com/9.x/glass/svg?seed=${cat.identity.name}`} alt={cat.identity.name} style={{ width: 28, height: 28, borderRadius: "50%", background: "#111", border: "1px solid #333" }} />
                                                    <span style={{ fontSize: "0.8rem", color: "#ccc", fontFamily: "var(--font-sans)", fontWeight: 600 }}>{cat.identity.name}</span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: "0.8rem", color: "#555", fontStyle: "italic", fontFamily: "var(--font-sans)" }}>Global</span>
                                            )}

                                            {/* Right side: Items count */}
                                            <span style={{ color: "#aaa", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{cat.items.length} Items</span>
                                        </div>
                                    )}

                                    {/* Expanded Clean Nested Grid Content */}
                                    {isExpanded && (
                                        <div style={{ marginTop: "32px", borderTop: "1px solid #1a1a1a", paddingTop: "32px", animation: "fadeIn 0.3s ease" }}>

                                            {/* Action Bar */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                                                <h4 style={{ margin: 0, color: "#888", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Context Data Library</h4>

                                                {!addingContextId && (
                                                    <button className="campaign-add-btn neutral" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 20px", borderRadius: "10px", background: "#fff", color: "#000", border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }} onClick={() => { setAddingContextId(cat.id); setNewContextText(""); }}>
                                                        + ADD CONTEXT
                                                    </button>
                                                )}
                                            </div>

                                            {/* Inline Add Action */}
                                            {addingContextId === cat.id && (
                                                <div style={{ marginBottom: 32, padding: 24, background: "rgba(255,255,255,0.02)", border: "1px solid #333", borderRadius: 16 }}>
                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
                                                        <input className="premium-input" style={{ background: "#050505", border: "1px solid #333" }} placeholder="Context Label (e.g. Rule 1)..." value={newContextName} onChange={e => setNewContextName(e.target.value)} autoFocus />
                                                        <input className="premium-input" style={{ background: "#050505", border: "1px solid #333" }} placeholder="Context data or prompt instruction..." value={newContextText} onChange={e => setNewContextText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddContext(cat.id)} />
                                                    </div>
                                                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
                                                        <button style={{ background: "transparent", color: "#888", padding: "8px 16px", border: "1px solid #333", borderRadius: "8px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600 }} onClick={() => setAddingContextId(null)}>CANCEL</button>
                                                        <button style={{ background: "#fff", color: "#000", padding: "8px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700 }} onClick={() => handleAddContext(cat.id)}>SAVE</button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Context Items Tiles */}
                                            {cat.items.length === 0 ? (
                                                <div style={{ textAlign: "center", padding: "40px 0", background: "rgba(255,255,255,0.01)", border: "1px dashed #222", borderRadius: 16 }}>
                                                    <p style={{ color: "#555", fontFamily: "var(--font-sans)", fontSize: "0.9rem", margin: 0 }}>This category has no context items yet.</p>
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                                    {cat.items.map((ctx) => (
                                                        <div key={ctx.id} style={{
                                                            background: "rgba(255,255,255,0.02)",
                                                            padding: "24px 32px",
                                                            borderRadius: "16px",
                                                            border: "1px solid rgba(255,255,255,0.06)",
                                                            position: "relative",
                                                            overflow: "hidden",
                                                            transition: "background 0.2s"
                                                        }}
                                                            onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                                            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>

                                                            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.1))" }}></div>

                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                                                <div style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, color: "#fff" }}>
                                                                    {ctx.name}
                                                                </div>
                                                                <button onClick={() => handleDeleteContext(cat.id, ctx.id)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0 }} title="Delete context item" onMouseOver={e => e.currentTarget.style.color = "#ff4444"} onMouseOut={e => e.currentTarget.style.color = "#555"}>
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                                </button>
                                                            </div>
                                                            <div style={{ fontSize: "1rem", lineHeight: 1.7, color: "#bbb", fontFamily: "var(--font-sans)", whiteSpace: "pre-wrap" }}>{ctx.text}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                </div>
            </main>
        </AppShell >
    );
}
