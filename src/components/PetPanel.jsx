import { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import { calculateBattleStats } from '../utils/attributeCalc'
import { getMedicineById } from '../utils/items'
import './PetPanel.css'

const elementIcons = {
  '金': '⚡',
  '木': '🌲',
  '水': '💧',
  '火': '🔥',
  '土': '⛰️'
}

function PetPanel({ onClose }) {
  const { pets, setPets, activePet, setActivePet, autoSettings, setAutoSettings, inventory, setInventory, addLog } = useGame()
  const [selectedPet, setSelectedPet] = useState(null)
  const [tempAttributes, setTempAttributes] = useState(null)
  const [petAiMode, setPetAiMode] = useState('balanced')

  // 打开面板时，优先选中当前上阵宠物，其次选中等级最高的宠物
  useEffect(() => {
    if (!pets || pets.length === 0) {
      setSelectedPet(null)
      setTempAttributes(null)
      return
    }

    if (!selectedPet) {
      if (activePet) {
        const latestActive = pets.find(p => p.id === activePet.id)
        if (latestActive) {
          setSelectedPet(latestActive)
          return
        }
      }
      // 默认选中等级最高的宠物
      const highestLevelPet = [...pets].sort((a, b) => (b.level || 1) - (a.level || 1))[0]
      setSelectedPet(highestLevelPet)
    }
  }, [pets, activePet, selectedPet])

  useEffect(() => {
    if (selectedPet) {
      setTempAttributes({
        strength: selectedPet.strength || 0,
        constitution: selectedPet.constitution || 0,
        spirit: selectedPet.spirit || 0,
        agility: selectedPet.agility || 0,
        points: selectedPet.points || 0,
      })
      setPetAiMode(selectedPet.aiMode || 'balanced')
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
          aiMode: petAiMode,
        }
        
        // 重新计算战斗属性（考虑宠物资质和成长性）
        const petStats = pet.growth ? {
          growth: pet.growth,
          attackAptitude: pet.attackAptitude || 1000,
          defenseAptitude: pet.defenseAptitude || 1000,
          magicAptitude: pet.magicAptitude || 1000,
        } : null
        const battleStats = calculateBattleStats(
          {
            strength: tempAttributes.strength,
            constitution: tempAttributes.constitution,
            spirit: tempAttributes.spirit,
            agility: tempAttributes.agility,
          },
          pet.level,
          null,
          {},
          petStats
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

  // 计算预览属性（考虑宠物资质和成长性）
  const previewStats = selectedPet && tempAttributes ? (() => {
    const petStats = selectedPet.growth ? {
      growth: selectedPet.growth,
      attackAptitude: selectedPet.attackAptitude || 1000,
      defenseAptitude: selectedPet.defenseAptitude || 1000,
      magicAptitude: selectedPet.magicAptitude || 1000,
    } : null
    return calculateBattleStats(
      {
        strength: tempAttributes.strength,
        constitution: tempAttributes.constitution,
        spirit: tempAttributes.spirit,
        agility: tempAttributes.agility,
      },
      selectedPet.level,
      null,
      {},
      petStats
    )
  })() : null

  // 使用成长丹（示例：id 为 'pet_growth_pill' 的道具）提升成长性
  const handleUseGrowthPill = () => {
    if (!selectedPet) return
    const pillId = 'pet_growth_pill'
    const count = (inventory && inventory[pillId]) || 0
    if (count <= 0) {
      addLog('没有可用的成长丹')
      return
    }

    const updatedPets = pets.map(pet => {
      if (pet.id !== selectedPet.id) return pet
      const currentGrowth = pet.growth || 1000
      return {
        ...pet,
        growth: currentGrowth + 50, // 每颗成长丹 +50 成长
      }
    })

    setPets(updatedPets)
    setInventory(prev => ({
      ...(prev || {}),
      [pillId]: Math.max(0, ((prev || {})[pillId] || 0) - 1),
    }))
    const med = getMedicineById(pillId) || { name: '成长丹' }
    addLog(`为 ${selectedPet.name} 使用了 ${med.name}，成长性提升`)
    const updatedPet = updatedPets.find(p => p.id === selectedPet.id)
    setSelectedPet(updatedPet || selectedPet)
  }

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
              [...pets]
                .slice()
                .sort((a, b) => {
                  // 先按是否上阵排序（当前上阵的排最前）
                  if (activePet?.id === a.id && activePet?.id !== b.id) return -1
                  if (activePet?.id === b.id && activePet?.id !== a.id) return 1
                  // 再按等级从高到低
                  return (b.level || 1) - (a.level || 1)
                })
                .map(pet => (
                <div
                  key={pet.id}
                  className={`pet-item ${selectedPet?.id === pet.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPet(pet)}
                >
                  <div className="pet-item-name">
                    {activePet?.id === pet.id && <span className="active-tag">上阵</span>}
                    {elementIcons[pet.element]} {pet.name}
                    {pet.isDivine && <span className="divine-badge">神兽</span>}
                  </div>
                  <div className="pet-item-element">
                    等级: {pet.level}
                    {typeof pet.exp === 'number' && typeof pet.expMax === 'number' && (
                      <span className="pet-exp-brief">
                        （{pet.exp}/{pet.expMax}）
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {selectedPet && tempAttributes && (
            <div className="pet-detail">
              <h3>
                {elementIcons[selectedPet.element]} {selectedPet.name}
                {selectedPet.isDivine && <span className="divine-badge">神兽</span>}
              </h3>
              {selectedPet.isDivine && (
                <div className="divine-stats">
                  <div>成长性: {selectedPet.growth || 1000}</div>
                  <div>攻击资质: {selectedPet.attackAptitude || 1000}</div>
                  <div>防御资质: {selectedPet.defenseAptitude || 1000}</div>
                  <div>法力资质: {selectedPet.magicAptitude || 1000}</div>
                </div>
              )}
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
                <div className="stat-item">
                  <span className="stat-label">经验:</span>
                  <span>
                    {(selectedPet.exp || 0) + (selectedPet.storedExp || 0)}/
                    {selectedPet.expMax}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">成长性:</span>
                  <span>{selectedPet.growth || 1000}</span>
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
              <div className="pet-actions">
                <button className="btn btn-primary" onClick={savePetAttributes}>
                  保存属性
                </button>
                <button
                  className={`btn ${activePet?.id === selectedPet.id ? 'btn-secondary' : 'btn-success'}`}
                  onClick={() => {
                    if (activePet?.id === selectedPet.id) {
                      setActivePet(null)
                    } else {
                      // 从 pets 数组中获取最新的宠物数据
                      const latestPet = pets.find(p => p.id === selectedPet.id)
                      if (latestPet) {
                        setActivePet(latestPet)
                      }
                    }
                  }}
                >
                  {activePet?.id === selectedPet.id ? '下阵' : '上阵'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleUseGrowthPill}
                  title="消耗成长丹提升成长性（需要背包中有成长丹道具）"
                >
                  使用成长丹
                </button>
              </div>
              {activePet?.id === selectedPet.id && (
                <div className="pet-skill-config">
                  <h4>自动战斗技能配置</h4>
                  <div className="pet-ai-mode-row">
                    <span>宠物战斗风格:</span>
                    <select
                      className="ai-mode-select"
                      value={petAiMode}
                      onChange={(e) => setPetAiMode(e.target.value)}
                    >
                      <option value="aggressive">偏进攻</option>
                      <option value="balanced">均衡</option>
                      <option value="defensive">偏保守</option>
                    </select>
                  </div>
                  <div className="auto-skill-selector">
                    <span>宠物优先技能:</span>
                    <select
                      className="skill-select"
                      value={autoSettings.autoPetSkillId ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        // 保持原始类型（字符串或数字）
                        setAutoSettings(prev => ({
                          ...prev,
                          autoPetSkillId: value ? (isNaN(value) ? value : Number(value)) : null,
                        }))
                      }}
                    >
                      <option value="">普通攻击</option>
                      {(selectedPet.skills || []).map(skill => (
                        <option key={skill.id} value={skill.id}>
                          {elementIcons[skill.element]} {skill.name} ({skill.mpCost}MP)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
          {activePet && (() => {
            // 从 pets 数组中获取最新的宠物数据
            const latestActivePet = pets.find(p => p.id === activePet.id) || activePet
            return (
              <div className="active-pet-info">
                <h4>当前上阵宠物</h4>
                <div className="active-pet-card">
                  {elementIcons[latestActivePet.element]} {latestActivePet.name} (Lv.{latestActivePet.level})
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export default PetPanel
