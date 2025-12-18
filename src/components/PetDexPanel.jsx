import { useMemo } from 'react'
import { useGame } from '../context/GameContext'
import './PetDexPanel.css'

const elementIcons = {
  '金': '⚡',
  '木': '🌲',
  '水': '💧',
  '火': '🔥',
  '土': '⛰️',
}

function PetDexPanel({ onClose }) {
  const { pets } = useGame()

  const petEntries = useMemo(() => {
    if (!pets || pets.length === 0) return []
    const map = new Map()

    pets.forEach((pet) => {
      const key = pet.type || `${pet.element}-${pet.name}`
      const existing = map.get(key)
      if (!existing) {
        map.set(key, {
          key,
          name: pet.name,
          element: pet.element,
          icon: pet.icon,
          count: 1,
          highestLevel: pet.level || 1,
          isDivine: !!pet.isDivine,
        })
      } else {
        existing.count += 1
        existing.highestLevel = Math.max(existing.highestLevel, pet.level || 1)
        existing.isDivine = existing.isDivine || !!pet.isDivine
      }
    })

    return Array.from(map.values()).sort((a, b) => b.highestLevel - a.highestLevel)
  }, [pets])

  const totalPets = pets?.length || 0
  const totalSpecies = petEntries.length
  const divineCount = pets.filter((p) => p.isDivine).length

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content petdex-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>宠物图鉴</h2>

        <div className="petdex-summary">
          <div>已收集种类：{totalSpecies}</div>
          <div>持有宠物总数：{totalPets}</div>
          <div>神兽数量：{divineCount}</div>
        </div>

        {petEntries.length === 0 ? (
          <div className="petdex-empty">还没有捕捉过任何宠物，先去战斗中尝试【捕捉】吧！</div>
        ) : (
          <div className="petdex-grid">
            {petEntries.map((entry) => (
              <div key={entry.key} className="petdex-card">
                <div className="petdex-header">
                  <span className="petdex-icon">
                    {entry.icon || elementIcons[entry.element] || '🐾'}
                  </span>
                  <span className="petdex-name">
                    {entry.name}
                    {entry.isDivine && <span className="divine-badge">神兽</span>}
                  </span>
                </div>
                <div className="petdex-body">
                  <div>属性：{entry.element}</div>
                  <div>最高等级：Lv.{entry.highestLevel}</div>
                  <div>持有数量：{entry.count}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PetDexPanel


