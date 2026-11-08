import { cn } from '@/lib/cn'

/** Biểu tượng Mạch: hai dòng chảy song song trong ô vuông bo góc */
export function LogoMark({ size = 28, className, mono }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={cn('shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id="mach-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1fae80" />
          <stop offset="1" stopColor="#0b6148" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill={mono ? 'currentColor' : 'url(#mach-g)'} fillOpacity={mono ? 0.16 : 1} />
      <g fill="none" stroke={mono ? 'currentColor' : '#fff'} strokeWidth="4.4" strokeLinecap="round">
        <path d="M14 40c6-10 10-10 13-3s7 7 11-3 9-10 12-2" opacity=".55" />
        <path d="M14 30c6-10 10-10 13-3s7 7 11-3 9-10 12-2" />
      </g>
    </svg>
  )
}

export function Logo({ className, size = 28, text = true }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {text && <span className="text-[19px] font-[650] tracking-[-0.02em] leading-none">Mạch</span>}
    </span>
  )
}
