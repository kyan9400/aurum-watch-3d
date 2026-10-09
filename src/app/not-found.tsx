import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "This hour does not exist — Aurum",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main id="main" className="notfound">
      <div className="wrap">
        <svg className="notfound-dial" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="92" fill="#1A1814" stroke="#8F6D33" strokeWidth="3" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="#3A352C" />
          {Array.from({ length: 12 }, (_, h) => (
            <rect key={h} x="98.5" y="26" width="3" height="10" fill="#D2AE6D" transform={`rotate(${h * 30} 100 100)`} />
          ))}
          {/* hands stopped at 4:04 */}
          <path d="M100 100 L132 118" stroke="#F0CD84" strokeWidth="5" strokeLinecap="round" />
          <path d="M100 100 L112 40" stroke="#F0CD84" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="5" fill="#F0CD84" />
        </svg>
        <p className="eyebrow">Error 404</p>
        <h1 className="h2">This hour does not exist.</h1>
        <p className="lede">The page you wanted has stopped. The rest of the watch is still running.</p>
        <Link href="/" className="btn btn-gold">
          Back to Aurum
        </Link>
      </div>
    </main>
  );
}
