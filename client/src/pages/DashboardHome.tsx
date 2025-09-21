import React from 'react';

export default function DashboardHome() {
  return (
    <div className="relative">
      {/* Cinematic gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-[#0a0a0a] to-black" />

      {/* Hero Section */}
  <section className="h-[38vh] sm:h-[40vh] flex flex-col items-center justify-center text-center py-6">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-neutral-900/70 border border-neutral-800 shadow-lg backdrop-blur-sm animate-float">
          <span className="text-xl">🎬</span>
          <span className="text-sm text-neutral-300">Director’s Dashboard</span>
        </div>
        <h2 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Get Ready For Something Great
          <span className="block text-netflix-red">Director Sahab</span>
        </h2>
        <p className="mt-4 text-neutral-300 max-w-2xl">
          Score performances, track rounds, and crown the stars of tomorrow. Lights, camera, action!
        </p>
      </section>

      {/* Quick Actions */}
  <section className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4 p-4 h-[calc(60vh-1rem)]">
        <ActionCard
          emoji="🎟️"
          title="Enter Candidate Details"
          desc="Add or update contestants, import in bulk."
          href="/app/students"
          accent="from-purple-500/20"
        />
        <ActionCard
          emoji="🎭"
          title="Round 1"
          desc="Expressions & confidence — set the tone."
          href="/app/round-1"
          accent="from-blue-500/20"
        />
        <ActionCard
          emoji="🗣️"
          title="Round 2"
          desc="Dialogue & creativity — bring scripts alive."
          href="/app/round-2"
          accent="from-green-500/20"
        />
        <ActionCard
          emoji="🎬"
          title="Round 3"
          desc="Final showcase — make the call."
          href="/app/round-3"
          accent="from-orange-500/20"
        />
        <ActionCard
          emoji="📊"
          title="Final Scores"
          desc="Totals and rankings — export to Excel."
          href="/app/final-scores"
          accent="from-red-500/20"
        />
        <ActionCard
          emoji="⚙️"
          title="Your Account"
          desc="Change password anytime from the sidebar."
          href="/app"
          accent="from-yellow-500/20"
        />
      </section>
    </div>
  );
}

type CardProps = {
  emoji: string;
  title: string;
  desc: string;
  href: string;
  accent?: string;
};

function ActionCard({ emoji, title, desc, href, accent = 'from-netflix-red/20' }: CardProps) {
  return (
    <a
      href={href}
      className={`group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900 transition-colors duration-300 shadow-lg`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="p-4">
        <div className="text-2xl mb-2 drop-shadow-sm animate-pop">{emoji}</div>
        <h3 className="text-base font-semibold leading-tight line-clamp-1">{title}</h3>
        <p className="text-neutral-400 text-xs mt-1 line-clamp-2">{desc}</p>
        <div className="mt-3 inline-flex items-center gap-2 text-netflix-red opacity-0 group-hover:opacity-100 transition-opacity text-sm">
          <span>Open</span>
          <span>➜</span>
        </div>
      </div>
    </a>
  );
}

