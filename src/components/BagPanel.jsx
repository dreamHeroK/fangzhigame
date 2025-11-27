import { useMemo, useState } from 'react'
import { useGame } from '../context/GameContext'
import { getMedicineById } from '../utils/items'
import { equipmentQuality, getEquipmentStats, getAllEquipmentStats } from '../utils/equipment'
import { updatePlayerBattleStats } from '../utils/attributeCalc'
import './BagPanel.css'

const TOTAL_PAGES = 4
const SLOTS_PER_PAGE = 36
const statLabelMap = {
  attack: '攻击',
  defense: '防御',
  speed: '速度',
  maxHp: '气血',
  maxMp: '法力',
  strength: '力量',
  constitution: '体质',
  spirit: '灵力',
  agility: '敏捷',
}

function BagPanel({ onClose }) {
  const { 
    player,
    setPlayer,
    inventory,
    equipmentInventory,
    setEquipmentInventory,
    equippedItems,
    setEquippedItems,
    elementPoints,
  } = useGame()
  const [activePage, setActivePage] = useState(0)

  const bagEntries = useMemo(() => {
    const itemEntries = Object.entries(inventory || {}).map(([id, count]) => {
      const item = getMedicineById(id) || {}
      return {
        slotId: `item_${id}`,
        type: 'item',
        icon: item.icon || '🎒',
        name: item.name || id,
        description: item.description || '消耗品',
        count,
      }
    })

    const equipEntries = (equipmentInventory || []).map(equipment => ({
      slotId: equipment.id,
      type: 'equipment',
      equipment,
    }))

    return [...itemEntries, ...equipEntries]
  }, [inventory, equipmentInventory])

  const handleEquip = (equipment) => {
    const currentEquipped = equippedItems?.[equipment.slot]
    const newEquipped = { ...equippedItems, [equipment.slot]: equipment }
    const newInventory = equipmentInventory.filter(eq => eq.id !== equipment.id)

    if (currentEquipped) {
      newInventory.push(currentEquipped)
    }

    setEquippedItems(newEquipped)
    setEquipmentInventory(newInventory)

    if (player) {
      const equipmentStats = getAllEquipmentStats(newEquipped)
      const updatedPlayer = updatePlayerBattleStats(player, elementPoints, equipmentStats)
      setPlayer(updatedPlayer)
    }
  }

  const renderSlotContent = (entry) => {
    if (!entry) {
      return <div className="bag-slot empty" />
    }

    if (entry.type === 'item') {
      return (
        <div className="bag-slot item-slot">
          <div className="bag-item">
            <span className="bag-icon">{entry.icon}</span>
            <span className="bag-count">{entry.count}</span>
          </div>
          <div className="bag-tooltip">
            <div className="tooltip-title">{entry.name}</div>
            <div className="tooltip-desc">{entry.description}</div>
            <div className="tooltip-desc">数量: {entry.count}</div>
          </div>
        </div>
      )
    }

    const { equipment } = entry
    const quality = equipmentQuality[equipment.quality] || equipmentQuality.white
    const stats = getEquipmentStats(equipment)
    const currentEquipped = equippedItems?.[equipment.slot]
    const currentStats = currentEquipped ? getEquipmentStats(currentEquipped) : null

    return (
      <div
        className="bag-slot equip-slot"
        onContextMenu={(e) => {
          e.preventDefault()
          handleEquip(equipment)
        }}
        title="右键装备可直接穿戴"
      >
        <div className="bag-item">
          <span className="bag-icon">{equipment.icon || '⚔️'}</span>
        </div>
        <div className="bag-tooltip">
          <div className="tooltip-title" style={{ color: quality.color }}>
            {equipment.name}
          </div>
          <div className="tooltip-desc">品质: {quality.name}</div>
          <div className="tooltip-subtitle">背包装备</div>
          <div className="tooltip-divider" />
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="tooltip-stat">
              {statLabelMap[key] || key}: +{value}
            </div>
          ))}
          {currentEquipped && currentEquipped.id !== equipment.id && (
            <>
              <div className="tooltip-divider" />
              <div className="tooltip-subtitle">当前装备</div>
              <div className="tooltip-desc" style={{ color: equipmentQuality[currentEquipped.quality].color }}>
                {currentEquipped.name}
              </div>
              {Object.entries(currentStats).map(([key, value]) => (
                <div key={key} className="tooltip-stat current">
                  {statLabelMap[key] || key}: +{value}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    )
  }

  const totalSlots = TOTAL_PAGES * SLOTS_PER_PAGE
  const paddedEntries = Array.from({ length: totalSlots }, (_, index) => bagEntries[index] || null)
  const pageEntries = paddedEntries.slice(
    activePage * SLOTS_PER_PAGE,
    activePage * SLOTS_PER_PAGE + SLOTS_PER_PAGE
  )

  return (
    <div className="modal active" onClick={onClose}>
      <div
        className="modal-content bag-panel"
        style={{ overflow: 'visible' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="close" onClick={onClose}>&times;</span>
        <h2>背包</h2>
        <p className="bag-hint">提示：右键装备可直接穿戴，已装备物品会返回背包。</p>
        <div className="bag-pages">
          {Array.from({ length: TOTAL_PAGES }).map((_, index) => (
            <button
              key={index}
              className={`page-btn ${activePage === index ? 'active' : ''}`}
              onClick={() => setActivePage(index)}
            >
              第 {index + 1} 页
            </button>
          ))}
        </div>
        <div className="bag-grid">
          {pageEntries.map((entry, idx) => (
            <div key={idx} className="bag-cell">
              {renderSlotContent(entry)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BagPanel

