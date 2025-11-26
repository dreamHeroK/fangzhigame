import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { equipmentTypes, equipmentQuality, generateEquipment, getEquipmentStats } from '../utils/equipment'
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
  } = useGame()
  
  const [selectedSlot, setSelectedSlot] = useState(null)

  if (!player) return null

  const handleEquip = (equipment) => {
    const currentEquipped = equippedItems[equipment.slot]
    
    // 如果该位置已有装备，先卸下
    if (currentEquipped) {
      setEquipmentInventory([...equipmentInventory, currentEquipped])
    }
    
    // 装备新装备
    const newEquipped = { ...equippedItems }
    newEquipped[equipment.slot] = equipment
    
    // 从背包移除
    const newInventory = equipmentInventory.filter(eq => eq.id !== equipment.id)
    
    setEquippedItems(newEquipped)
    setEquipmentInventory(newInventory)
    
    // 更新玩家属性
    const equipmentStats = getAllEquipmentStats(newEquipped)
    const updatedPlayer = updatePlayerBattleStats(player, elementPoints, equipmentStats)
    setPlayer(updatedPlayer)
  }

  const handleUnequip = (slot) => {
    const equipment = equippedItems[slot]
    if (!equipment) return
    
    const newEquipped = { ...equippedItems }
    delete newEquipped[slot]
    
    setEquippedItems(newEquipped)
    setEquipmentInventory([...equipmentInventory, equipment])
    
    // 更新玩家属性
    const equipmentStats = getAllEquipmentStats(newEquipped)
    const updatedPlayer = updatePlayerBattleStats(player, elementPoints, equipmentStats)
    setPlayer(updatedPlayer)
  }

  const handleGenerateEquipment = () => {
    const types = Object.keys(equipmentTypes)
    const qualities = Object.keys(equipmentQuality)
    const randomType = types[Math.floor(Math.random() * types.length)]
    const randomQuality = qualities[Math.floor(Math.random() * qualities.length)]
    
    const newEquip = generateEquipment(randomType, randomQuality, player.level)
    if (newEquip) {
      setEquipmentInventory([...equipmentInventory, newEquip])
      alert(`获得 ${newEquip.name}！`)
    }
  }

  const getSlotEquipment = (slot) => {
    return Object.values(equippedItems).find(eq => eq && eq.slot === slot)
  }

  const getSlotInventory = (slot) => {
    return equipmentInventory.filter(eq => eq.slot === slot)
  }

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content equipment-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>装备管理</h2>
        <div className="equipment-panel">
          <div className="equipment-slots">
            <h3>已装备</h3>
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
          
          <div className="equipment-inventory">
            <div className="inventory-header">
              <h3>装备背包</h3>
              <button className="btn-generate" onClick={handleGenerateEquipment}>
                生成随机装备
              </button>
            </div>
            <div className="inventory-tabs">
              <button
                className={`tab-btn ${selectedSlot === null ? 'active' : ''}`}
                onClick={() => setSelectedSlot(null)}
              >
                全部
              </button>
              {Object.values(equipmentTypes).map(type => (
                <button
                  key={type.slot}
                  className={`tab-btn ${selectedSlot === type.slot ? 'active' : ''}`}
                  onClick={() => setSelectedSlot(type.slot)}
                >
                  {type.icon} {type.name}
                </button>
              ))}
            </div>
            <div className="inventory-list">
              {equipmentInventory
                .filter(eq => !selectedSlot || eq.slot === selectedSlot)
                .map(equipment => {
                  const stats = getEquipmentStats(equipment)
                  const qualityData = equipmentQuality[equipment.quality]
                  return (
                    <div key={equipment.id} className="equipment-item">
                      <div className="equip-header">
                        <span className="equip-name" style={{ color: qualityData.color }}>
                          {equipment.icon} {equipment.name}
                        </span>
                        <span className="equip-quality">{qualityData.name}</span>
                      </div>
                      <div className="equip-stats">
                        <div className="main-stats">
                          {Object.keys(equipment.mainStats).map(key => (
                            <div key={key} className="stat-line">
                              {key}: +{equipment.mainStats[key]}
                            </div>
                          ))}
                        </div>
                        {Object.keys(equipment.bonusStats || {}).length > 0 && (
                          <div className="bonus-stats">
                            {Object.keys(equipment.bonusStats).map(key => (
                              <div key={key} className="stat-line bonus">
                                {key}: +{equipment.bonusStats[key]}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        className="btn-equip"
                        onClick={() => handleEquip(equipment)}
                      >
                        装备
                      </button>
                    </div>
                  )
                })}
              {equipmentInventory.filter(eq => !selectedSlot || eq.slot === selectedSlot).length === 0 && (
                <div className="empty-inventory">暂无装备</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EquipmentPanel

