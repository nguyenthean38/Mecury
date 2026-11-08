/* ==========================================================
   Biểu đồ SVG tự viết — không dùng thư viện ngoài
   - AreaChart: số dư theo thời gian, có đường dọc và tooltip khi rê chuột
   - CashflowChart: cột tiền vào / tiền ra + đường dòng tiền ròng
   - Donut, Sparkline, BarList
   ========================================================== */
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { formatCompact, formatDay, formatVND } from '@/lib/format'
import { useUI } from '@/store'

function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

/** Các mốc trục tròn đẹp */
function niceTicks(min, max, count = 4) {
  if (min === max) { max = min + 1 }
  const span = max - min
  const step0 = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(step0)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) || 10 * mag
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const out = []
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v))
  return out
}

function Tip({ x, y, w, children }) {
  const left = Math.min(Math.max(x - 80, 0), w - 160)
  return (
    <div className="pointer-events-none absolute z-10 w-40 rounded-lg border border-line bg-surface px-3 py-2 shadow-md text-[12.5px] animate-fade-in" style={{ left, top: Math.max(0, y) }}>
      {children}
    </div>
  )
}

/**
 * Biểu đồ vùng.
 * data: [{ date: Date, value: number }]
 */
export function AreaChart({ data, height = 200, color = 'var(--c-brand-500)', showAxis = true, className, formatValue = formatVND, yTicks = 3, baseline = 'auto' }) {
  const [ref, w] = useWidth()
  const hide = useUI((s) => s.hideBalances)
  const gid = useId().replace(/:/g, '')
  const [hover, setHover] = useState(null)
  const padL = showAxis ? 54 : 0, padB = showAxis ? 26 : 4, padT = 10
  const values = data.map((d) => d.value)
  let min = Math.min(...values), max = Math.max(...values)
  if (baseline === 'zero') min = Math.min(0, min)
  const pad = (max - min) * 0.12 || max * 0.1 || 1
  const ticks = niceTicks(Math.max(0, min - pad), max + pad, yTicks)
  const lo = ticks[0], hi = ticks[ticks.length - 1]
  const iw = Math.max(1, w - padL), ih = height - padB - padT
  const X = (i) => padL + (i / Math.max(1, data.length - 1)) * iw
  const Y = (v) => padT + ih - ((v - lo) / (hi - lo || 1)) * ih
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(d.value).toFixed(1)}`).join('')
  const area = `${line}L${X(data.length - 1)},${padT + ih}L${X(0)},${padT + ih}Z`
  const xLabels = useMemo(() => {
    const n = Math.min(6, data.length)
    return Array.from({ length: n }, (_, k) => Math.round((k / (n - 1 || 1)) * (data.length - 1)))
  }, [data.length])

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - r.left - padL
    const i = Math.round((x / iw) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  return (
    <div ref={ref} className={cn('relative w-full select-none', className)} style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} className="overflow-visible">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity=".2" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {showAxis && ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={w} y1={Y(t)} y2={Y(t)} stroke="var(--c-line)" strokeDasharray="2 4" />
              <text x={padL - 10} y={Y(t) + 4} textAnchor="end" className="fill-faint text-[11px] num">{hide ? '•••' : formatCompact(t, { unit: true })}</text>
            </g>
          ))}
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
          {showAxis && xLabels.map((i) => (
            <text key={i} x={X(i)} y={height - 6} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} className="fill-faint text-[11px]">
              {data[i].label || formatDay(data[i].date)}
            </text>
          ))}
          {hover != null && (
            <g>
              <line x1={X(hover)} x2={X(hover)} y1={padT} y2={padT + ih} stroke="var(--c-line-strong)" />
              <circle cx={X(hover)} cy={Y(data[hover].value)} r="4.5" fill="var(--c-surface)" stroke={color} strokeWidth="2" />
            </g>
          )}
        </svg>
      )}
      {hover != null && w > 0 && (
        <Tip x={X(hover)} y={Y(data[hover].value) - 64} w={w}>
          <div className="text-muted">{data[hover].label || formatDay(data[hover].date, { year: true })}</div>
          <div className="num font-[600] text-fg mt-0.5">{hide ? '•••••• ₫' : formatValue(data[hover].value)}</div>
        </Tip>
      )}
    </div>
  )
}

/**
 * Biểu đồ dòng tiền: cột tiền vào (trên), tiền ra (dưới), đường ròng.
 * data: [{ label, inflow, outflow (số âm), net }]
 */
export function CashflowChart({ data, height = 280, className, active, onSelect, showNet = true }) {
  const [ref, w] = useWidth()
  const hide = useUI((s) => s.hideBalances)
  const [hover, setHover] = useState(null)
  const padL = 58, padB = 28, padT = 12
  const maxV = Math.max(...data.map((d) => d.inflow), 1)
  const minV = Math.min(...data.map((d) => d.outflow), ...data.map((d) => d.net), -1)
  const ticks = niceTicks(minV * 1.08, maxV * 1.08, 4)
  const lo = ticks[0], hi = ticks[ticks.length - 1]
  const iw = Math.max(1, w - padL), ih = height - padB - padT
  const slot = iw / data.length
  const bw = Math.min(34, slot * 0.46)
  const Y = (v) => padT + ih - ((v - lo) / (hi - lo || 1)) * ih
  const cx = (i) => padL + slot * i + slot / 2
  const net = data.map((d, i) => `${i ? 'L' : 'M'}${cx(i)},${Y(d.net)}`).join('')
  const h = hover ?? active

  return (
    <div ref={ref} className={cn('relative w-full select-none', className)} style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} className="overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={w} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? 'var(--c-line-strong)' : 'var(--c-line)'} strokeDasharray={t === 0 ? '' : '2 4'} />
              <text x={padL - 10} y={Y(t) + 4} textAnchor="end" className="fill-faint text-[11px] num">{hide ? '•••' : formatCompact(t)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const on = h === i
            return (
              <g key={d.label + i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => onSelect?.(i)} className={onSelect ? 'cursor-pointer' : ''}>
                <rect x={padL + slot * i} y={padT} width={slot} height={ih} fill={on ? 'var(--c-subtle)' : 'transparent'} rx="8" />
                <rect x={cx(i) - bw / 2} y={Y(d.inflow)} width={bw} height={Math.max(0, Y(0) - Y(d.inflow))} rx="4" fill="var(--c-brand-400)" opacity={h == null || on ? 1 : 0.45} />
                <rect x={cx(i) - bw / 2} y={Y(0)} width={bw} height={Math.max(0, Y(d.outflow) - Y(0))} rx="4" fill="var(--c-neg)" opacity={h == null || on ? 0.7 : 0.3} />
                <text x={cx(i)} y={height - 8} textAnchor="middle" className={cn('text-[11.5px]', on ? 'fill-fg font-[600]' : 'fill-faint')}>{d.label}</text>
              </g>
            )
          })}
          {showNet && <path d={net} fill="none" stroke="var(--c-fg)" strokeWidth="1.6" strokeDasharray="4 3" opacity=".7" pointerEvents="none" />}
          {showNet && data.map((d, i) => <circle key={i} cx={cx(i)} cy={Y(d.net)} r={h === i ? 4.5 : 3} fill="var(--c-surface)" stroke="var(--c-fg)" strokeWidth="1.6" pointerEvents="none" />)}
        </svg>
      )}
      {hover != null && w > 0 && (
        <Tip x={cx(hover)} y={8} w={w}>
          <div className="font-[600] text-fg mb-1">{data[hover].tip || data[hover].label}</div>
          <div className="flex justify-between gap-2"><span className="text-muted">Tiền vào</span><span className="num text-pos">{hide ? '•••' : formatCompact(data[hover].inflow)}</span></div>
          <div className="flex justify-between gap-2"><span className="text-muted">Tiền ra</span><span className="num text-neg">{hide ? '•••' : formatCompact(data[hover].outflow)}</span></div>
          <div className="flex justify-between gap-2 border-t border-line mt-1 pt-1"><span className="text-muted">Ròng</span><span className="num font-[600]">{hide ? '•••' : formatCompact(data[hover].net)}</span></div>
        </Tip>
      )}
    </div>
  )
}

/** Biểu đồ tròn rỗng. segments: [{ key, label, value, color }] */
export function Donut({ segments, size = 168, thickness = 18, children, active, onHover }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-subtle)" strokeWidth={thickness} />
        {segments.map((s) => {
          const len = (s.value / total) * c
          const el = (
            <circle key={s.key} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={active === s.key ? thickness + 4 : thickness}
              strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-acc}
              onMouseEnter={() => onHover?.(s.key)} onMouseLeave={() => onHover?.(null)}
              opacity={active && active !== s.key ? 0.35 : 1} className="transition-all duration-200" />
          )
          acc += len
          return el
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

/** Đường nhỏ gọn trong ô */
export function Sparkline({ values, width = 96, height = 28, color = 'var(--c-brand-500)', fill = true }) {
  const gid = useId().replace(/:/g, '')
  const min = Math.min(...values), max = Math.max(...values)
  const X = (i) => (i / Math.max(1, values.length - 1)) * width
  const Y = (v) => height - 2 - ((v - min) / (max - min || 1)) * (height - 4)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('')
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {fill && <path d={`${d}L${width},${height}L0,${height}Z`} fill={`url(#${gid})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Danh sách thanh ngang: items [{ key, label, value, color, icon }] */
export function BarList({ items, format = formatVND, max, className, onClick }) {
  const hide = useUI((s) => s.hideBalances)
  const top = max || Math.max(...items.map((i) => i.value), 1)
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {items.map((it) => (
        <button key={it.key} onClick={() => onClick?.(it)} disabled={!onClick}
          className="group relative flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left disabled:cursor-default enabled:hover:bg-subtle">
          <span className="absolute inset-y-1 left-1 rounded-md opacity-[.14] transition-all" style={{ width: `calc(${(it.value / top) * 100}% - 8px)`, background: it.color || 'var(--c-brand-500)' }} />
          <span className="relative flex items-center gap-2 min-w-0 text-[13.5px]">
            {it.icon}
            <span className="truncate">{it.label}</span>
          </span>
          <span className="relative num text-[13.5px] font-[550] shrink-0">{hide ? '••••' : format(it.value)}</span>
        </button>
      ))}
    </div>
  )
}
