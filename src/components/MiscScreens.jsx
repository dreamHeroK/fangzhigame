import React, { useState, useEffect, useSyncExternalStore } from 'react'
import { Seal, PanelHead, SubHead, Tag, CornerDeco, Bar } from './common.jsx'
import { subscribe, getSnapshot, buyShopItemAction, setPendingShuadaoAction, setMapAction, acceptQuestAction, claimQuestAction, progressVisitQuestAction, computePartyHealInfo, healPartyAtNpcAction, claimGuideEquipAction, claimCdkAction } from '../game/characterStore.js'
import { TIANSHU_DEFS, TIANSHU_QUALITY } from '../game/battle/tianShu.js'
import { SHUADAO_TYPES, SHUADAO_ORDER } from '../game/shuadao.js'
import { WENDAO_MAPS, MAP_TYPES, inferSpawnElement } from '../game/battle/wendaoMapsConfig.js'
import { MAIN_QUESTS, SIDE_QUESTS, TOWN_QUESTS, getNpcsForMap, getQuestsForNpc, NPC_ROLES } from '../game/quests/questData.js'
import { getQuestStatus, QS } from '../game/quests/questEngine.js'

// ───── 日常任务（静态演示） ─────
const DAILY_TASKS = [
  { tag: '师门', title: '完成一场战斗', done: true,  reward: '银两 +320 · 潜能 +60',    desc: '击败任意野怪一次。',                                                progress: '1/1'  },
  { tag: '修山', title: '组队击败世界 BOSS', done: false, reward: '银两 +2,400 · 道行 +1天',  desc: '需 ≥3 人组队挑战 羊头怪 / 牛头怪 / 百年黑熊精 等。',               progress: '0/1'  },
  { tag: '日常', title: '捕捉 1 只野生宠',  done: false, reward: '银两 +800 · 潜能 +120',    desc: '在 桃柳林 / 轩辕庙 / 五龙窟 捕捉，血量 ≤30% 概率最高。',            progress: '0/1'  },
  { tag: '日常', title: '使用药品 10 次',   done: false, reward: '解锁 仙法疗伤',             desc: '战斗中累计使用消耗品。',                                             progress: '4/10' },
  { tag: '师门', title: '百战淬炼：击败 50 只野怪', done: false, reward: '解锁 力破千钧',   desc: '累计击败野怪进度计算。',                                             progress: '32/50'},
  { tag: '活动', title: '中秋·夜话灯谜',   done: false, reward: '仙玉 +20 · 月饼礼盒',     desc: '活动期间每日 19:00 开启。',                                          progress: '0/5', event: true },
]

const DailyQuestRow = ({ t }) => {
  const tone = { 师门: 'vermilion', 修山: 'ink', 日常: 'rust', 活动: 'bamboo' }[t.tag] || 'ink'
  return (
    <div style={{
      padding: 10,
      background: t.done ? 'rgba(106,138,122,0.08)' : 'rgba(243,237,224,0.65)',
      border: '1px solid ' + (t.done ? 'var(--bamboo)' : 'var(--ink-4)'),
      opacity: t.done ? 0.85 : 1,
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <Tag tone={tone} style={{ fontSize: 11, padding: '2px 8px', marginTop: 2 }}>{t.tag}</Tag>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="brush" style={{ fontSize: 15, color: t.done ? 'var(--ink-3)' : 'var(--ink)', textDecoration: t.done ? 'line-through' : 'none' }}>
            {t.title}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>{t.progress}</span>
          {t.event ? <Seal size={16} round style={{ fontSize: 9, background: 'var(--rust)', boxShadow: 'inset 0 0 0 2px var(--paper), inset 0 0 0 3px var(--rust)' }}>庆</Seal> : null}
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.6 }}>{t.desc}</p>
        <div style={{ marginTop: 3, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold-2)' }}>奖 · {t.reward}</div>
      </div>
      <button className="btn-ink btn-ink-sm" disabled={!t.done && t.tag !== '活动'} style={{ flexShrink: 0 }}>
        {t.done ? '领取' : '前往'}
      </button>
    </div>
  )
}

// ───── 任务行（主线/支线） ─────
const QS_INFO = {
  locked:    { label: '未解锁', color: 'var(--ink-4)' },
  available: { label: '可接取', color: 'var(--bamboo)' },
  active:    { label: '进行中', color: 'var(--gold-2)' },
  claimable: { label: '可领取', color: 'var(--vermilion)' },
  done:      { label: '已完成', color: 'var(--ink-3)' },
}

function QuestRow({ quest, status, questLog, onAccept, onClaim }) {
  const obj     = quest.objectives[0]
  const entry   = questLog?.[quest.id]
  const progress = entry?.progress ?? 0
  const count   = obj?.count ?? 1
  const isLocked = status === QS.LOCKED
  const isDone   = status === QS.DONE
  const si = QS_INFO[status] ?? { label: '?', color: 'var(--ink-3)' }
  const r  = quest.reward
  const rewardParts = [
    r.exp      ? `经验 +${r.exp.toLocaleString()}`  : '',
    r.gold     ? `银两 +${r.gold.toLocaleString()}` : '',
    r.daoDays  ? `道行 +${r.daoDays}天`            : '',
    r.potential? `潜能 +${r.potential}`            : '',
  ].filter(Boolean)

  return (
    <div style={{
      padding: 10, display: 'flex', gap: 10, alignItems: 'flex-start',
      background: isDone ? 'rgba(106,138,122,0.08)' : 'rgba(243,237,224,0.65)',
      border: `1px solid ${status === QS.CLAIMABLE ? 'var(--vermilion)' : status === QS.ACTIVE ? 'var(--gold-2)' : 'var(--ink-4)'}`,
      opacity: isLocked ? 0.55 : isDone ? 0.75 : 1,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span className="brush" style={{ fontSize: 15, color: isDone ? 'var(--ink-3)' : 'var(--ink)', textDecoration: isDone ? 'line-through' : 'none' }}>
            {quest.title}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: si.color }}>{si.label}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)' }}>Lv{quest.levelReq}</span>
        </div>
        {obj && (
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            {obj.label}{(status === QS.ACTIVE || status === QS.CLAIMABLE) ? `（${progress}/${count}）` : ''}
          </p>
        )}
        {!isLocked && !isDone && (rewardParts.length > 0 || r.items?.length > 0 || r.pet) && (
          <div style={{ marginTop: 2, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold-2)', lineHeight: 1.7 }}>
            {rewardParts.length > 0 && <div>奖 · {rewardParts.join('　')}</div>}
            {r.items?.length > 0 && (
              <div style={{ color: 'var(--bamboo)' }}>
                物品 · {r.items.map(it => {
                  const names = { xiao_huanhun: '小还魂丹', zhong_huanhun: '中还魂丹', da_huanhun: '大还魂丹',
                    xiao_juling: '小聚灵丹', zhong_juling: '中聚灵丹', da_juling: '大聚灵丹',
                    qianghuashi: '强化石', heishuijing: '黑水晶' }
                  return `${names[it.itemId] ?? it.itemId} ×${it.qty}`
                }).join('　')}
              </div>
            )}
            {r.pet && (
              <div style={{ color: '#c87820' }}>宠物 · {r.pet.label ?? r.pet.spawnKey}（宝宝）</div>
            )}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ink-4)', maxWidth: 80, textAlign: 'right', lineHeight: 1.3 }}>{quest.chapter}</span>
        {status === QS.AVAILABLE && (
          <button className="btn-ink btn-ink-sm" onClick={() => onAccept(quest.id)} style={{ fontSize: 11 }}>接 受</button>
        )}
        {status === QS.CLAIMABLE && (
          <button className="btn-ink btn-ink-primary btn-ink-sm" onClick={() => onClaim(quest.id)} style={{ fontSize: 11 }}>领 取</button>
        )}
        {isDone && <span style={{ color: 'var(--bamboo)', fontSize: 16 }}>✓</span>}
      </div>
    </div>
  )
}

// ───── 刷道任务卡片 ─────
function ShuadaoCard({ typeId, typeDef, onStart }) {
  return (
    <div style={{
      padding: '12px 16px',
      background: 'var(--paper-1, rgba(243,237,224,0.9))',
      border: `1.5px solid ${typeDef.color}`,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      {/* 左侧色条 */}
      <div style={{ width: 3, alignSelf: 'stretch', background: typeDef.color, flexShrink: 0, borderRadius: 2 }} />

      {/* 内容区 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Tag tone={typeDef.tagColor} style={{ fontSize: 11, padding: '1px 8px', flexShrink: 0 }}>{typeDef.tag}</Tag>
          <span className="brush" style={{ fontSize: 17, color: typeDef.color, lineHeight: 1.2 }}>{typeDef.label}</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--ink)', lineHeight: 1.55 }}>{typeDef.desc}</p>
        <div style={{ marginTop: 3, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-2)' }}>
          对阵 · {typeDef.enemyDesc}
        </div>
      </div>

      {/* 出发按钮 */}
      <button
        className="btn-ink"
        style={{
          flexShrink: 0,
          padding: '8px 18px',
          fontSize: 14,
          border: `1.5px solid ${typeDef.color}`,
          color: typeDef.color,
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.1em',
        }}
        onClick={() => onStart(typeId)}
      >
        出发
      </button>
    </div>
  )
}

export function QuestScreen({ navigate }) {
  const char = useSyncExternalStore(subscribe, getSnapshot)
  const [tab, setTab] = useState('shuadao')
  const [questMsg, setQuestMsg] = useState(null)

  function handleStart(typeId) {
    setPendingShuadaoAction(typeId)
    navigate?.('combat')
  }

  function handleAccept(questId) {
    const res = acceptQuestAction(questId)
    setQuestMsg(res.ok ? { ok: true, text: '任务已接受' } : { ok: false, text: '无法接受任务' })
    setTimeout(() => setQuestMsg(null), 2000)
  }

  function handleClaim(questId) {
    const res = claimQuestAction(questId)
    if (res.ok) {
      const r = res.rewards
      const parts = [
        r.exp      ? `经验 +${r.exp.toLocaleString()}`  : '',
        r.gold     ? `银两 +${r.gold.toLocaleString()}` : '',
        r.daoDays  ? `道行 +${r.daoDays}天`            : '',
        r.potential? `潜能 +${r.potential}`            : '',
        ...(r.items ?? []).map(it => {
          const nm = { xiao_huanhun:'小还魂丹', zhong_huanhun:'中还魂丹', da_huanhun:'大还魂丹',
            xiao_juling:'小聚灵丹', zhong_juling:'中聚灵丹', da_juling:'大聚灵丹',
            qianghuashi:'强化石', heishuijing:'黑水晶' }
          return `${nm[it.itemId] ?? it.itemId} ×${it.qty}`
        }),
        res.rewardedPet ? `获得宠物「${res.rewardedPet.displayName}」` : '',
      ].filter(Boolean)
      setQuestMsg({ ok: true, text: `奖励已领取：${parts.join('　')}` })
    } else {
      setQuestMsg({ ok: false, text: '无法领取奖励' })
    }
    setTimeout(() => setQuestMsg(null), 4000)
  }

  const questLog  = char.questLog ?? {}
  const charLevel = char.level ?? 1
  const mainList = MAIN_QUESTS.map(q => ({ quest: q, status: getQuestStatus(q, questLog, charLevel) }))
  const sideList = SIDE_QUESTS.map(q => ({ quest: q, status: getQuestStatus(q, questLog, charLevel) }))
  const townList = TOWN_QUESTS.map(q => ({ quest: q, status: getQuestStatus(q, questLog, charLevel) }))

  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead title="任 务 簿" sub="QUEST JOURNAL"
        right={
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>
            道行 <span style={{ color: 'var(--gold-2)', fontWeight: 700 }}>{char.daoYears ?? 0}</span> 年
            <span style={{ color: 'var(--ink-3)' }}> {char.daoDays ?? 0} 天</span>
          </span>
        }
      />
      <div style={{ position: 'absolute', inset: '60px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="tab-list">
          {[['shuadao', '刷  道'], ['main', '主  线'], ['side', '支  线'], ['town', '城镇委托'], ['daily', '日常任务']].map(([id, label]) => (
            <div key={id} className={'tab' + (tab === id ? ' active' : '')} style={{ padding: '4px 16px', cursor: 'pointer' }} onClick={() => setTab(id)}>{label}</div>
          ))}
        </div>

        {questMsg && (
          <div style={{
            flexShrink: 0, padding: '5px 12px',
            background: questMsg.ok ? 'rgba(45,138,45,0.12)' : 'rgba(163,55,58,0.12)',
            border: `1px solid ${questMsg.ok ? 'var(--bamboo)' : 'var(--vermilion)'}`,
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: questMsg.ok ? 'var(--bamboo)' : 'var(--vermilion)',
          }}>{questMsg.text}</div>
        )}

        {tab === 'main' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto' }}>
            {mainList.map(({ quest, status }) => (
              <QuestRow key={quest.id} quest={quest} status={status} questLog={questLog}
                onAccept={handleAccept} onClaim={handleClaim} />
            ))}
          </div>
        )}

        {tab === 'side' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto' }}>
            {sideList.map(({ quest, status }) => (
              <QuestRow key={quest.id} quest={quest} status={status} questLog={questLog}
                onAccept={handleAccept} onClaim={handleClaim} />
            ))}
          </div>
        )}

        {tab === 'town' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto' }}>
            <div style={{ flexShrink: 0, padding: '6px 10px', background: 'var(--paper-2)', border: '1px solid var(--ink-4)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              城镇委托由各主城 NPC 发布，在世界地图进入对应城镇后可向 NPC 接取。
            </div>
            {townList.map(({ quest, status }) => (
              <QuestRow key={quest.id} quest={quest} status={status} questLog={questLog}
                onAccept={handleAccept} onClaim={handleClaim} />
            ))}
          </div>
        )}

        {tab === 'daily' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto' }}>
            {DAILY_TASKS.map((t, i) => <DailyQuestRow key={i} t={t} />)}
          </div>
        )}

        {tab === 'shuadao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflow: 'auto' }}>
            <div style={{ padding: '8px 12px', background: 'var(--paper-2)', border: '1px solid var(--ink-4)', fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.7, flexShrink: 0 }}>
              <span className="brush" style={{ fontSize: 13, color: 'var(--ink)', marginRight: 8 }}>刷道说明</span>
              选择任务后进入<span style={{ color: 'var(--gold-2)' }}>真实战斗</span>，敌方为随机命名的山贼/妖兽/魔头。
              战斗胜利奖励经验、道行与潜能；可无限次挑战。
            </div>
            {SHUADAO_ORDER.map(typeId => {
              const typeDef = SHUADAO_TYPES[typeId]
              return (
                <ShuadaoCard
                  key={typeId}
                  typeId={typeId}
                  typeDef={typeDef}
                  onStart={handleStart}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ───── 商城 ─────
const SHOP_ROWS = [
  { id: 'xiao_huanhun',  n: '小还魂丹',  qty: 10, price: 120,    k: 'T1 · HP +300',                   glyph: '还', special: false },
  { id: 'xiao_juling',   n: '小聚灵丹',  qty: 10, price: 100,    k: 'T1 · MP +200',                   glyph: '聚', special: false },
  { id: 'zhong_huanhun', n: '中还魂丹',  qty: 5,  price: 800,    k: 'T2 · HP +1500',                  glyph: '中', special: false },
  { id: 'zhong_juling',  n: '中聚灵丹',  qty: 5,  price: 700,    k: 'T2 · MP +1000',                  glyph: '中', special: false },
  { id: 'da_huanhun',    n: '大还魂丹',  qty: 3,  price: 2500,   k: 'T3 · HP +6000',                  glyph: '大', special: false },
  { id: 'da_juling',     n: '大聚灵丹',  qty: 3,  price: 2200,   k: 'T3 · MP +4000',                  glyph: '大', special: false },
  { id: 'qianghuashi',   n: '强化石',    qty: 5,  price: 3000,   k: '装备强化材料 · 每次强化消耗 1 颗', glyph: '石', special: false },
  { id: 'heishuijing',   n: '黑水晶',    qty: 1,  price: 999999, k: '吸取装备一条随机额外属性',         glyph: '黑', special: true },
]

const TIANSHU_PRICES = {
  ts_mogu: 40000, ts_kuangbao: 50000, ts_lieyian: 38000, ts_potian: 48000,
  ts_fanji: 42000, ts_nuji: 42000, ts_jiangmozhan: 55000, ts_xiuluoshu: 55000,
  ts_yunti: 45000, ts_xianfeng: 60000, ts_jinzhong: 35000,
  tianshu_super: 180000,
}

const TRIGGER_COLOR = {
  on_physical_hit: 'var(--rust)',
  on_magic_hit:    '#3a5a8a',
  on_hit_taken:    'var(--bamboo)',
  passive:         '#8a6a2a',
}

function ShopRow({ row, tael, onBuy }) {
  const canAfford = tael >= row.price * row.qty
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: 8,
      background: row.special ? 'rgba(106,61,138,0.07)' : 'rgba(243,237,224,0.7)',
      border: `1px solid ${row.special ? '#6a3d8a' : 'var(--ink-4)'}`,
    }}>
      <div className="slot q-common" style={{ width: 46, height: 46, flex: '0 0 46px', borderColor: row.special ? '#6a3d8a' : undefined }}>
        <Seal size={22} round style={row.special ? { background: '#6a3d8a' } : {}}>{row.glyph}</Seal>
      </div>
      <div style={{ flex: 1 }}>
        <div className="brush" style={{ fontSize: 15, color: row.special ? '#6a3d8a' : 'var(--ink)' }}>{row.n} ×{row.qty}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>{row.k}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <button
          className="btn-ink btn-ink-primary"
          disabled={!canAfford}
          style={row.special ? { background: '#6a3d8a', borderColor: '#6a3d8a' } : {}}
          onClick={() => onBuy(row)}
        >
          {(row.price * row.qty).toLocaleString()} 银两 · 购买
        </button>
        {!canAfford && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--vermilion)', marginTop: 2 }}>银两不足</div>}
      </div>
    </div>
  )
}

export function ShopScreen() {
  const char = useSyncExternalStore(subscribe, getSnapshot)
  const [msg, setMsg] = useState(null)
  const [shopTab, setShopTab] = useState(0) // 0=消耗品 1=天书

  function handleBuy(row) {
    const res = buyShopItemAction(row.id, row.qty)
    setMsg({ text: res.ok ? `购买成功：${row.n} ×${row.qty}` : (res.reason ?? '购买失败'), ok: res.ok })
    setTimeout(() => setMsg(null), 2500)
  }

  function handleBuyTianShu(def) {
    const price = TIANSHU_PRICES[def.id]
    const res = buyShopItemAction(def.id, 1)
    setMsg({ text: res.ok ? `购买成功：${def.name}` : (res.reason ?? '购买失败'), ok: res.ok })
    setTimeout(() => setMsg(null), 2500)
  }

  const tael = char.tael ?? 0
  const bag = char.bag ?? []

  const TAB_STYLE = (active) => ({
    padding: '4px 14px', fontFamily: 'var(--font-brush)', fontSize: 13, cursor: 'pointer',
    background: active ? 'var(--vermilion)' : 'var(--paper-2)',
    color: active ? 'var(--paper)' : 'var(--ink-2)',
    border: `1px solid ${active ? 'var(--vermilion)' : 'var(--ink-4)'}`,
  })

  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead title="商 城" sub="SHOP · 银两专卖"
        right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>银两 <span style={{ color: 'var(--gold-2)', fontWeight: 700 }}>{tael.toLocaleString()}</span></span>}
      />
      <div style={{ position: 'absolute', inset: '60px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* 银两栏 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--paper-2)', border: '1px solid var(--gold-2)', flexShrink: 0 }}>
          <Seal size={34} style={{ background: 'var(--gold-2)', boxShadow: 'inset 0 0 0 2px var(--paper), inset 0 0 0 3px var(--gold-2)' }}>银</Seal>
          <div>
            <div className="brush" style={{ fontSize: 20, color: 'var(--gold-2)', lineHeight: 1 }}>{tael.toLocaleString()} 银两</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>TAEL · 战斗 + 出售装备获得</div>
          </div>
          <span style={{ flex: 1 }} />
          <button className="btn-ink btn-ink-sm">仙玉商城</button>
        </div>

        {/* 标签切换 */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button style={TAB_STYLE(shopTab === 0)} onClick={() => setShopTab(0)}>消耗品</button>
          <button style={TAB_STYLE(shopTab === 1)} onClick={() => setShopTab(1)}>宠物天书</button>
        </div>

        {/* 消息提示 */}
        {msg && (
          <div style={{
            flexShrink: 0, padding: '5px 12px',
            background: msg.ok ? 'rgba(45,138,45,0.12)' : 'rgba(163,55,58,0.12)',
            border: `1px solid ${msg.ok ? 'var(--bamboo)' : 'var(--vermilion)'}`,
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: msg.ok ? 'var(--bamboo)' : 'var(--vermilion)',
          }}>
            {msg.text}
          </div>
        )}

        {/* 消耗品列表 */}
        {shopTab === 0 && (
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SHOP_ROWS.map((r) => <ShopRow key={r.id} row={r} tael={tael} onBuy={handleBuy} />)}
            <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              黑水晶：在背包选中后可吸取任意装备的一条额外属性，永久转化为角色加成。
            </p>
          </div>
        )}

        {/* 天书列表 */}
        {shopTab === 1 && (
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ padding: '6px 10px', background: 'rgba(163,140,80,0.08)', border: '1px solid #9a6a2a', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.7 }}>
              天书装备后给宠物触发型技能 · 每本 +6000 灵气（上限 30000）· 每只宠最多 3 本 · 同种不可重复 · 开书随机白/蓝/金品质 · 超级天书必得金色
            </div>
            {/* 超级天书盒 */}
            {(() => {
              const price = TIANSHU_PRICES['tianshu_super']
              const canAfford = tael >= price
              const owned = bag.find(e => e.itemId === 'tianshu_super')?.qty ?? 0
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 8,
                  background: 'rgba(200,160,32,0.08)', border: '1px solid var(--gold-2)',
                }}>
                  <div className="slot q-rare" style={{ width: 46, height: 46, flex: '0 0 46px', borderColor: 'var(--gold-2)' }}>
                    <Seal size={22} round style={{ background: 'var(--gold-2)' }}>超</Seal>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="brush" style={{ fontSize: 15, color: 'var(--gold-2)' }}>超级天书 {owned > 0 && <span style={{ fontSize: 11 }}>（背包 ×{owned}）</span>}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>必得金色天书（随机类型）· 金色天书有 5 条基础属性 · 触发概率+10%</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <button className="btn-ink btn-ink-primary" disabled={!canAfford} style={{ borderColor: 'var(--gold-2)' }}
                      onClick={() => { const res = buyShopItemAction('tianshu_super', 1); setMsg({ text: res.ok ? '购买成功：超级天书' : (res.reason ?? '失败'), ok: res.ok }); setTimeout(() => setMsg(null), 2500) }}>
                      {price.toLocaleString()} 银两
                    </button>
                    {!canAfford && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--vermilion)', marginTop: 2 }}>银两不足</div>}
                  </div>
                </div>
              )
            })()}
            {/* 普通天书（11种） */}
            {TIANSHU_DEFS.map((def) => {
              const price = TIANSHU_PRICES[def.id]
              const canAfford = tael >= price
              const owned = bag.find(e => e.itemId === def.id)?.qty ?? 0
              const trigColor = TRIGGER_COLOR[def.trigger] ?? 'var(--ink-2)'
              return (
                <div key={def.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 8,
                  background: 'rgba(243,237,224,0.7)', border: '1px solid var(--ink-4)',
                }}>
                  <div className="slot q-common" style={{ width: 46, height: 46, flex: '0 0 46px' }}>
                    <Seal size={22} round style={{ background: trigColor }}>{def.glyph}</Seal>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="brush" style={{ fontSize: 15 }}>{def.name}天书</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: trigColor, border: `1px solid ${trigColor}`, padding: '0 4px' }}>{def.triggerDesc}</span>
                      {owned > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold-2)' }}>背包×{owned}</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>{def.desc}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <button className="btn-ink btn-ink-primary" disabled={!canAfford}
                      onClick={() => handleBuyTianShu(def)}>
                      {price.toLocaleString()} 银两
                    </button>
                    {!canAfford && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--vermilion)', marginTop: 2 }}>银两不足</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ───── 签到 ─────
export function SignScreen() {
  const days = [
    { d: 1, r: '止血草×2', q: 'common', got: true },
    { d: 2, r: '白果×1', q: 'common', got: true },
    { d: 3, r: '银两+88', q: 'common', got: true },
    { d: 4, r: '七叶莲×1', q: 'rare', got: true },
    { d: 5, r: '潜能+50', q: 'rare', got: true },
    { d: 6, r: '银两+200', q: 'rare', got: true },
    { d: 7, r: '金创药×1', q: 'epic', today: true },
  ]
  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead title="签 到" sub="DAILY"
        right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>连签 <span style={{ color: 'var(--vermilion)', fontWeight: 700 }}>7</span> 天</span>}
      />
      <div style={{ position: 'absolute', inset: '60px 22px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {days.map((s) => (
            <div key={s.d} style={{
              position: 'relative', padding: '10px 4px',
              background: s.today ? 'linear-gradient(180deg, #fff8ea 0%, var(--paper-2) 100%)' : 'var(--paper-3)',
              border: '1px solid ' + (s.today ? 'var(--vermilion)' : (s.got ? 'var(--bamboo)' : 'var(--ink-4)')),
              opacity: s.got && !s.today ? 0.7 : 1, textAlign: 'center',
              boxShadow: s.today ? '0 0 0 2px rgba(163,55,58,0.18)' : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: 1 }}>DAY {s.d}</div>
              <div style={{ marginTop: 8 }}>
                <Seal size={28} round>{s.r[0]}</Seal>
              </div>
              <div className="brush" style={{ fontSize: 11, color: 'var(--ink)', marginTop: 4, lineHeight: 1.2 }}>{s.r}</div>
              {s.got && !s.today ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bamboo)', fontSize: 36, fontWeight: 700, textShadow: '0 0 6px rgba(106,138,122,0.5)' }}>✓</div>
              ) : null}
              {s.today ? (
                <div style={{ position: 'absolute', bottom: 3, right: 4 }}>
                  <Tag tone="vermilion" style={{ fontSize: 9, padding: '1px 5px' }}>今日</Tag>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <button className="btn-ink btn-ink-primary" style={{ padding: '12px 0', fontSize: 16, letterSpacing: '0.2em' }}>
          每 日 签 到 · 领第 7 日奖励
        </button>
        <div style={{ padding: 12, background: 'var(--paper-2)', border: '1px solid var(--ink-4)', fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.7 }}>
          <span className="brush" style={{ fontSize: 12, color: 'var(--vermilion)' }}>奖赏说明</span>：
          银两 +88 · 止血草 ×2 · 白果 ×1。连续 7 天可额外领取金创药 ×1。
        </div>
      </div>
    </div>
  )
}

// ───── 世界地图 ─────

const ELEM_SCHOOL = { 火: '火', 冰: '水', 水: '水', 木: '木', 金: '金', 土: '土', 暗: null, 无: null }

function MapNode({ map, isActive, isSelected, charLevel, onClick }) {
  const [lo, hi] = map.levelRange
  const inRange  = charLevel >= lo && charLevel <= hi
  const tooHigh  = charLevel < lo
  const isCity   = map.type === '城镇'
  const typeConf = MAP_TYPES[map.type] ?? MAP_TYPES['野外']
  const color    = isActive ? 'var(--vermilion)' : isSelected ? 'var(--gold)' : tooHigh ? 'var(--ink-4)' : typeConf.color
  const nodeSize = isCity ? (isSelected ? 16 : 14) : isActive ? 13 : isSelected ? 11 : inRange ? 10 : 8

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: map.pos.x + '%',
        top:  map.pos.y + '%',
        transform: 'translate(-50%, -100%)',
        cursor: 'pointer',
        zIndex: isActive ? 10 : isSelected ? 8 : isCity ? 6 : inRange ? 4 : 2,
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-body)', fontWeight: isCity || isActive || inRange ? 600 : 400,
          fontSize: isCity ? (isSelected ? 13 : 12) : isActive ? 13 : isSelected ? 12 : inRange ? 11 : 10,
          color,
          textShadow: '0 1px 0 rgba(243,237,224,0.9), 1px 0 0 rgba(243,237,224,0.9)',
          whiteSpace: 'nowrap', lineHeight: 1.2, marginBottom: 2,
        }}>
          {isCity ? `【${map.name}】` : map.name}
        </div>
        {!isCity && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: tooHigh ? 'var(--ink-4)' : 'var(--ink-3)', marginBottom: 3 }}>
            {lo}-{hi}
          </div>
        )}
        <div style={{ position: 'relative' }}>
          {isCity ? (
            <div style={{
              width: nodeSize, height: nodeSize,
              background: color,
              border: `2px solid rgba(243,237,224,0.9)`,
              boxShadow: `0 1px 4px rgba(0,0,0,0.3), 0 0 0 1px ${color}, 0 0 8px ${color}40`,
              borderRadius: '50%',
            }} />
          ) : (
            <div style={{
              width: nodeSize, height: nodeSize,
              background: color,
              border: `1.5px solid rgba(243,237,224,0.8)`,
              boxShadow: `0 1px 3px rgba(0,0,0,0.25), 0 0 0 1px ${color}`,
              transform: 'rotate(45deg)',
            }} />
          )}
          {isActive && (
            <div style={{
              position: 'absolute', inset: isCity ? -6 : -8,
              border: '1.5px solid var(--vermilion)',
              borderRadius: isCity ? '50%' : 2,
              animation: 'pulse2 1.6s ease-in-out infinite',
            }} />
          )}
          {isCity && isSelected && (
            <div style={{
              position: 'absolute', inset: -5,
              border: `1.5px solid ${color}`,
              borderRadius: '50%',
              opacity: 0.5,
            }} />
          )}
        </div>
      </div>
    </div>
  )
}

export function WorldMapScreen({ navigate }) {
  const char = useSyncExternalStore(subscribe, getSnapshot)
  const activeMapId   = char.currentMapId ?? 'wulong_ku'
  const [selectedId, setSelectedId] = useState(activeMapId)
  const [selectedNpcId, setSelectedNpcId] = useState(null)
  const selectedMap   = WENDAO_MAPS.find(m => m.id === selectedId) ?? WENDAO_MAPS[0]
  const activeMap     = WENDAO_MAPS.find(m => m.id === activeMapId)
  const charLevel     = char.level ?? 1
  const isAtSelected  = selectedId === activeMapId

  const npcsOnMap  = getNpcsForMap(selectedId)
  const selectedNpc = npcsOnMap.find(n => n.id === selectedNpcId) ?? null
  const npcQuests  = selectedNpc
    ? getQuestsForNpc(selectedNpc.id).map(q => ({ quest: q, status: getQuestStatus(q, char.questLog ?? {}, charLevel) }))
    : []

  useEffect(() => { setSelectedNpcId(null) }, [selectedId])

  const [npcMsg, setNpcMsg] = useState(null)
  const [healInfo, setHealInfo] = useState(null)
  const [cdkInput, setCdkInput] = useState('')

  // 每次切换到治疗师 NPC 时刷新治疗面板数据
  useEffect(() => {
    if (selectedNpc?.role === 'healer') setHealInfo(computePartyHealInfo())
    else setHealInfo(null)
  }, [selectedNpcId, char.hpCur, char.mpCur, char.tael])

  // 切换 NPC 时清空 CDK 输入
  useEffect(() => { setCdkInput('') }, [selectedNpcId])

  function handleGuideEquip() {
    const res = claimGuideEquipAction()
    if (res.ok) {
      setNpcMsg({ ok: true, text: `已为 ${res.charCount} 位道友各发放一套装备，共 ${res.itemCount} 件，已入装备仓库。` })
    } else {
      setNpcMsg({ ok: false, text: res.reason ?? '领取失败' })
    }
    setTimeout(() => setNpcMsg(null), 4000)
  }

  function handleCdk() {
    const res = claimCdkAction(cdkInput)
    if (res.ok) {
      setNpcMsg({ ok: true, text: `兑换成功！已为 ${res.charCount} 位道友各赠一只「${res.desc}」，已入宠物仓库。` })
      setCdkInput('')
    } else {
      setNpcMsg({ ok: false, text: res.reason ?? '兑换失败' })
    }
    setTimeout(() => setNpcMsg(null), 4000)
  }

  function handleHeal() {
    const res = healPartyAtNpcAction()
    if (res.ok) {
      setHealInfo(computePartyHealInfo())
      setNpcMsg(res.alreadyFull
        ? { ok: true, text: '气血法力皆已充盈，无需治疗。' }
        : { ok: true, text: res.cost === 0 ? '已为全队补满气血法力（免费）。' : `治疗完成，花费 ${res.cost.toLocaleString()} 银两。` }
      )
    } else {
      setNpcMsg({ ok: false, text: res.reason ?? '治疗失败' })
    }
    setTimeout(() => setNpcMsg(null), 3500)
  }

  function handleNpcAccept(questId) {
    const res = acceptQuestAction(questId)
    setNpcMsg(res.ok ? { ok: true, text: '任务已接受' } : { ok: false, text: '无法接受任务' })
    setTimeout(() => setNpcMsg(null), 2000)
  }

  function handleNpcClaim(questId) {
    const res = claimQuestAction(questId)
    if (res.ok) {
      const r = res.rewards
      const parts = [
        r.exp      ? `经验 +${r.exp.toLocaleString()}`  : '',
        r.gold     ? `银两 +${r.gold.toLocaleString()}` : '',
        r.daoDays  ? `道行 +${r.daoDays}天`            : '',
        r.potential? `潜能 +${r.potential}`            : '',
        ...(r.items ?? []).map(it => {
          const nm = { xiao_huanhun:'小还魂丹', zhong_huanhun:'中还魂丹', da_huanhun:'大还魂丹',
            xiao_juling:'小聚灵丹', zhong_juling:'中聚灵丹', da_juling:'大聚灵丹',
            qianghuashi:'强化石', heishuijing:'黑水晶' }
          return `${nm[it.itemId] ?? it.itemId} ×${it.qty}`
        }),
        res.rewardedPet ? `宠物「${res.rewardedPet.displayName}」已入仓库` : '',
      ].filter(Boolean)
      setNpcMsg({ ok: true, text: parts.join('　') })
    } else {
      setNpcMsg({ ok: false, text: '无法领取奖励' })
    }
    setTimeout(() => setNpcMsg(null), 4000)
  }

  function handleGoTo() {
    setMapAction(selectedId)
    progressVisitQuestAction(selectedId)
  }

  function handleBattle() {
    if (!isAtSelected) {
      setMapAction(selectedId)
      progressVisitQuestAction(selectedId)
    }
    navigate?.('combat')
  }

  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead title="行游天下" sub="WORLD · 地图"
        right={
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>
            当前 <span style={{ color: 'var(--vermilion)', fontWeight: 700 }}>{activeMap?.name ?? '—'}</span>
          </span>
        }
      />
      <div style={{ position: 'absolute', inset: '60px 16px 16px 16px', display: 'flex', gap: 12 }}>

        {/* ── 地图画布 ── */}
        <div className="paper-dark scroll-frame" style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
          {/* 装饰 SVG */}
          <svg viewBox="0 0 1000 700" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4, pointerEvents: 'none' }}>
            {/* 大陆轮廓 */}
            <path d="M 60 80 Q 180 40 380 70 Q 560 100 700 75 Q 850 55 940 130
                     Q 990 230 960 380 Q 930 500 800 550 Q 620 600 420 580
                     Q 220 560 110 470 Q 50 380 60 230 Z"
              fill="rgba(200,180,140,0.12)" stroke="#6a5a48" strokeWidth="1.2" strokeDasharray="3 4" />
            {/* 东海 */}
            <path d="M 720 80 Q 900 150 980 320 Q 1000 450 940 560 Q 970 480 990 350 Q 990 200 940 130"
              fill="rgba(100,140,180,0.15)" stroke="none" />
            {/* 山脉线 - 北部 */}
            <g stroke="#4a3e32" strokeWidth="1.2" fill="none" opacity="0.7">
              <path d="M 180 180 L 210 145 L 240 180 L 268 155 L 300 185" />
              <path d="M 340 100 L 370 65 L 400 100 L 430 75 L 460 105" />
              <path d="M 520 150 L 555 115 L 585 148 L 615 120" />
              <path d="M 680 140 L 715 105 L 748 140 L 775 118" />
            </g>
            {/* 河流 */}
            <path d="M 120 500 Q 260 440 420 430 Q 580 418 720 460 Q 840 490 900 520"
              fill="none" stroke="#7898b0" strokeWidth="2.2" opacity="0.45" />
            <path d="M 300 300 Q 380 340 460 330 Q 560 315 640 360"
              fill="none" stroke="#7898b0" strokeWidth="1.6" opacity="0.35" />
            {/* 区域标注 */}
          </svg>
          {/* 区域文字 */}
          <div style={{ position: 'absolute', left: '8%', top: '55%', pointerEvents: 'none' }}>
            <div className="vertical brush" style={{ fontSize: 18, color: 'rgba(90,74,56,0.35)', letterSpacing: '0.4em' }}>中原</div>
          </div>
          <div style={{ position: 'absolute', left: '44%', top: '8%', pointerEvents: 'none' }}>
            <div className="vertical brush" style={{ fontSize: 16, color: 'rgba(90,74,56,0.30)', letterSpacing: '0.4em' }}>北域</div>
          </div>
          <div style={{ position: 'absolute', left: '78%', top: '40%', pointerEvents: 'none' }}>
            <div className="vertical brush" style={{ fontSize: 16, color: 'rgba(70,100,130,0.35)', letterSpacing: '0.4em' }}>东海</div>
          </div>
          <div style={{ position: 'absolute', left: '66%', top: '10%', pointerEvents: 'none' }}>
            <div className="vertical brush" style={{ fontSize: 14, color: 'rgba(90,74,56,0.28)', letterSpacing: '0.4em' }}>阵法</div>
          </div>
          {/* 地图节点 */}
          {WENDAO_MAPS.map(map => (
            <MapNode
              key={map.id}
              map={map}
              isActive={map.id === activeMapId}
              isSelected={map.id === selectedId}
              charLevel={charLevel}
              onClick={() => setSelectedId(map.id)}
            />
          ))}
        </div>

        {/* ── 右侧信息面板 ── */}
        <div style={{ width: 272, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>

          {/* 选中地图信息 */}
          <div className="paper-bg scroll-frame" style={{ padding: '12px 14px', position: 'relative' }}>
            <CornerDeco />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <Seal size={34} style={{ flexShrink: 0, fontSize: 13 }}>
                {selectedMap.name.slice(0, 1)}
              </Seal>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="brush" style={{ fontSize: 17, lineHeight: 1.2, color: 'var(--ink)' }}>{selectedMap.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                  <Tag tone={
                    selectedMap.type === '城镇' ? 'gold' :
                    selectedMap.type === '副本' ? 'vermilion' :
                    selectedMap.type === '阵法' ? 'ink' : 'bamboo'
                  } style={{ fontSize: 10, padding: '1px 6px' }}>
                    {selectedMap.type}
                  </Tag>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                    Lv {selectedMap.levelRange[0]}–{selectedMap.levelRange[1]}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>
                    {selectedMap.region}
                  </span>
                </div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.7 }}>{selectedMap.blurb}</p>
            {isAtSelected && (
              <div style={{ marginTop: 6, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--vermilion)' }}>
                ▶ 当前练级地图
              </div>
            )}
          </div>

          {/* NPC 条（有 NPC 时显示） */}
          {npcsOnMap.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flexShrink: 0 }}>
              {npcsOnMap.map(npc => {
                const isSelected = npc.id === selectedNpcId
                const npcQs = getQuestsForNpc(npc.id)
                const hasClaimable = npcQs.some(q => getQuestStatus(q, char.questLog ?? {}, charLevel) === QS.CLAIMABLE)
                const hasAvailable = !hasClaimable && npcQs.some(q => getQuestStatus(q, char.questLog ?? {}, charLevel) === QS.AVAILABLE)
                return (
                  <button
                    key={npc.id}
                    className={'btn-ink' + (isSelected ? ' btn-ink-primary' : '')}
                    onClick={() => setSelectedNpcId(isSelected ? null : npc.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', fontSize: 11, position: 'relative' }}
                  >
                    <Seal size={18} round style={{ fontSize: 9, flexShrink: 0,
                      background: hasClaimable ? 'var(--vermilion)' : hasAvailable ? 'var(--bamboo)' : undefined,
                    }}>{npc.glyph}</Seal>
                    <span style={{ fontFamily: 'var(--font-body)' }}>{npc.name}</span>
                    {(hasClaimable || hasAvailable) && (
                      <span style={{
                        position: 'absolute', top: -3, right: -3, width: 8, height: 8,
                        background: hasClaimable ? 'var(--vermilion)' : 'var(--bamboo)',
                        borderRadius: '50%', border: '1px solid var(--paper)',
                      }} />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* 主内容区：NPC 对话 or 出没怪物 */}
          <div className="paper-bg scroll-frame" style={{ padding: '10px 14px', position: 'relative', flex: 1, overflow: 'auto' }}>
            <CornerDeco />
            {selectedNpc ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Seal size={28} round style={{ flexShrink: 0 }}>{selectedNpc.glyph}</Seal>
                  <div>
                    <div className="brush" style={{ fontSize: 15, color: 'var(--ink)' }}>{selectedNpc.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>{selectedNpc.title}</div>
                  </div>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.7, fontStyle: 'italic',
                  borderLeft: '2px solid var(--gold-2)', paddingLeft: 8 }}>
                  「{selectedNpc.idle}」
                </p>
                {npcMsg && (
                  <div style={{
                    marginBottom: 8, padding: '4px 10px',
                    background: npcMsg.ok ? 'rgba(45,138,45,0.12)' : 'rgba(163,55,58,0.12)',
                    border: `1px solid ${npcMsg.ok ? 'var(--bamboo)' : 'var(--vermilion)'}`,
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: npcMsg.ok ? 'var(--bamboo)' : 'var(--vermilion)',
                  }}>{npcMsg.text}</div>
                )}

                {/* ── 新手指引面板 ── */}
                {selectedNpc.role === 'guide' && (
                  <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <SubHead title="新手礼包" sub="STARTER PACK" />
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.8,
                      padding: '6px 10px', background: 'rgba(243,237,224,0.6)', border: '1px dashed var(--ink-4)' }}>
                      按队伍人数，每位道友各得一套一级装备：<br />
                      · 武器（金系·长剑 / 木系·折扇 / 水系·铁爪 / 火系·铜锤 / 土系·长枪）<br />
                      · 方巾 · 布衣 · 麻鞋 · 布腰带 · 道符<br />
                      <span style={{ color: 'var(--ink-4)' }}>装备领取后存入装备仓库，每存档仅限一次。</span>
                    </div>
                    {char.guideEquipClaimed ? (
                      <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11,
                        color: 'var(--bamboo)', padding: '6px', letterSpacing: '0.1em' }}>
                        ✓ 已领取
                      </div>
                    ) : (
                      <button className="btn-ink btn-ink-primary" onClick={handleGuideEquip}
                        style={{ padding: '8px 0', fontSize: 13, letterSpacing: '0.15em' }}>
                        领 取 新 手 装 备
                      </button>
                    )}
                  </div>
                )}

                {/* ── 福利大使面板 ── */}
                {selectedNpc.role === 'welfare' && (
                  <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <SubHead title="兑换码" sub="CDK EXCHANGE" />
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)',
                      lineHeight: 1.7, padding: '4px 0' }}>
                      输入兑换码即可领取专属好礼，每码全服限领一次。
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={cdkInput}
                        onChange={e => setCdkInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCdk()}
                        placeholder="请输入兑换码…"
                        maxLength={32}
                        style={{
                          flex: 1, padding: '6px 10px',
                          fontFamily: 'var(--font-mono)', fontSize: 12,
                          background: 'rgba(243,237,224,0.8)',
                          border: '1px solid var(--ink-3)',
                          color: 'var(--ink)', outline: 'none',
                          letterSpacing: '0.1em',
                        }}
                      />
                      <button className="btn-ink btn-ink-primary"
                        onClick={handleCdk}
                        disabled={!cdkInput.trim()}
                        style={{ padding: '6px 14px', fontSize: 12, letterSpacing: '0.1em',
                          opacity: cdkInput.trim() ? 1 : 0.45 }}>
                        兑 换
                      </button>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', lineHeight: 1.6 }}>
                      · 当前可用兑换码：<span style={{ color: 'var(--gold-2)', letterSpacing: '0.15em' }}>666</span>
                      <span style={{ marginLeft: 8, color: 'var(--ink-4)' }}>（按队伍人数送金头陀·宝宝）</span>
                    </div>
                  </div>
                )}

                {/* ── 治疗师面板 ── */}
                {selectedNpc.role === 'healer' && healInfo && (
                  <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <SubHead title="队伍状态" sub="PARTY STATUS" />
                    {healInfo.members.map(m => (
                      <div key={m.id} style={{
                        padding: '7px 10px', background: 'var(--paper)',
                        border: `1px solid ${m.isFull ? 'var(--ink-4)' : '#4a90d9'}`,
                        display: 'flex', flexDirection: 'column', gap: 4,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span className="brush" style={{ fontSize: 13, color: 'var(--ink)', flex: 1 }}>{m.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>Lv{m.level}</span>
                          {m.isFull ? (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--bamboo)' }}>已满</span>
                          ) : m.isFree ? (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--bamboo)', border: '1px solid var(--bamboo)', padding: '0 4px' }}>免费</span>
                          ) : (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold-2)', border: '1px solid var(--gold-2)', padding: '0 4px' }}>
                              {m.cost.toLocaleString()} 银
                            </span>
                          )}
                        </div>
                        <Bar value={m.hp} max={m.maxHp} type="hp" height={10} showText={false} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', marginTop: -2 }}>
                          HP {m.hp.toLocaleString()} / {m.maxHp.toLocaleString()}
                        </div>
                        <Bar value={m.mp} max={m.maxMp} type="mp" height={10} showText={false} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', marginTop: -2 }}>
                          MP {m.mp.toLocaleString()} / {m.maxMp.toLocaleString()}
                        </div>
                      </div>
                    ))}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 10px', background: 'var(--paper-2)', border: '1px solid var(--ink-3)',
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', flex: 1 }}>
                        {healInfo.totalCost === 0
                          ? (healInfo.members.every(m => m.isFull) ? '全队气血充盈' : '全队免费治疗')
                          : `治疗费用：${healInfo.totalCost.toLocaleString()} 银两`}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>
                        持有 {(char.tael ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <button
                      className="btn-ink btn-ink-primary"
                      onClick={handleHeal}
                      disabled={!healInfo.canAfford || healInfo.members.every(m => m.isFull)}
                      style={{
                        padding: '8px 0', fontSize: 13, letterSpacing: '0.15em',
                        opacity: (!healInfo.canAfford || healInfo.members.every(m => m.isFull)) ? 0.45 : 1,
                      }}
                    >
                      {healInfo.members.every(m => m.isFull) ? '已无需治疗' : !healInfo.canAfford ? '银两不足' : '治 疗 全 队'}
                    </button>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', lineHeight: 1.5 }}>
                      · Lv{`<`}10 免费 · Lv≥10 费用 = ⌈(缺失HP + 缺失MP) × 等级 / 20⌉
                    </div>
                  </div>
                )}

                {npcQuests.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <SubHead title="相关任务" sub={`QUESTS · ${npcQuests.length}`} />
                    {npcQuests.map(({ quest, status }) => (
                      <QuestRow key={quest.id} quest={quest} status={status}
                        questLog={char.questLog ?? {}} onAccept={handleNpcAccept} onClaim={handleNpcClaim} />
                    ))}
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textAlign: 'center', marginTop: 12 }}>
                    暂无相关任务
                  </div>
                )}
              </>
            ) : selectedMap.type === '城镇' ? (
              <>
                <SubHead title="城中设施" sub={`NPC · ${npcsOnMap.length} 位`} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {npcsOnMap.map(npc => {
                    const role = NPC_ROLES[npc.role] ?? { label: npc.role ?? '—', color: 'var(--ink-3)' }
                    const npcQs = getQuestsForNpc(npc.id)
                    const hasClaimable = npcQs.some(q => getQuestStatus(q, char.questLog ?? {}, charLevel) === QS.CLAIMABLE)
                    const hasAvailable = !hasClaimable && npcQs.some(q => getQuestStatus(q, char.questLog ?? {}, charLevel) === QS.AVAILABLE)
                    const dotColor = hasClaimable ? 'var(--vermilion)' : hasAvailable ? 'var(--bamboo)' : null
                    return (
                      <div
                        key={npc.id}
                        onClick={() => setSelectedNpcId(npc.id === selectedNpcId ? null : npc.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 8px', cursor: 'pointer', position: 'relative',
                          background: npc.id === selectedNpcId ? 'rgba(200,120,32,0.08)' : 'transparent',
                          border: `1px solid ${npc.id === selectedNpcId ? '#c87820' : 'var(--ink-4)'}`,
                        }}
                      >
                        <Seal size={22} round style={{ flexShrink: 0, fontSize: 10,
                          background: hasClaimable ? 'var(--vermilion)' : hasAvailable ? 'var(--bamboo)' : undefined,
                        }}>{npc.glyph}</Seal>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink)', lineHeight: 1.2 }}>{npc.name}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', marginTop: 1 }}>{npc.title}</div>
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9, padding: '1px 5px',
                          border: `1px solid ${role.color}`, color: role.color, flexShrink: 0,
                        }}>{role.label}</span>
                        {dotColor && (
                          <div style={{
                            position: 'absolute', top: 3, right: 3,
                            width: 7, height: 7, borderRadius: '50%',
                            background: dotColor, border: '1px solid var(--paper)',
                          }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <SubHead title="出没怪物" sub={`SPAWNS · ${selectedMap.spawns.length} 种`} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {selectedMap.spawns.map((sp, i) => {
                    const elem = inferSpawnElement(sp.tags)
                    const sch  = ELEM_SCHOOL[elem]
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '3px 4px',
                        borderBottom: i < selectedMap.spawns.length - 1 ? '1px dashed var(--ink-4)' : 'none',
                      }}>
                        <Seal size={14} round school={sch} style={{ fontSize: 8, flexShrink: 0 }}>{elem}</Seal>
                        <span style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-2)', fontSize: 12, flex: 1 }}>{sp.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>Lv {sp.level}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {selectedMap.type === '城镇' ? (
              <button
                className={'btn-ink' + (isAtSelected ? ' btn-ink-primary' : '')}
                onClick={handleGoTo}
                style={{ padding: '10px 0', fontSize: 15, letterSpacing: '0.2em' }}
              >
                {isAtSelected ? '▶ 当前驻留城镇' : '进 城'}
              </button>
            ) : (
              <>
                {!isAtSelected && (
                  <button className="btn-ink" onClick={handleGoTo}
                    style={{ padding: '7px 0', fontSize: 13, letterSpacing: '0.1em' }}>
                    前 往 此 地
                  </button>
                )}
                <button className="btn-ink btn-ink-primary" onClick={handleBattle}
                  style={{ padding: '10px 0', fontSize: 15, letterSpacing: '0.2em' }}>
                  {isAtSelected ? '立 即 开 战' : '前往并开战'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

