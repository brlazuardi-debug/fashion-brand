"use client";

// Floating WhatsApp Concierge bubble (PRD 6.7 / ACCT-3).
export default function WhatsAppBubble() {
  return (
    <a
      href="https://wa.me/6281234567890"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp Concierge"
      className="fixed bottom-24 md:bottom-8 right-margin-mobile md:right-margin-desktop z-30 bg-obsidian text-paper w-14 h-14 flex items-center justify-center hover:bg-graphite hover:scale-105 transition-all duration-300"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.744-6.29C.001 5.33 5.349 0 11.995 0 18.65 0 24 5.337 24 11.981c0 6.635-5.35 12-12.005 12a11.96 11.96 0 0 1-5.992-1.59L.057 24zm6.597-3.594l.403-.232a9.96 9.96 0 0 0 4.95 1.27c5.536 0 10.04-4.493 10.04-10.026 0-5.526-4.5-10.018-10.04-10.018-5.54 0-10.04 4.492-10.04 10.018 0 1.884.527 3.69 1.526 5.262l.27.45-1.142 4.188z" />
      </svg>
    </a>
  );
}
