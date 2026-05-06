import { useEffect } from 'react'

/**
 * 居中弹窗：点击遮罩或关闭按钮关闭（子元素需 stopPropagation 避免误关）
 */
export function Modal({
  title,
  open,
  onClose,
  children,
  wide = false,
  panelClassName = '',
  guofeng = false,
  hideHeader = false,
  bodyClassName,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const hasCustomMaxW = /\bmax-w-[^\s]+/.test(panelClassName)
  const baseMaxW = hasCustomMaxW ? '' : wide ? 'max-w-2xl' : 'max-w-md'
  const shell = guofeng ? 'rounded-xl' : 'rounded-lg border border-slate-700 bg-slate-900'
  const guofengCls = guofeng ? 'wd-modal--guofeng' : ''

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-3 backdrop-blur-[1px] ${
        guofeng ? 'bg-black/35' : 'bg-black/60'
      }`}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`flex max-h-[88vh] w-full flex-col overflow-hidden ${shell} shadow-xl ${baseMaxW} ${guofengCls} ${panelClassName}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader && (
          <header
            className={`flex shrink-0 items-center justify-between gap-2 px-3 py-2 ${
              guofeng ? '' : 'border-b border-slate-800 bg-slate-950/80'
            }`}
          >
            <h2
              id="modal-title"
              className={guofeng ? 'text-base font-bold' : 'text-sm font-medium text-amber-100/95'}
            >
              {title}
            </h2>
            <button
              type="button"
              className={`rounded px-2 py-1 text-sm ${
                guofeng ? 'hover:bg-amber-100/40' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              onClick={onClose}
              aria-label="关闭"
            >
              ×
            </button>
          </header>
        )}
        <div
          className={
            bodyClassName ??
            `min-h-0 flex-1 overflow-y-auto p-3 text-sm ${guofeng ? 'text-[#3a3a38]' : 'text-slate-300'}`
          }
        >
          {children}
        </div>
      </div>
    </div>
  )
}
