// Illustrated product renders — crisp at any size, themed per product hue.
const kindFor = (category, name = '') => {
  if (category === 'accessories') return /watch/i.test(name) ? 'watch' : 'buds'
  return category || 'phones'
}

function Defs({ id, hue }) {
  return (
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={`hsl(${hue} 85% 62%)`} />
        <stop offset=".55" stopColor={`hsl(${(hue + 40) % 360} 75% 45%)`} />
        <stop offset="1" stopColor={`hsl(${(hue + 80) % 360} 70% 28%)`} />
      </linearGradient>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={`hsl(${hue} 12% 34%)`} />
        <stop offset="1" stopColor={`hsl(${hue} 14% 14%)`} />
      </linearGradient>
      <linearGradient id={`${id}-alu`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={`hsl(${hue} 8% 86%)`} />
        <stop offset="1" stopColor={`hsl(${hue} 8% 66%)`} />
      </linearGradient>
      <linearGradient id={`${id}-glare`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".35" />
        <stop offset=".45" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${id}-orb`} cx=".3" cy=".3" r=".8">
        <stop offset="0" stopColor="#fff" stopOpacity=".55" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

function Wallpaper({ id, x, y, w, h, r }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id}-wall)`} />
      <circle cx={x + w * 0.7} cy={y + h * 0.3} r={w * 0.45} fill={`url(#${id}-orb)`} />
      <circle cx={x + w * 0.2} cy={y + h * 0.8} r={w * 0.3} fill={`url(#${id}-orb)`} opacity=".6" />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id}-glare)`} />
    </g>
  )
}

const SHAPES = {
  phones: (id) => (
    <svg viewBox="0 0 200 200">
      <rect x="58" y="8" width="84" height="184" rx="20" fill={`url(#${id}-body)`} />
      <Wallpaper id={id} x={63} y={13} w={74} h={174} r={15} />
      <rect x="86" y="20" width="28" height="8" rx="4" fill="#0b0b0f" />
      <rect x="84" y="178" width="32" height="3" rx="1.5" fill="#fff" opacity=".7" />
    </svg>
  ),
  laptops: (id) => (
    <svg viewBox="0 0 200 200">
      <rect x="30" y="38" width="140" height="94" rx="8" fill={`url(#${id}-body)`} />
      <Wallpaper id={id} x={35} y={43} w={130} h={82} r={3} />
      <circle cx="100" cy="40.5" r="1.3" fill="#444" />
      <path d="M14 136h172l-8 12a6 6 0 0 1-5 3H27a6 6 0 0 1-5-3l-8-12Z" fill={`url(#${id}-alu)`} />
      <rect x="84" y="136" width="32" height="4" rx="2" fill="#000" opacity=".15" />
    </svg>
  ),
  tablets: (id) => (
    <svg viewBox="0 0 200 200">
      <rect x="22" y="30" width="156" height="140" rx="14" fill={`url(#${id}-body)`} />
      <Wallpaper id={id} x={29} y={37} w={142} h={126} r={8} />
      <circle cx="100" cy="33.5" r="1.5" fill="#222" />
    </svg>
  ),
  watch: (id) => (
    <svg viewBox="0 0 200 200">
      <rect x="74" y="4" width="52" height="58" rx="12" fill="#2a2c33" />
      <rect x="74" y="138" width="52" height="58" rx="12" fill="#2a2c33" />
      <rect x="56" y="46" width="88" height="108" rx="26" fill={`url(#${id}-body)`} />
      <Wallpaper id={id} x={63} y={53} w={74} h={94} r={20} />
      <rect x="143" y="80" width="6" height="18" rx="3" fill={`url(#${id}-alu)`} />
      <text x="100" y="108" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700" fontFamily="system-ui">10:09</text>
    </svg>
  ),
  buds: (id) => (
    <svg viewBox="0 0 200 200">
      <rect x="40" y="70" width="120" height="96" rx="38" fill="#fafafa" stroke="#ddd" />
      <path d="M40 108h120" stroke="#ddd" strokeWidth="2" />
      <circle cx="100" cy="130" r="4" fill={`hsl(140 60% 50%)`} />
      <g transform="translate(58 20) rotate(-12)">
        <ellipse cx="18" cy="20" rx="18" ry="16" fill="#fff" stroke="#ddd" />
        <rect x="12" y="28" width="11" height="40" rx="5.5" fill="#fff" stroke="#ddd" />
      </g>
      <g transform="translate(108 14) rotate(12)">
        <ellipse cx="18" cy="20" rx="18" ry="16" fill="#fff" stroke="#ddd" />
        <rect x="13" y="28" width="11" height="40" rx="5.5" fill="#fff" stroke="#ddd" />
      </g>
      <ellipse cx="100" cy="88" rx="56" ry="10" fill={`url(#${id}-wall)`} opacity=".25" />
    </svg>
  ),
}

export default function DeviceArt({ category, name, hue = 220, className = '', variant = 0 }) {
  const kind = kindFor(category, name)
  const h = (hue + variant * 25) % 360
  const id = `da-${kind}-${h}`
  const svg = SHAPES[kind] ? SHAPES[kind](id) : SHAPES.phones(id)
  return (
    <div className={`device-art ${className}`} role="img" aria-label={name || kind}>
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <Defs id={id} hue={h} />
        {svg.props.children}
      </svg>
    </div>
  )
}
