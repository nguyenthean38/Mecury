/* ==========================================================
   Minh hoạ đồi ruộng bậc thang lúc bình minh (SVG tự vẽ)
   - Các lớp đồi sinh từ tổng sóng sin → đường ruộng bậc thang
     là các đường đồng mức nội suy từ sống đồi xuống chân đồi.
   - Màu đi qua biến CSS riêng, tự đổi khi bật chế độ tối.
   ========================================================== */
import { useId, useMemo } from 'react'
import { cn } from '@/lib/cn'

const W = 1440
const H = 800

/** base: cao độ chân sống đồi · waves: [biên độ, tần số, pha] · terraces: số đường bậc thang */
const LAYERS = [
  { base: 425, waves: [[30, 0.0042, 0.3], [12, 0.011, 1.2]], fill: 'var(--h-1)', terraces: 0 },
  { base: 478, waves: [[42, 0.0034, 2.0], [16, 0.0092, 0.5]], fill: 'var(--h-2)', terraces: 3, gap: 9 },
  { base: 540, waves: [[48, 0.003, 4.1], [18, 0.0081, 2.2]], fill: 'var(--h-3)', terraces: 5, gap: 11, mist: 520 },
  { base: 612, waves: [[54, 0.0027, 1.1], [20, 0.0072, 3.3]], fill: 'var(--h-4)', terraces: 6, gap: 13 },
  { base: 684, waves: [[44, 0.0033, 5.2], [14, 0.0102, 0.8]], fill: 'var(--h-5)', terraces: 6, gap: 14, mist: 660 },
  { base: 762, waves: [[34, 0.0025, 2.6], [10, 0.012, 4.0]], fill: 'var(--h-6)', terraces: 4, gap: 15 },
]

const ridge = (layer, x) => layer.base - layer.waves.reduce((s, [a, f, p]) => s + a * (0.5 + 0.5 * Math.sin(f * x + p)), 0)

function linePath(fn, step = 12) {
  let d = ''
  for (let x = -20; x <= W + 20; x += step) d += `${x === -20 ? 'M' : 'L'}${x},${fn(x).toFixed(1)}`
  return d
}

function buildLayers() {
  return LAYERS.map((l) => {
    const top = linePath((x) => ridge(l, x))
    const hill = `${top}L${W + 20},${H + 20}L-20,${H + 20}Z`
    const lines = []
    for (let k = 1; k <= l.terraces; k++) {
      const t = k / (l.terraces + 1.6)
      // nội suy giữa sống đồi và đường gần phẳng → đường đồng mức thoải dần xuống chân đồi
      const flat = l.base + 12
      lines.push(linePath((x) => ridge(l, x) * (1 - t * 0.85) + flat * (t * 0.85) + k * l.gap * 0.35))
    }
    return { ...l, hill, lines }
  })
}

const STYLE = `
.mach-hills{--h-sky1:#e6f2eb;--h-sky2:#f4f0e1;--h-sky3:#fbe2b4;--h-sun:#ffd98c;--h-glow:#ffe7b8;
--h-1:#d5e8dd;--h-2:#b7dac8;--h-3:#8cc4a8;--h-4:#58a883;--h-5:#2c8963;--h-6:#176c4f;--h-line:#ffffff;--h-line-o:.28;--h-mist:#ffffff;--h-mist-o:.6;--h-bird:#3b4044}
.dark .mach-hills{--h-sky1:#0a110f;--h-sky2:#0f1a16;--h-sky3:#2a2415;--h-sun:#c89443;--h-glow:#5a4520;
--h-1:#142520;--h-2:#162d26;--h-3:#17372d;--h-4:#164032;--h-5:#134736;--h-6:#0f3b2c;--h-line:#9fe3c5;--h-line-o:.08;--h-mist:#a7c4b8;--h-mist-o:.12;--h-bird:#8d9692}
@keyframes mach-mist{from{transform:translateX(-28px)}to{transform:translateX(28px)}}
@keyframes mach-sun{from{opacity:.85}to{opacity:1}}
.mach-mist{animation:mach-mist 16s ease-in-out infinite alternate}
.mach-mist-2{animation:mach-mist 22s ease-in-out -6s infinite alternate-reverse}
.mach-sun{animation:mach-sun 5s ease-in-out infinite alternate}
@media (prefers-reduced-motion: reduce){.mach-mist,.mach-mist-2,.mach-sun{animation:none}}
`

/**
 * <HillsArt className="absolute inset-0" />
 * sun: vị trí mặt trời theo % chiều ngang · birds: vẽ đàn chim nhỏ
 */
export function HillsArt({ className, sun = 0.68, birds = true, mist = true }) {
  const uid = useId().replace(/:/g, '')
  const layers = useMemo(buildLayers, [])
  const sx = W * sun
  return (
    <div className={cn('mach-hills pointer-events-none select-none', className)} aria-hidden>
      <style>{STYLE}</style>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="block w-full h-full">
        <defs>
          <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--h-sky1)' }} />
            <stop offset=".45" style={{ stopColor: 'var(--h-sky2)' }} />
            <stop offset=".62" style={{ stopColor: 'var(--h-sky3)' }} />
            <stop offset="1" style={{ stopColor: 'var(--h-sky3)' }} />
          </linearGradient>
          <radialGradient id={`glow${uid}`} cx={sx} cy="430" r="420" gradientUnits="userSpaceOnUse">
            <stop offset="0" style={{ stopColor: 'var(--h-glow)', stopOpacity: 0.95 }} />
            <stop offset=".35" style={{ stopColor: 'var(--h-glow)', stopOpacity: 0.45 }} />
            <stop offset="1" style={{ stopColor: 'var(--h-glow)', stopOpacity: 0 }} />
          </radialGradient>
          <filter id={`blur${uid}`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          {layers.map((l, i) => (
            <linearGradient key={i} id={`shade${uid}${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: '#ffffff', stopOpacity: 0.1 }} />
              <stop offset="1" style={{ stopColor: '#000000', stopOpacity: 0.08 }} />
            </linearGradient>
          ))}
        </defs>

        <rect width={W} height={H} fill={`url(#sky${uid})`} />
        <rect width={W} height={H} fill={`url(#glow${uid})`} className="mach-sun" />
        <circle cx={sx} cy="418" r="56" style={{ fill: 'var(--h-sun)' }} opacity=".9" className="mach-sun" />

        {birds && (
          <g fill="none" style={{ stroke: 'var(--h-bird)' }} strokeWidth="1.6" strokeLinecap="round" opacity=".45" className="max-sm:hidden">
            <path d={`M${sx - 260},250 q7,-7 14,0 q7,-7 14,0`} />
            <path d={`M${sx - 222},232 q5,-5 10,0 q5,-5 10,0`} />
            <path d={`M${sx - 300},272 q4,-4 8,0 q4,-4 8,0`} />
          </g>
        )}

        {layers.map((l, i) => (
          <g key={i}>
            <path d={l.hill} style={{ fill: l.fill }} />
            <path d={l.hill} fill={`url(#shade${uid}${i})`} />
            {l.lines.map((d, k) => (
              <path key={k} d={d} fill="none" style={{ stroke: 'var(--h-line)', strokeOpacity: 'var(--h-line-o)' }} strokeWidth={1 + i * 0.12} strokeLinecap="round" />
            ))}
            {mist && l.mist && (
              <g className={i % 2 ? 'mach-mist-2' : 'mach-mist'} filter={`url(#blur${uid})`} style={{ fill: 'var(--h-mist)', fillOpacity: 'var(--h-mist-o)' }}>
                <ellipse cx="260" cy={l.mist} rx="360" ry="26" />
                <ellipse cx="900" cy={l.mist + 14} rx="420" ry="22" />
                <ellipse cx="1360" cy={l.mist - 6} rx="300" ry="24" />
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
