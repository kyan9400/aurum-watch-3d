/* Small code-drawn watch faces for the family section. */
type Props = { id: string; dial: string; dialEdge: string; ink: string; metal: string; strap: string; label: string };

export default function MiniDial({ id, dial, dialEdge, ink, metal, strap, label }: Props) {
  return (
    <svg viewBox="0 0 200 260" className="mini-dial" role="img" aria-label={label}>
      <defs>
        <radialGradient id={`d-${id}`} cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor={dial} />
          <stop offset="1" stopColor={dialEdge} />
        </radialGradient>
        <linearGradient id={`m-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="0.4" stopColor={metal} />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <rect x="72" y="0" width="56" height="70" fill={strap} />
      <rect x="72" y="190" width="56" height="70" fill={strap} />
      <rect x="62" y="56" width="16" height="36" rx="6" fill={`url(#m-${id})`} />
      <rect x="122" y="56" width="16" height="36" rx="6" fill={`url(#m-${id})`} />
      <rect x="62" y="168" width="16" height="36" rx="6" fill={`url(#m-${id})`} />
      <rect x="122" y="168" width="16" height="36" rx="6" fill={`url(#m-${id})`} />
      <circle cx="100" cy="130" r="66" fill={`url(#m-${id})`} />
      <circle cx="100" cy="130" r="56" fill={`url(#d-${id})`} />
      <g fill={metal}>
        {Array.from({ length: 12 }, (_, h) => (
          <rect key={h} x={h === 0 ? -3.5 : -1.5} y="-50" width={h === 0 ? 7 : 3} height="9" transform={`translate(100 130) rotate(${h * 30})`} />
        ))}
        <path d="M0 -30 L3.5 0 L0 5 L-3.5 0 Z" transform="translate(100 130) rotate(-50)" />
        <path d="M0 -44 L3 0 L0 6 L-3 0 Z" transform="translate(100 130) rotate(60)" />
        <circle cx="100" cy="130" r="3" />
      </g>
      <text x="100" y="112" textAnchor="middle" fontSize="8" letterSpacing="1.5" fill={ink} fontFamily="var(--ff-display), Georgia, serif" fontWeight="600">
        AURUM
      </text>
    </svg>
  );
}
