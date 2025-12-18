import { useGame } from '../context/GameContext'
import { equipmentTypes, equipmentQuality, getEquipmentStats } from '../utils/equipment'
import { updatePlayerBattleStats } from '../utils/attributeCalc'
import { getAllEquipmentStats } from '../utils/equipment'
import './EquipmentPanel.css'

function EquipmentPanel({ onClose }) {
  const { 
    player, 
    setPlayer, 
    equipmentInventory, 
    setEquipmentInventory,
    equippedItems,
    setEquippedItems,
    elementPoints,
    playerRef,
  } = useGame()

  if (!player) return null

  const handleUnequip = (slot) => {
    const equipment = equippedItems[slot]
    if (!equipment) return
    
    const newEquipped = { ...equippedItems }
    delete newEquipped[slot]
    
    setEquippedItems(newEquipped)
    setEquipmentInventory([...equipmentInventory, equipment])
    
    // 更新玩家属性（使用最新的 playerRef，避免覆盖战斗更新的经验/等级）
    setPlayer(prev => {
      const base = playerRef?.current || prev
      if (!base) return base
      const equipmentStats = getAllEquipmentStats(newEquipped)
      return updatePlayerBattleStats(base, elementPoints, equipmentStats)
    })
  }

  const getSlotEquipment = (slot) => {
    return Object.values(equippedItems).find(eq => eq && eq.slot === slot)
  }

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content equipment-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>装备管理</h2>
        <p className="equipment-hint">提示：装备管理已集中在背包界面，右键背包中的装备即可穿戴。</p>
        <div className="equipment-panel">
          {Object.values(equipmentTypes).map(type => {
            const equipped = getSlotEquipment(type.slot)
            return (
              <div key={type.slot} className="equipment-slot">
                <div className="slot-label">
                  {type.icon} {type.name}
                </div>
                {equipped ? (
                  <div className="equipped-item">
                    <div className="equip-name" style={{ color: equipmentQuality[equipped.quality].color }}>
                      {equipped.icon} {equipped.name}
                    </div>
                    <div className="equip-stats">
                      {Object.entries(getEquipmentStats(equipped)).map(([key, value]) => (
                        <div key={key} className="stat-line">
                          {key}: +{value}
                        </div>
                      ))}
                    </div>
                    <button className="btn-unequip" onClick={() => handleUnequip(type.slot)}>
                      卸下
                    </button>
                  </div>
                ) : (
                  <div className="empty-slot">未装备</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default EquipmentPanel

