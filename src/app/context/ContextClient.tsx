"use client";
import { useState, useEffect } from "react";
import AppShell from "../components/AppShell";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const BUBBLES = [
    "linear-gradient(135deg, #a0ffe6 0%, #69f0c2 100%)",
    "linear-gradient(135deg, #69f0c2 0%, #3fe18f 100%)",
    "linear-gradient(135deg, #a6ff58 0%, #7aed48 100%)",
    "linear-gradient(135deg, #8ba8ff 0%, #587bff 100%)"
];

import { createContextCategory, createContextItem, deleteContextCategory, deleteContextItem } from "../actions";

interface ContextItem { id: string; name: string; text: string; categoryId: string; }
interface Category { id: string; name: string; description: string | null; items: ContextItem[]; }

export default function ContextClient({ initialCategories }: { initialCategories: Category[] }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (searchParams.get("create") === "true") {
            setIsCreating(true);
            router.replace(pathname);
        }
    }, [searchParams, router, pathname]);
    const [catName, setCatName] = useState("");
    const [catDesc, setCatDesc] = useState("");
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [descExpanded, setDescExpanded] = useState<Record<string, boolean>>({});
    const [addingContextId, setAddingContextId] = useState<string | null>(null);
    const [newContextName, setNewContextName] = useState("");
    const [newContextText, setNewContextText] = useState("");
    const [search, setSearch] = useState("");

    const toggleDescExpand = (id: string) =>
        setDescExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const handleNext = async () => {
        if (!catName.trim()) return;
        const newCat = await createContextCategory(catName, catDesc);
        setCategories(prev => [...prev, { ...newCat, description: newCat.description ?? null, items: [] }]);
        setCatName(""); setCatDesc(""); setIsCreating(false);
    };

    const handlePass = async () => {
        const newCat = await createContextCategory("no category context", "");
        setCategories(prev => [...prev, { ...newCat, description: newCat.description ?? null, items: [] }]);
        setCatName(""); setCatDesc(""); setIsCreating(false);
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

    return (
        <AppShell>
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="campaign-dashboard">

                    {/* Header */}
                    <div className="campaign-header">
                        <div className="campaign-header-left">
                            <div className="avatar-group">
                                {BUBBLES.map((grad, idx) => (
                                    <div key={idx} className="initial-avatar" style={{ background: grad }} />
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
                                <button className="btn-stepper back" onClick={handlePass}>I&apos;ll pass</button>
                                <button className="btn-stepper next" onClick={handleNext}>Next <span style={{ marginLeft: 6 }}>→</span></button>
                            </div>
                        </div>
                    )}

                    {/* Category list */}
                    <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 24 }}>
                        {filteredCategories.map(cat => (
                            <div key={cat.id} style={{
                                background: "linear-gradient(145deg, rgba(30,30,30,0.4), rgba(10,10,10,0.8))",
                                backdropFilter: "blur(16px)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 20,
                                padding: 24,
                                animation: "fadeIn 0.3s ease"
                            }}>
                                {/* Category header */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <h3 style={{ fontFamily: "var(--font-anton)", fontSize: "2rem", color: "#fff", margin: 0, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                                                {cat.name}
                                            </h3>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", padding: "4px", transition: "color 0.2s", display: "flex", alignItems: "center" }}
                                                onMouseEnter={e => e.currentTarget.style.color = "#ff6b6b"}
                                                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
                                                title="Delete Category"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        </div>
                                        {cat.description && (
                                            <div>
                                                <button
                                                    onClick={() => toggleDescExpand(cat.id)}
                                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 10px", color: "var(--text-secondary)", fontSize: "0.75rem", fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}
                                                >
                                                    Description {descExpanded[cat.id] ? "▲" : "▼"}
                                                </button>
                                                {descExpanded[cat.id] && (
                                                    <div style={{ marginTop: 10, padding: 14, background: "rgba(255,255,255,0.05)", borderLeft: "4px solid #ffffff", borderRadius: "0 8px 8px 8px", color: "#ddd", fontSize: "0.95rem", fontFamily: "var(--font-sans)", animation: "fadeIn 0.2s ease" }}>
                                                        {cat.description}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <button
                                            className="campaign-add-btn neutral"
                                            onClick={() => { setAddingContextId(cat.id); setNewContextText(""); }}
                                        >
                                            + Add Context
                                        </button>
                                    </div>
                                </div>

                                {/* Inline input for adding context */}
                                {addingContextId === cat.id && (
                                    <div style={{ marginBottom: 20, padding: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, animation: "fadeIn 0.2s ease", display: "flex", flexDirection: "column", gap: 12 }}>
                                        <input
                                            className="premium-input"
                                            placeholder="Context name / label..."
                                            value={newContextName}
                                            onChange={e => setNewContextName(e.target.value)}
                                            autoFocus
                                        />
                                        <input
                                            className="premium-input"
                                            placeholder="Context note or instruction..."
                                            value={newContextText}
                                            onChange={e => setNewContextText(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && handleAddContext(cat.id)}
                                        />
                                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                            <button className="btn-stepper back" style={{ padding: "0 16px", borderRadius: 10, height: 38 }} onClick={() => setAddingContextId(null)}>✕ Cancel</button>
                                            <button className="btn-stepper next" style={{ padding: "0 22px", borderRadius: 10, height: 38 }} onClick={() => handleAddContext(cat.id)}>Add Context</button>
                                        </div>
                                    </div>
                                )}

                                {/* Context items / empty state */}
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
                                    {cat.items.length === 0 ? (
                                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: 32, textAlign: "center" }}>
                                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", fontStyle: "italic", margin: 0 }}>No contexts added yet.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            {cat.items.map(ctx => (
                                                <div key={ctx.id} style={{ padding: "14px 18px", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", fontFamily: "var(--font-sans)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <div>
                                                        <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#ffd700", fontWeight: 700, marginBottom: 6 }}>{ctx.name}</div>
                                                        <div style={{ color: "#e0e0e0", fontSize: "0.95rem", lineHeight: 1.5 }}>{ctx.text}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteContext(cat.id, ctx.id)}
                                                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", padding: "4px", transition: "color 0.2s", display: "flex", alignItems: "center", alignSelf: "flex-start", marginTop: "-2px" }}
                                                        onMouseEnter={e => e.currentTarget.style.color = "#ff6b6b"}
                                                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
                                                        title="Delete Context"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </main>
        </AppShell >
    );
}
