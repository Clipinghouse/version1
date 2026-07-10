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
        <path d="M12 5v14M5 12h14" />
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
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    id: "reels",
    route: "/stored-contents?create=true",
    label: "Add Content",
    sub: "Store the reels that are viral",
    colorClass: "card-teal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
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
