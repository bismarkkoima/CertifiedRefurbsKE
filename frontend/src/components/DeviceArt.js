// Illustrated product renders — crisp at any size, tinted by the selected finish.
const kindFor = (category, name = '') => {
  if (category === 'accessories') return /watch/i.test(name) ? 'watch' : /WH-|headphone/i.test(name) ? 'headphones' : 'buds'
  if (category === 'phones' && /fold/i.test(name)) return 'fold'
  if (category === 'phones' && /flip|razr/i.test(name)) return 'flip'
  return category || 'phones'
}

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))
const shade = (hex, amt) => {
  const n = parseInt(hex.replace('#', ''), 16)
  const mix = (c) => clamp(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`
}

function Defs({ id, hue, color }) {
  const body = color || `hsl(${hue} 10% 30%)`
  return (
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={`hsl(${hue} 85% 64%)`} />
        <stop offset=".55" stopColor={`hsl(${(hue + 40) % 360} 75% 46%)`} />
        <stop offset="1" stopColor={`hsl(${(hue + 80) % 360} 70% 26%)`} />
      </linearGradient>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={color ? shade(color, 0.25) : body} />
        <stop offset=".5" stopColor={color ? shade(color, 0) : body} />
        <stop offset="1" stopColor={color ? shade(color, -0.35) : `hsl(${hue} 12% 14%)`} />
      </linearGradient>
      <linearGradient id={`${id}-alu`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color ? shade(color, 0.35) : '#e2e3e5'} />
        <stop offset="1" stopColor={color ? shade(color, -0.15) : '#a9abaf'} />
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
      <circle cx={x + w * 0.7} cy={y + h * 0.3} r={Math.min(w, h) * 0.45} fill={`url(#${id}-orb)`} />
      <circle cx={x + w * 0.2} cy={y + h * 0.8} r={Math.min(w, h) * 0.3} fill={`url(#${id}-orb)`} opacity=".6" />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id}-glare)`} />
    </g>
  )
}

const SHAPES = {
  phones: (id) => (
    <>
      <rect x="58" y="8" width="84" height="184" rx="20" fill={`url(#${id}-body)`} />
      <Wallpaper id={id} x={62} y={12} w={76} h={176} r={16} />
      <rect x="86" y="19" width="28" height="8" rx="4" fill="#0b0b0f" />
      <rect x="84" y="179" width="32" height="3" rx="1.5" fill="#fff" opacity=".7" />
    </>
  ),
  fold: (id) => (
    <>
      <rect x="22" y="22" width="156" height="156" rx="16" fill={`url(#${id}-body)`} />
      <Wallpaper id={id} x={26} y={26} w={148} h={148} r={12} />
      <rect x="99" y="26" width="2" height="148" fill="#000" opacity=".18" />
      <circle cx="150" cy="38" r="3" fill="#0b0b0f" />
    </>
  ),
  flip: (id) => (
    <>
      <rect x="58" y="8" width="84" height="184" rx="20" fill={`url(#${id}-body)`} />
      <Wallpaper id={id} x={62} y={12} w={76} h={176} r={16} />
      <rect x="62" y="99" width="76" height="2" fill="#000" opacity=".2" />
      <circle cx="100" cy="21" r="3" fill="#0b0b0f" />
    </>
  ),
  laptops: (id) => (
    <>
      <rect x="30" y="38" width="140" height="94" rx="8" fill="#16171a" />
      <Wallpaper id={id} x={34} y={42} w={132} h={84} r={3} />
      <circle cx="100" cy="40" r="1.3" fill="#444" />
      <path d="M14 134h172l-8 13a6 6 0 0 1-5 3H27a6 6 0 0 1-5-3l-8-13Z" fill={`url(#${id}-alu)`} />
      <rect x="84" y="134" width="32" height="4" rx="2" fill="#000" opacity=".15" />
    </>
  ),
  tablets: (id) => (
    <>
      <rect x="22" y="30" width="156" height="140" rx="14" fill={`url(#${id}-body)`} />
      <Wallpaper id={id} x={28} y={36} w={144} h={128} r={9} />
      <circle cx="100" cy="33" r="1.5" fill="#222" />
    </>
  ),
  watch: (id) => (
    <>
      <rect x="74" y="4" width="52" height="58" rx="12" fill={`url(#${id}-body)`} opacity=".9" />
      <rect x="74" y="138" width="52" height="58" rx="12" fill={`url(#${id}-body)`} opacity=".9" />
      <rect x="56" y="46" width="88" height="108" rx="26" fill={`url(#${id}-alu)`} />
      <rect x="61" y="51" width="78" height="98" rx="22" fill="#0b0b0f" />
      <Wallpaper id={id} x={66} y={56} w={68} h={88} r={18} />
      <rect x="143" y="80" width="6" height="18" rx="3" fill={`url(#${id}-alu)`} />
      <text x="100" y="108" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700" fontFamily="system-ui">10:09</text>
    </>
  ),
  buds: (id) => (
    <>
      <rect x="40" y="70" width="120" height="96" rx="38" fill={`url(#${id}-alu)`} stroke="#0002" />
      <path d="M40 108h120" stroke="#0002" strokeWidth="2" />
      <circle cx="100" cy="130" r="4" fill="hsl(140 60% 50%)" />
      <g transform="translate(58 20) rotate(-12)">
        <ellipse cx="18" cy="20" rx="18" ry="16" fill={`url(#${id}-alu)`} stroke="#0002" />
        <rect x="12" y="28" width="11" height="40" rx="5.5" fill={`url(#${id}-alu)`} stroke="#0002" />
      </g>
      <g transform="translate(108 14) rotate(12)">
        <ellipse cx="18" cy="20" rx="18" ry="16" fill={`url(#${id}-alu)`} stroke="#0002" />
        <rect x="13" y="28" width="11" height="40" rx="5.5" fill={`url(#${id}-alu)`} stroke="#0002" />
      </g>
    </>
  ),
  headphones: (id) => (
    <>
      <path d="M44 120V96a56 56 0 0 1 112 0v24" fill="none" stroke={`url(#${id}-body)`} strokeWidth="12" strokeLinecap="round" />
      <rect x="28" y="108" width="40" height="70" rx="20" fill={`url(#${id}-body)`} />
      <rect x="132" y="108" width="40" height="70" rx="20" fill={`url(#${id}-body)`} />
      <rect x="36" y="118" width="24" height="50" rx="12" fill="#000" opacity=".25" />
      <rect x="140" y="118" width="24" height="50" rx="12" fill="#000" opacity=".25" />
    </>
  ),
}

// Camera layouts, loosely by family, so the backs don't all look alike.
function Cameras({ name = '', x, y }) {
  const lens = (cx, cy, r = 7) => (
    <g key={`${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r={r + 1.6} fill="#0b0b0f" opacity=".85" />
      <circle cx={cx} cy={cy} r={r} fill="#1c2233" />
      <circle cx={cx - r * .3} cy={cy - r * .3} r={r * .28} fill="#fff" opacity=".35" />
    </g>
  )
  if (/pixel/i.test(name)) {
    return <><rect x={x - 6} y={y + 8} width="96" height="22" rx="11" fill="#0b0b0f" opacity=".82" />{lens(x + 12, y + 19, 6)}{lens(x + 30, y + 19, 6)}</>
  }
  if (/galaxy s|ultra|xperia|reno|edge|note 1/i.test(name) && !/iphone/i.test(name)) {
    return <>{lens(x + 10, y + 10)}{lens(x + 10, y + 30)}{lens(x + 10, y + 50)}{/ultra/i.test(name) && lens(x + 28, y + 14, 4)}</>
  }
  const pro = /pro|ultra|max|fold|plus|\+/i.test(name)
  return (
    <>
      <rect x={x - 2} y={y - 2} width={pro ? 44 : 36} height={pro ? 44 : 36} rx="11" fill="#fff" opacity=".18" />
      {lens(x + 10, y + 10)}{lens(pro ? x + 10 : x + 22, pro ? y + 30 : y + 22)}{pro && lens(x + 29, y + 20)}
    </>
  )
}

const BACKS = {
  phones: (id, name) => (
    <>
      <rect x="58" y="8" width="84" height="184" rx="20" fill={`url(#${id}-body)`} />
      <rect x="58" y="8" width="84" height="184" rx="20" fill={`url(#${id}-glare)`} />
      <Cameras name={name} x={68} y={18} />
    </>
  ),
  tablets: (id) => (
    <>
      <rect x="22" y="30" width="156" height="140" rx="14" fill={`url(#${id}-body)`} />
      <rect x="22" y="30" width="156" height="140" rx="14" fill={`url(#${id}-glare)`} />
      <circle cx="40" cy="48" r="7" fill="#1c2233" stroke="#0b0b0f" strokeWidth="2" />
    </>
  ),
  laptops: (id) => (
    <>
      <rect x="30" y="38" width="140" height="94" rx="8" fill={`url(#${id}-alu)`} />
      <rect x="30" y="38" width="140" height="94" rx="8" fill={`url(#${id}-glare)`} />
      <path d="M14 134h172l-8 13a6 6 0 0 1-5 3H27a6 6 0 0 1-5-3l-8-13Z" fill={`url(#${id}-alu)`} />
    </>
  ),
}
BACKS.flip = BACKS.phones
BACKS.fold = (id, name) => (
  <>
    <rect x="58" y="8" width="84" height="184" rx="16" fill={`url(#${id}-body)`} />
    <rect x="62" y="12" width="76" height="176" rx="12" fill="#0b0b0f" opacity=".85" />
    <rect x="62" y="12" width="76" height="176" rx="12" fill={`url(#${id}-wall)`} opacity=".9" />
    <Cameras name={name} x={150} y={18} />
  </>
)

/**
 * view: "front" | "back" | "pair" (back and front together — phones only).
 */
export default function DeviceArt({ category, name, hue = 220, color, className = '', view = 'front', variant = 0 }) {
  const kind = kindFor(category, name)
  const h = (hue + variant * 25) % 360
  const id = `da-${kind}-${h}-${(color || 'x').replace('#', '')}`
  const front = (SHAPES[kind] || SHAPES.phones)(id)
  const back = BACKS[kind]?.(id, name)
  const pairable = ['phones', 'flip'].includes(kind)
  let body = front
  if (view === 'back' && back) body = back
  if (view === 'pair' && pairable) {
    body = (
      <>
        <g transform="translate(-28 8) scale(.94)">{back}</g>
        <g transform="translate(30 4) scale(.96)">{front}</g>
      </>
    )
  }
  return (
    <div className={`device-art ${className}`} role="img" aria-label={name || kind}>
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <Defs id={id} hue={h} color={color} />
        {body}
      </svg>
    </div>
  )
}

// Real photo when the product has one, otherwise the illustration.
export function ProductImage({ product, color, view = 'front', className = '' }) {
  if (product.image_url) {
    return <img src={product.image_url} alt={`${product.brand} ${product.name}`} className={className} loading="lazy" />
  }
  return <DeviceArt category={product.category} name={product.name} hue={product.hue}
    color={color || product.colors?.[0]?.hex} view={view} className={className} />
}
