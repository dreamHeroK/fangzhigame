import React, { useState, useSyncExternalStore } from 'react'
import CombatScreen from './components/CombatScreen.jsx'
import CharacterScreen from './components/CharacterScreen.jsx'
import SkillsScreen from './components/SkillsScreen.jsx'
import PetsScreen from './components/PetsScreen.jsx'
import BagScreen from './components/BagScreen.jsx'
import { QuestScreen, ShopScreen, SignScreen, WorldMapScreen } from './components/MiscScreens.jsx'
import { subscribe, getSnapshot } from './game/characterStore.js'

const SCREENS = [
  { id: 'combat',    label: '战斗',  component: CombatScreen },
  { id: 'world',     label: '地图',  component: WorldMapScreen },
  { id: 'character', label: '人物',  component: CharacterScreen },
  { id: 'skills',    label: '技能',  component: SkillsScreen },
  { id: 'pets',      label: '灵兽',  component: PetsScreen },
  { id: 'bag',       label: '背包',  component: BagScreen },
  { id: 'quest',     label: '任务',  component: QuestScreen },
  { id: 'shop',      label: '商城',  component: ShopScreen },
  { id: 'sign',      label: '签到',  component: SignScreen },
]

export default function App() {
  const [active, setActive] = useState('combat')
  const char = useSyncExternalStore(subscribe, getSnapshot)
  const Screen = SCREENS.find((s) => s.id === active)?.component ?? CombatScreen

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
        <Screen />
      </div>
    </>
  )
}
