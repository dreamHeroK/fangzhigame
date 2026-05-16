import React from 'react'
import { Seal, CornerDeco, PanelHead, Tag } from './common.jsx'

const items = [
  { id: 'qiyelian', n: '七叶莲', qty: 23, q: 'common', t: 'T2', k: 'HP +1,000', glyph: '莲', note: 'Lv30-60 中期补血药', selected: true },
  { id: 'qisehua', n: '七色花', qty: 8, q: 'common', t: 'T2', k: 'HP +1,500', glyph: '花' },
  { id: 'buqidan', n: '补气丹', qty: 17, q: 'common', t: 'T2', k: 'MP +1,200', glyph: '丹' },
  { id: 'yunxiang', n: '云香精', qty: 6, q: 'common', t: 'T2', k: 'MP +1,500', glyph: '香' },
  { id: 'jinchuang', n: '金创药', qty: 4, q: 'rare', t: 'T3', k: 'HP +3,000', glyph: '药' },
  { id: 'huishen', n: '回神丹', qty: 3, q: 'rare', t: 'T3', k: 'MP +2,500', glyph: '神' },
  { id: 'xueling', n: '血玲珑', q: 'epic', t: '玲珑', k: '补满·12.84M/20M', glyph: '血' },
  { id: 'faling', n: '法玲珑', q: 'epic', t: '玲珑', k: '补满·18.42M/20M', glyph: '法' },
  { id: 'zhixue', n: '止血草', qty: 32, q: 'common', t: 'T1', k: 'HP +100', glyph: '草' },
  { id: 'baiguo', n: '白果', qty: 28, q: 'common', t: 'T1', k: 'MP +80', glyph: '果' },
  { id: 'yiyecao', n: '一叶草', qty: 11, q: 'common', t: 'T1', k: 'HP +200', glyph: '叶' },
  { id: 'shedan', n: '蛇胆', qty: 5, q: 'common', t: 'T1', k: 'MP +150', glyph: '胆' },
  { id: 'shuxin', n: '舒心丸', qty: 2, q: 'rare', t: 'T3', k: 'MP +3,000', glyph: '舒' },
  { id: 'renshen', n: '人参', qty: 1, q: 'epic', t: 'T4', k: 'HP +10,000', glyph: '参' },
  { id: 'skbook', n: '技书残页', qty: 18, q: 'rare', t: '材', k: '升技消耗', glyph: '书' },
  { id: 'shumen', n: '蜀山令牌', qty: 1, q: 'legend', t: '任', k: '任务道具', glyph: '令' },
  null, null, null, null, null, null, null, null,
]

export default function BagScreen() {
  const selected = items.find((i) => i?.selected)
  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead
        title="行 装 · 锦囊"
        sub="INVENTORY"
        right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>负重 <span style={{ color: 'var(--vermilion)', fontWeight: 600 }}>22</span> / 60 格</span>}
      />
      <div style={{ position: 'absolute', inset: '60px 18px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="tab-list" style={{ flexWrap: 'wrap' }}>
          {['全部 16', '丹药 12', '玲珑 2', '材料 1', '任务 1'].map((t, i) => (
            <div key={t} className={'tab' + (i === 0 ? ' active' : '')} style={{ padding: '4px 12px', fontSize: 11 }}>{t}</div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          战斗胜利自动入包；战斗中「道具」消耗药品。点击格子选中为战斗用药。玲珑独占一格、额度独立。
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, flex: '0 0 auto' }}>
          {items.map((it, i) => (
            it ? (
              <div key={i} className={'slot q-' + it.q} style={{
                aspectRatio: '1', padding: 4, flexDirection: 'column', gap: 1,
                background: it.selected ? '#fff8ea' : undefined,
                borderColor: it.selected ? 'var(--vermilion)' : undefined,
                boxShadow: it.selected ? '0 0 0 2px rgba(163,55,58,0.2)' : undefined,
              }}>
                <div style={{ position: 'absolute', top: 2, left: 3, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ink-4)' }}>{it.t}</div>
                <Seal size={22} round style={{ marginTop: 6 }}>{it.glyph}</Seal>
                <span className="brush" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{it.n}</span>
                {it.qty ? <span className="slot-count">×{it.qty}</span> : null}
              </div>
            ) : <div key={i} className="slot slot-empty" style={{ aspectRatio: '1' }}>空</div>
          ))}
        </div>
        {selected ? (
          <div className="paper-bg scroll-frame" style={{ padding: 14, position: 'relative', display: 'flex', gap: 14 }}>
            <CornerDeco />
            <div className={'slot q-' + selected.q} style={{ width: 76, height: 76, flexShrink: 0, flexDirection: 'column', gap: 2 }}>
              <Seal size={32} round>{selected.glyph}</Seal>
              <span className="brush" style={{ fontSize: 11 }}>{selected.n}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="brush" style={{ fontSize: 18, color: 'var(--ink)' }}>{selected.n}</span>
                <Tag tone="gold">{selected.t}</Tag>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{selected.k}</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.7, textIndent: '2em' }}>
                {selected.note} — 单口回复 1,000 气血。携带轻便，常作为群秒期主药。
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <button className="btn-ink btn-ink-primary btn-ink-sm">使 用</button>
              <button className="btn-ink btn-ink-sm">设为药</button>
              <button className="btn-ink btn-ink-sm">丢 弃</button>
            </div>
          </div>
        ) : null}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 10, borderTop: '1px solid var(--ink-4)' }}>
          <button className="btn-ink btn-ink-sm">上一页</button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--ink-2)', minWidth: 70, textAlign: 'center' }}>1 / 2</span>
          <button className="btn-ink btn-ink-sm">下一页</button>
        </div>
      </div>
    </div>
  )
}
