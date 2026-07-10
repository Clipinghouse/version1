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

import { createStoredContent, updateStoredContent, deleteStoredContent } from "../actions";

interface Note {
    id: string;
    title: string;
    body: string;
    updatedAt: Date;
}

function formatDate(date: Date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function StoredContentsClient({ initialNotes }: { initialNotes: Note[] }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [selectedId, setSelectedId] = useState<string | null>(initialNotes.length > 0 ? initialNotes[0].id : null);
    const [search, setSearch] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editBody, setEditBody] = useState("");

    // Use effect to handle exactly like handleNew
    useEffect(() => {
        if (searchParams.get("create") === "true") {
            const runHandleNew = async () => {
                const newNote = await createStoredContent("Untitled Content", "");
                setNotes(prev => [newNote, ...prev]);
                setSelectedId(newNote.id);
                setEditTitle(newNote.title);
                setEditBody(newNote.body);
                setIsEditing(true);
            };
            // Ensure we only do this once if it matches (or push state clean up conceptually)
            runHandleNew();
            router.replace(pathname);
        }
    }, [searchParams, router, pathname]);

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.body.toLowerCase().includes(search.toLowerCase())
    );

    const selectedNote = notes.find(n => n.id === selectedId) ?? null;

    const handleNew = async () => {
        // Optimistic UI could be added, but simple waiting is fine for now
        const newNote = await createStoredContent("Untitled Content", "");
        setNotes(prev => [newNote, ...prev]);
        setSelectedId(newNote.id);
        setEditTitle(newNote.title);
        setEditBody(newNote.body);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!selectedId) return;
        const updatedNote = await updateStoredContent(selectedId, editTitle || "Untitled Content", editBody);
        setNotes(prev => prev.map(n => n.id === selectedId ? updatedNote : n));
        setIsEditing(false);
    };

    const handleEdit = (note: Note) => {
        setEditTitle(note.title);
        setEditBody(note.body);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        await deleteStoredContent(id);
        setNotes(prev => prev.filter(n => n.id !== id));
        if (selectedId === id) {
            const nextNode = notes.find(n => n.id !== id);
            setSelectedId(nextNode ? nextNode.id : null);
        }
    };

    return (
        <AppShell>
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="campaign-dashboard" style={{ display: "flex", flexDirection: "column", height: "100%" }}>

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
                            {/* Search bar — filters notes list live as user types */}
                            <div style={{ position: "relative" }}>
                                <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search content…"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24, padding: "10px 16px 10px 38px", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "0.88rem", outline: "none", width: 200, transition: "border-color 0.2s" }}
                                />
                            </div>
                            <button className="campaign-add-btn" onClick={handleNew}>+ Add Content</button>
                        </div>
                    </div>

                    {/* Notes App Body */}
                    <div style={{ display: "flex", flex: 1, gap: 20, marginTop: 32, minHeight: 0 }}>

                        {/* Sidebar */}
                        <div style={{
                            width: 280,
                            flexShrink: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}>
                            {/* Search */}
                            <div style={{ position: "relative" }}>
                                <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search content..."
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: 12,
                                        padding: "10px 14px 10px 40px",
                                        color: "#ffffff",
                                        fontFamily: "var(--font-sans)",
                                        fontSize: "0.9rem",
                                        outline: "none",
                                    }}
                                />
                            </div>

                            {/* Notes list */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
                                {filteredNotes.length === 0 && (
                                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem", textAlign: "center", marginTop: 32, fontStyle: "italic" }}>No content yet.</p>
                                )}
                                {filteredNotes.map(note => (
                                    <div
                                        key={note.id}
                                        onClick={() => { setSelectedId(note.id); setIsEditing(false); }}
                                        style={{
                                            padding: "14px 16px",
                                            borderRadius: 14,
                                            cursor: "pointer",
                                            background: selectedId === note.id
                                                ? "linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.04))"
                                                : "rgba(255,255,255,0.03)",
                                            border: `1px solid ${selectedId === note.id ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.06)"}`,
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.95rem", color: selectedId === note.id ? "#ffd700" : "#ffffff", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {note.title}
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {note.body || "Empty note"}
                                        </div>
                                        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", marginTop: 6 }}>
                                            {formatDate(note.updatedAt)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Vertical divider */}
                        <div style={{ width: 1, background: "rgba(255,255,255,0.08)", flexShrink: 0, borderRadius: 1 }} />

                        {/* Note editor / viewer */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                            {!selectedNote ? (
                                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <p style={{ color: "rgba(255,255,255,0.25)", fontStyle: "italic", fontSize: "0.95rem" }}>Select or create a content</p>
                                </div>
                            ) : isEditing ? (
                                /* Edit mode */
                                <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
                                    <input
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        placeholder="Content title..."
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            borderBottom: "1px solid rgba(255,255,255,0.12)",
                                            padding: "8px 0",
                                            fontSize: "1.8rem",
                                            fontFamily: "var(--font-anton)",
                                            color: "#ffffff",
                                            outline: "none",
                                            letterSpacing: "0.02em",
                                            textTransform: "uppercase",
                                            width: "100%",
                                        }}
                                    />
                                    <textarea
                                        value={editBody}
                                        onChange={e => setEditBody(e.target.value)}
                                        placeholder="Write your note here..."
                                        style={{
                                            flex: 1,
                                            background: "rgba(255,255,255,0.02)",
                                            border: "1px solid rgba(255,255,255,0.07)",
                                            borderRadius: 14,
                                            padding: "20px",
                                            color: "#e0e0e0",
                                            fontFamily: "var(--font-sans)",
                                            fontSize: "1rem",
                                            lineHeight: 1.75,
                                            outline: "none",
                                            resize: "none",
                                            minHeight: 300,
                                        }}
                                    />
                                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                        <button className="btn-stepper back" onClick={() => setIsEditing(false)}>Cancel</button>
                                        <button className="btn-stepper next" onClick={handleSave}>Save Content</button>
                                    </div>
                                </div>
                            ) : (
                                /* View mode */
                                <div style={{ display: "flex", flexDirection: "column", flex: 1, animation: "fadeIn 0.25s ease" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                                        <div>
                                            <h2 style={{ fontFamily: "var(--font-anton)", fontSize: "2.4rem", color: "#ffffff", margin: 0, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                                                {selectedNote.title}
                                            </h2>
                                            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", margin: "8px 0 0", fontFamily: "var(--font-sans)" }}>
                                                Last updated · {formatDate(selectedNote.updatedAt)}
                                            </p>
                                        </div>
                                        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                                            <button
                                                onClick={() => handleEdit(selectedNote)}
                                                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 18px", color: "#ffffff", fontFamily: "var(--font-sans)", fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" }}
                                            >
                                                ✎ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(selectedNote.id)}
                                                style={{ background: "#ffffff", border: "1px solid #ffffff", borderRadius: 10, padding: "8px 18px", color: "#000000", fontFamily: "var(--font-sans)", fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s", fontWeight: 700 }}
                                            >
                                                ✕ Delete
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, flex: 1 }}>
                                        {selectedNote.body ? (
                                            <p style={{ color: "#cccccc", fontFamily: "var(--font-sans)", fontSize: "1.05rem", lineHeight: 1.9, whiteSpace: "pre-wrap", margin: 0 }}>
                                                {selectedNote.body}
                                            </p>
                                        ) : (
                                            <p style={{ color: "rgba(255,255,255,0.25)", fontStyle: "italic", fontSize: "0.95rem" }}>This content is empty. Click Edit to add content.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </AppShell>
    );
}
