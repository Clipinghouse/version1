import AppShell from "../components/AppShell";

export default function StatisticsPage() {
    return (
        <AppShell>
            <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)" }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "16px" }}>
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                        <line x1="2" y1="20" x2="22" y2="20" />
                    </svg>
                    <p style={{ fontSize: "1rem", fontWeight: 500 }}>Statistics — Coming Soon</p>
                </div>
            </main>
        </AppShell>
    );
}
