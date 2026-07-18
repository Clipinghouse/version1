"use client";

import AppShell from "./components/AppShell";

const actionCards = [
  {
    id: "campaign",
    route: "/campaigns?create=true",
    label: "Add your Campaign",
    sub: "Add the campaign you're working on",
    colorClass: "card-pink",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    id: "context",
    route: "/context?create=true",
    label: "Add your Context",
    sub: "Add context about specific things",
    colorClass: "card-orange",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    id: "stats",
    route: "/statistics",
    label: "View your Stats",
    sub: "Check your clipping analytics",
    colorClass: "card-teal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
];


import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <AppShell>
      <main style={{ flex: 1 }}>
        <section className="hero-section">

          {/* Ambient glow orbs */}
          <div className="glow-orb glow-pink" />
          <div className="glow-orb glow-orange" />
          <div className="glow-orb glow-teal" />

          <div className="hero-inner">
            <div className="hero-label">Quick Actions</div>

            <div className="action-cards-grid">
              {actionCards.map((card) => (
                <button
                  key={card.id}
                  className={`action-card ${card.colorClass}`}
                  onClick={() => router.push(card.route)}
                >
                  <div className="action-card-top">
                    <div className="action-icon-ring">
                      {card.icon}
                    </div>
                  </div>
                  <div className="action-card-bottom">
                    <div className="action-card-label">{card.label}</div>
                    <div className="action-card-sub">{card.sub}</div>
                  </div>
                  <div className="action-card-shine" />
                </button>
              ))}
            </div>
          </div>

        </section>
      </main>
    </AppShell>
  );
}
