import { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import { calculateBattleStats } from '../utils/attributeCalc'
import './PetPanel.css'

const elementIcons = {
  '金': '⚡',
  '木': '🌲',
  '水': '💧',
  '火': '🔥',
  '土': '⛰️'
}

function PetPanel({ onClose }) {
  const { pets, setPets } = useGame()
  const [selectedPet, setSelectedPet] = useState(null)
  const [tempAttributes, setTempAttributes] = useState(null)

  useEffect(() => {
    if (selectedPet) {
      setTempAttributes({
        strength: selectedPet.strength || 0,
        constitution: selectedPet.constitution || 0,
        spirit: selectedPet.spirit || 0,
        agility: selectedPet.agility || 0,
        points: selectedPet.points || 0,
      })
    }
  }, [selectedPet])

  const adjustAttribute = (attr, increase) => {
    if (!selectedPet || !tempAttributes) return

    const newAttrs = { ...tempAttributes }

    if (increase) {
      if (newAttrs.points <= 0) return
      newAttrs.points--
      if (attr === 'strength') newAttrs.strength++
      else if (attr === 'constitution') newAttrs.constitution++
      else if (attr === 'spirit') newAttrs.spirit++
      else if (attr === 'agility') newAttrs.agility++
    } else {
      const baseValue = selectedPet.baseAttrs?.[attr] || 0
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

  const savePetAttributes = () => {
    if (!selectedPet || !tempAttributes) return

    const updatedPets = pets.map(pet => {
      if (pet.id === selectedPet.id) {
        const updated = {
          ...pet,
          strength: tempAttributes.strength,
          constitution: tempAttributes.constitution,
          spirit: tempAttributes.spirit,
          agility: tempAttributes.agility,
          points: tempAttributes.points,
        }
        
        // 重新计算战斗属性
        const battleStats = calculateBattleStats(
          {
            strength: tempAttributes.strength,
            constitution: tempAttributes.constitution,
            spirit: tempAttributes.spirit,
            agility: tempAttributes.agility,
          },
          pet.level
        )
        
        updated.attack = battleStats.attack
        updated.defense = battleStats.defense
        updated.speed = battleStats.speed
        updated.maxHp = battleStats.maxHp
        updated.maxMp = battleStats.maxMp
        updated.hitRate = battleStats.hitRate
        updated.magicDamage = battleStats.magicDamage
        
        if (updated.hp > updated.maxHp) {
          updated.hp = updated.maxHp
        }
        return updated
      }
      return pet
    })

    setPets(updatedPets)
    const updatedPet = updatedPets.find(p => p.id === selectedPet.id)
    setSelectedPet(updatedPet)
  }

  const canDecrease = (attr) => {
    if (!selectedPet || !tempAttributes) return false
    const baseValue = selectedPet.baseAttrs?.[attr] || 0
    const currentValue = tempAttributes[attr]
    return currentValue > baseValue
  }

  // 计算预览属性
  const previewStats = selectedPet && tempAttributes ? calculateBattleStats(
    {
      strength: tempAttributes.strength,
      constitution: tempAttributes.constitution,
      spirit: tempAttributes.spirit,
      agility: tempAttributes.agility,
    },
    selectedPet.level
  ) : null

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>宠物管理</h2>
        <div className="pet-panel-content">
          <div className="pet-list">
            {pets.length === 0 ? (
              <p>暂无宠物</p>
            ) : (
              pets.map(pet => (
                <div
                  key={pet.id}
                  className={`pet-item ${selectedPet?.id === pet.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPet(pet)}
                >
                  <div className="pet-item-name">
                    {elementIcons[pet.element]} {pet.name}
                  </div>
                  <div className="pet-item-element">等级: {pet.level}</div>
                </div>
              ))
            )}
          </div>
          {selectedPet && tempAttributes && (
            <div className="pet-detail">
              <h3>
                {elementIcons[selectedPet.element]} {selectedPet.name}
              </h3>
              <div className="pet-stats">
                <div className="stat-item">
                  <span className="stat-label">生命:</span>
                  <div className="stat-bar">
                    <div
                      className="stat-fill hp"
                      style={{
                        width: `${(selectedPet.hp / selectedPet.maxHp) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span>
                    {selectedPet.hp}/{selectedPet.maxHp}
                  </span>
                </div>
              </div>
              <div className="attributes">
                <div className="attr-item">属性: {selectedPet.element}</div>
                <div className="attr-item">攻击: {previewStats?.attack || selectedPet.attack}</div>
                <div className="attr-item">防御: {previewStats?.defense || selectedPet.defense}</div>
                <div className="attr-item">速度: {previewStats?.speed || selectedPet.speed}</div>
                <div className="attr-item">
                  可分配点数: {tempAttributes.points}
                </div>
              </div>
              <div className="pet-attr-controls">
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
              </div>
              {previewStats && (
                <div className="preview-stats">
                  <h4>战斗属性预览:</h4>
                  <div className="preview-grid">
                    <div>攻击: {previewStats.attack}</div>
                    <div>防御: {previewStats.defense}</div>
                    <div>速度: {previewStats.speed}</div>
                    <div>气血: {previewStats.maxHp}</div>
                    <div>法力: {previewStats.maxMp}</div>
                    <div>命中率: {previewStats.hitRate}%</div>
                  </div>
                </div>
              )}
              <button className="btn btn-primary" onClick={savePetAttributes}>
                保存
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PetPanel
