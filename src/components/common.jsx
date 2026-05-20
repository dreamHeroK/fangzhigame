import React, { useRef, useEffect, useCallback } from 'react'

/**
 * 返回长按事件 handlers。按住触发连续回调；按住 Ctrl 速度×10。
 * @param {(count: number) => void} onAdd
 * @param {{ disabled?: boolean }} opts
 */
export function useLongPress(onAdd, { disabled = false } = {}) {
  const holdTimer    = useRef(null)
  const holdInterval = useRef(null)
  const ctrlRef      = useRef(false)
  const disabledRef  = useRef(disabled)
  disabledRef.current = disabled
  const onAddRef     = useRef(onAdd)
  onAddRef.current   = onAdd

  const stop = useCallback(() => {
    clearTimeout(holdTimer.current)
    clearInterval(holdInterval.current)
  }, [])

  useEffect(() => {
    const sync = (e) => { ctrlRef.current = e.ctrlKey }
    window.addEventListener('keydown', sync)
    window.addEventListener('keyup', sync)
    return () => {
      window.removeEventListener('keydown', sync)
      window.removeEventListener('keyup', sync)
      stop()
    }
  }, [stop])

  const onMouseDown = (e) => {
    if (disabledRef.current) return
    e.preventDefault()
    ctrlRef.current = e.ctrlKey
    onAddRef.current(ctrlRef.current ? 10 : 1)
    holdTimer.current = setTimeout(() => {
      holdInterval.current = setInterval(() => {
        if (disabledRef.current) { stop(); return }
        onAddRef.current(ctrlRef.current ? 10 : 1)
      }, 80)
    }, 400)
  }

  return { onMouseDown, onMouseUp: stop, onMouseLeave: stop }
}

export const SCHOOL_SLUG = { 金: 'jin', 木: 'mu', 水: 'shui', 火: 'huo', 土: 'tu' }

export const Seal = ({ children, size = 36, round = false, school, style = {}, ...rest }) => (
  <div
    className={
      'seal' +
      (round ? ' seal-round' : '') +
      (school ? ' seal-' + SCHOOL_SLUG[school] : '')
    }
    style={{ width: size, height: size, fontSize: Math.floor(size * 0.42), ...style }}
    {...rest}
  >
    {children}
  </div>
)

export const Placeholder = ({ label, sub, style = {}, className = '' }) => (
  <div className={'placeholder-box ' + className} style={style}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {label ? <span className="placeholder-label">{label}</span> : null}
      {sub ? <span style={{ fontSize: 10, opacity: 0.8 }}>{sub}</span> : null}
    </div>
  </div>
)

export const Bar = ({ value, max, type = 'hp', height = 8, showText = true }) => {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div style={{ position: 'relative' }}>
      <div className={'bar bar-' + type} style={{ height }}>
        <div className="bar-fill" style={{ width: pct + '%' }} />
      </div>
      {showText ? (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: 'var(--font-mono)',
          fontSize: Math.max(9, height - 1), color: 'var(--paper)',
          textShadow: '0 1px 0 rgba(0,0,0,.5)', letterSpacing: 0.5, lineHeight: 1,
        }}>
          {value.toLocaleString()} / {max.toLocaleString()}
        </div>
      ) : null}
    </div>
  )
}

export const CornerDeco = () => (
  <>
    {['tl', 'tr', 'bl', 'br'].map((p) => (
      <svg key={p} className={'corner-deco corner-' + p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M2 12 Q 2 2 12 2" />
        <path d="M2 8 Q 4 4 8 2" />
        <circle cx="5" cy="5" r="1" fill="currentColor" />
      </svg>
    ))}
  </>
)

export const Status = ({ kind = 'pos', glyph, title }) => (
  <span className={'buff-icon ' + (kind === 'pos' ? 'buff-pos' : 'buff-neg')} title={title}>
    {glyph}
  </span>
)

export const CloudDivider = ({ style = {} }) => <div className="cloud-divider" style={style} />

export const Taiji = ({ size = 28 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <circle cx="50" cy="50" r="48" fill="var(--paper)" stroke="var(--ink-2)" strokeWidth="1.5" />
    <path d="M50 2 A 48 48 0 0 1 50 98 A 24 24 0 0 1 50 50 A 24 24 0 0 0 50 2 Z" fill="var(--ink-2)" />
    <circle cx="50" cy="26" r="5" fill="var(--paper)" />
    <circle cx="50" cy="74" r="5" fill="var(--ink-2)" />
  </svg>
)

export const InkMountain = ({ style = {} }) => (
  <svg viewBox="0 0 400 120" preserveAspectRatio="none"
    style={{ position: 'absolute', inset: 'auto 0 0 0', width: '100%', height: 120, opacity: 0.18, pointerEvents: 'none', ...style }}>
    <path d="M0 100 L 40 70 L 70 85 L 110 50 L 140 80 L 180 40 L 220 85 L 260 60 L 300 90 L 340 55 L 380 80 L 400 70 L 400 120 L 0 120 Z" fill="var(--ink-2)" />
    <path d="M0 110 L 60 95 L 100 105 L 160 92 L 220 105 L 280 96 L 340 108 L 400 100 L 400 120 L 0 120 Z" fill="var(--ink)" opacity="0.6" />
  </svg>
)

export const PanelHead = ({ title, sub, right, onClose = true }) => (
  <div style={{
    position: 'absolute', left: 0, right: 0, top: 0, height: 54,
    padding: '0 22px', display: 'flex', alignItems: 'center', gap: 12,
    borderBottom: '1px solid var(--gold-2)', background: 'var(--paper-2)',
  }}>
    <div style={{ width: 4, height: 26, background: 'var(--vermilion)' }} />
    <div className="brush" style={{ fontSize: 22 }}>{title}</div>
    {sub ? (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 1.5 }}>
        {sub}
      </div>
    ) : null}
    <div style={{ flex: 1 }} />
    {right ? <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--ink-2)' }}>{right}</div> : null}
    {onClose ? <button className="btn-ink btn-ink-sm">关闭 ✕</button> : null}
  </div>
)

export const SubHead = ({ title, sub, right }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid rgba(106,90,68,0.3)' }}>
    <div className="brush" style={{ fontSize: 15, color: 'var(--vermilion)' }}>{title}</div>
    {sub ? <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: 1 }}>{sub}</div> : null}
    <div style={{ flex: 1 }} />
    {right}
  </div>
)

export const Cell = ({ label, value, accent, plus, sub }) => (
  <div className="cell" style={{ flexDirection: sub ? 'column' : 'row', alignItems: sub ? 'stretch' : 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
      <span className="cell-k">{label}</span>
      <span className="cell-v" style={accent ? { color: accent } : {}}>{value}</span>
      {plus ? <button className="cell-plus" onClick={plus}>＋</button> : null}
    </div>
    {sub ? <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{sub}</div> : null}
  </div>
)

export const Tag = ({ children, tone = 'vermilion', style = {} }) => {
  const colors = {
    vermilion: ['var(--vermilion)', 'var(--paper)'],
    gold:      ['var(--gold-2)',    'var(--paper)'],
    bamboo:    ['var(--bamboo)',    'var(--paper)'],
    ink:       ['var(--ink-2)',     'var(--paper)'],
    rust:      ['var(--rust)',      'var(--paper)'],
    ghost:     ['var(--paper)',     'var(--ink-2)'],
  }[tone] || ['var(--vermilion)', 'var(--paper)']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '1px 7px',
      fontSize: 10, fontFamily: 'var(--font-display)', letterSpacing: 1,
      background: colors[0], color: colors[1],
      border: '1px solid ' + (tone === 'ghost' ? 'var(--ink-3)' : colors[0]),
      whiteSpace: 'nowrap', ...style,
    }}>
      {children}
    </span>
  )
}
