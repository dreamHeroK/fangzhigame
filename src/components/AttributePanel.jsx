import { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import { calculateBattleStats } from '../utils/attributeCalc'
import { getAllEquipmentStats } from '../utils/equipment'
import './AttributePanel.css'

function AttributePanel({ onClose, embedded = false }) {
  const { player, setPlayer, elementPoints, equippedItems } = useGame()
  const [tempAttributes, setTempAttributes] = useState(null)
  const [assignStep, setAssignStep] = useState(1)

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

  const normalizeAmount = (amount) => {
    const numeric = Number(amount)
    if (Number.isNaN(numeric) || numeric <= 0) {
      return 1
    }
    return Math.floor(numeric)
  }

  const adjustAttribute = (attr, increase, amount = assignStep) => {
    const newAttrs = { ...tempAttributes }
    const normalizedAmount = normalizeAmount(amount)

    if (increase) {
      if (newAttrs.points <= 0) return
      const pointsToUse = Math.min(normalizedAmount, newAttrs.points)
      newAttrs[attr] += pointsToUse
      newAttrs.points -= pointsToUse
    } else {
      const baseValue = player.baseAttrs?.[attr] || 0
      const currentValue = newAttrs[attr]

      if (currentValue <= baseValue) return

      const maxDecrement = currentValue - baseValue
      const decrement = Math.min(normalizedAmount, maxDecrement)
      newAttrs[attr] -= decrement
      newAttrs.points += decrement
    }

    setTempAttributes(newAttrs)
  }

  const quickAssignSteps = [1, 5, 10]

  const handleAssignStepChange = (value) => {
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed) || parsed <= 0) {
      setAssignStep(1)
    } else {
      setAssignStep(parsed)
    }
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
    if (!embedded) {
      onClose()
    }
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

  const content = (
    <>
      {!embedded && (
        <>
          <span className="close" onClick={onClose}>
            &times;
          </span>
          <h2>属性加点</h2>
        </>
      )}
        <div className="attr-panel-content">
          <div className="assign-step">
            <label>批量分配</label>
            <input
              type="number"
              min="1"
              value={assignStep}
              onChange={(e) => handleAssignStepChange(e.target.value)}
            />
            <div className="assign-step-buttons">
              {quickAssignSteps.map((step) => (
                <button
                  key={step}
                  type="button"
                  className={`assign-step-btn${assignStep === step ? ' active' : ''}`}
                  onClick={() => setAssignStep(step)}
                >
                  +{step}
                </button>
              ))}
              <button
                type="button"
                className="assign-step-btn"
                onClick={() => tempAttributes.points > 0 && setAssignStep(tempAttributes.points)}
                disabled={tempAttributes.points <= 0}
              >
                全部
              </button>
            </div>
          </div>
          <div className="attr-control">
            <label>力量:</label>
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
    </>
  )

  if (embedded) {
    return <div className="attr-panel-embedded">{content}</div>
  }

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  )
}

export default AttributePanel
