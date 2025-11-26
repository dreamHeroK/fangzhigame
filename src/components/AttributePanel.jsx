import { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import { calculateBattleStats } from '../utils/attributeCalc'
import { getAllEquipmentStats } from '../utils/equipment'
import './AttributePanel.css'

function AttributePanel({ onClose }) {
  const { player, setPlayer, elementPoints, equippedItems } = useGame()
  const [tempAttributes, setTempAttributes] = useState(null)

  useEffect(() => {
    if (player) {
      setTempAttributes({
        strength: player.strength || 0,
        constitution: player.constitution || 0,
        spirit: player.spirit || 0,
        agility: player.agility || 0,
        points: player.points || 0,
      })
    }
  }, [player])

  if (!player || !tempAttributes) return null

  const adjustAttribute = (attr, increase) => {
    const newAttrs = { ...tempAttributes }

    if (increase) {
      if (newAttrs.points <= 0) return
      newAttrs.points--
      if (attr === 'strength') newAttrs.strength++
      else if (attr === 'constitution') newAttrs.constitution++
      else if (attr === 'spirit') newAttrs.spirit++
      else if (attr === 'agility') newAttrs.agility++
    } else {
      const baseValue = player.baseAttrs?.[attr] || 0
      const currentValue = newAttrs[attr]

      if (currentValue <= baseValue) return

      newAttrs.points++
      if (attr === 'strength') newAttrs.strength--
      else if (attr === 'constitution') newAttrs.constitution--
      else if (attr === 'spirit') newAttrs.spirit--
      else if (attr === 'agility') newAttrs.agility--
    }

    setTempAttributes(newAttrs)
  }

  const saveAttributes = () => {
    // 更新基础属性
    const updatedPlayer = {
      ...player,
      strength: tempAttributes.strength,
      constitution: tempAttributes.constitution,
      spirit: tempAttributes.spirit,
      agility: tempAttributes.agility,
      points: tempAttributes.points,
    }

    // 重新计算战斗属性（包含相性点和装备）
    const equipmentStats = getAllEquipmentStats(equippedItems)
    const battleStats = calculateBattleStats(
      {
        strength: tempAttributes.strength,
        constitution: tempAttributes.constitution,
        spirit: tempAttributes.spirit,
        agility: tempAttributes.agility,
      },
      player.level,
      elementPoints,
      equipmentStats
    )

    updatedPlayer.attack = battleStats.attack
    updatedPlayer.defense = battleStats.defense
    updatedPlayer.speed = battleStats.speed
    updatedPlayer.maxHp = battleStats.maxHp
    updatedPlayer.maxMp = battleStats.maxMp

    // 确保当前HP/MP不超过最大值
    if (updatedPlayer.hp > updatedPlayer.maxHp) {
      updatedPlayer.hp = updatedPlayer.maxHp
    }
    if (updatedPlayer.mp > updatedPlayer.maxMp) {
      updatedPlayer.mp = updatedPlayer.maxMp
    }

    setPlayer(updatedPlayer)
    onClose()
  }

  const canDecrease = (attr) => {
    const baseValue = player.baseAttrs?.[attr] || 0
    const currentValue = tempAttributes[attr]
    return currentValue > baseValue
  }

  // 计算当前属性对应的战斗属性预览（包含相性点和装备）
  const equipmentStats = getAllEquipmentStats(equippedItems)
  const previewStats = calculateBattleStats(
    {
      strength: tempAttributes.strength,
      constitution: tempAttributes.constitution,
      spirit: tempAttributes.spirit,
      agility: tempAttributes.agility,
    },
    player.level,
    elementPoints,
    equipmentStats
  )

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>属性加点</h2>
        <div className="attr-panel-content">
          <div className="attr-control">
            <label>力量:</label>
            <span className="attr-desc">(影响物理攻击和命中)</span>
            <button
              className="attr-btn"
              onClick={() => adjustAttribute('strength', false)}
              disabled={!canDecrease('strength')}
            >
              -
            </button>
            <span>{tempAttributes.strength}</span>
            <button
              className="attr-btn"
              onClick={() => adjustAttribute('strength', true)}
              disabled={tempAttributes.points <= 0}
            >
              +
            </button>
          </div>
          <div className="attr-control">
            <label>体质:</label>
            <span className="attr-desc">(影响气血和防御)</span>
            <button
              className="attr-btn"
              onClick={() => adjustAttribute('constitution', false)}
              disabled={!canDecrease('constitution')}
            >
              -
            </button>
            <span>{tempAttributes.constitution}</span>
            <button
              className="attr-btn"
              onClick={() => adjustAttribute('constitution', true)}
              disabled={tempAttributes.points <= 0}
            >
              +
            </button>
          </div>
          <div className="attr-control">
            <label>灵力:</label>
            <span className="attr-desc">(影响法力和法术伤害)</span>
            <button
              className="attr-btn"
              onClick={() => adjustAttribute('spirit', false)}
              disabled={!canDecrease('spirit')}
            >
              -
            </button>
            <span>{tempAttributes.spirit}</span>
            <button
              className="attr-btn"
              onClick={() => adjustAttribute('spirit', true)}
              disabled={tempAttributes.points <= 0}
            >
              +
            </button>
          </div>
          <div className="attr-control">
            <label>敏捷:</label>
            <span className="attr-desc">(影响攻击顺序)</span>
            <button
              className="attr-btn"
              onClick={() => adjustAttribute('agility', false)}
              disabled={!canDecrease('agility')}
            >
              -
            </button>
            <span>{tempAttributes.agility}</span>
            <button
              className="attr-btn"
              onClick={() => adjustAttribute('agility', true)}
              disabled={tempAttributes.points <= 0}
            >
              +
            </button>
          </div>
          <div className="preview-stats">
            <h4>战斗属性预览:</h4>
            <div className="preview-grid">
              <div>物理攻击: {previewStats.attack}</div>
              <div>防御: {previewStats.defense}</div>
              <div>速度: {previewStats.speed}</div>
              <div>气血: {previewStats.maxHp}</div>
              <div>法力: {previewStats.maxMp}</div>
              <div>命中率: {previewStats.hitRate}%</div>
              <div>法术伤害: +{Math.floor((previewStats.magicDamage - 1) * 100)}%</div>
            </div>
          </div>
          <p>剩余点数: {tempAttributes.points}</p>
          <button className="btn btn-primary" onClick={saveAttributes}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

export default AttributePanel
