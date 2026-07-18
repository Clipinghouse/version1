export default function Loading() {
    return (
        <div style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
            zIndex: 9999,
            color: "#fff"
        }}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "24px"
            }}>
                {/* Custom Spinner */}
                <svg width="40" height="40" viewBox="0 0 50 50" className="spinner">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#fff" strokeWidth="4" strokeDasharray="30 100" strokeLinecap="round">
                        <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" from="0 25 25" to="360 25 25" />
                    </circle>
                </svg>
                <div style={{
                    fontSize: "0.85rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.5)",
                    animation: "pulseText 1.5s infinite"
                }}>
                    Loading Environment
                </div>
            </div>
            <style>{`
                @keyframes pulseText {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
