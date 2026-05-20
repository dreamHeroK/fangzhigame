import React, { useState, useSyncExternalStore } from 'react'
import CombatScreen from './components/CombatScreen.jsx'
import CharacterScreen from './components/CharacterScreen.jsx'
import SkillsScreen from './components/SkillsScreen.jsx'
import PetsScreen from './components/PetsScreen.jsx'
import BagScreen from './components/BagScreen.jsx'

import { QuestScreen, ShopScreen, SignScreen, WorldMapScreen } from './components/MiscScreens.jsx'
import ForgeScreen from './components/ForgeScreen.jsx'
import DataScreen from './components/DataScreen.jsx'
import TestScreen from './components/TestScreen.jsx'
import { subscribe, getSnapshot } from './game/characterStore.js'
import { dbReady } from './game/db/sqliteDb.js'

// 提前初始化 DB（非阻塞，DataScreen 内等待 dbReady）
dbReady.catch(e => console.warn('DB init failed', e))

const SCREENS = [
  { id: 'combat',    label: '战斗',  component: CombatScreen },
  { id: 'world',     label: '地图',  component: WorldMapScreen },
  { id: 'character', label: '人物',  component: CharacterScreen },
  { id: 'skills',    label: '技能',  component: SkillsScreen },
  { id: 'pets',      label: '灵兽',  component: PetsScreen },
  { id: 'bag',       label: '背包',  component: BagScreen },

  { id: 'forge',     label: '锻造',  component: ForgeScreen },
  { id: 'quest',     label: '任务',  component: QuestScreen },
  { id: 'shop',      label: '商城',  component: ShopScreen },
  { id: 'sign',      label: '签到',  component: SignScreen },
  { id: 'data',      label: '数据',  component: DataScreen },
  { id: 'test',      label: '测试',  component: TestScreen },
]

export default function App() {
  const [active, setActive] = useState('combat')
  const char = useSyncExternalStore(subscribe, getSnapshot)

  return (
    <>
      <nav className="app-nav">
        <div className="app-nav-title">问道风</div>
        {SCREENS.map((s) => (
          <button
            key={s.id}
            className={'nav-btn' + (active === s.id ? ' active' : '')}
            onClick={() => setActive(s.id)}
          >
            {s.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', letterSpacing: 1 }}>
          {char.name} · Lv{char.level} · {char.school}系
        </div>
      </nav>
      <div className="screen-wrap">
        {SCREENS.map((s) => {
          const Comp = s.component
          return (
            <div key={s.id} style={active === s.id ? { width: '100%', height: '100%' } : { display: 'none' }}>
              <Comp navigate={setActive} />
            </div>
          )
        })}
      </div>
    </>
  )
}
