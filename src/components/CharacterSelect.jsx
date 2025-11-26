import { useGame } from '../context/GameContext'
import { calculateBattleStats } from '../utils/attributeCalc'
import './CharacterSelect.css'

const elements = [
  { element: '金', icon: '⚡', name: '金系', desc: '10级后可拜入五龙山云霄洞' },
  { element: '木', icon: '🌲', name: '木系', desc: '10级后可拜入终南山玉柱洞' },
  { element: '水', icon: '💧', name: '水系', desc: '10级后可拜入凤凰山斗阙宫' },
  { element: '火', icon: '🔥', name: '火系', desc: '10级后可拜入乾元山金光洞' },
  { element: '土', icon: '⛰️', name: '土系', desc: '10级后可拜入骷髅山白骨洞' },
]

function CharacterSelect() {
  const { 
    setPlayer, 
    setMoney, 
    setInventory, 
    setElementPoints, 
    setEquipmentInventory, 
    setEquippedItems,
    loadGame,
    hasSavedGame 
  } = useGame()

  const handleSelect = (element) => {
    // 所有角色初始属性相同：力量、体质、灵力、敏捷各5点
    const baseAttrs = { 
      strength: 5,      // 力量
      constitution: 5,  // 体质
      spirit: 5,        // 灵力
      agility: 5        // 敏捷
    }
    
    // 计算初始战斗属性
    const battleStats = calculateBattleStats(baseAttrs, 1)
    
    const player = {
      element: element,
      name: `${element}系角色`,
      level: 1,
      exp: 0,
      expMax: 100,
      // 基础属性
      strength: baseAttrs.strength,
      constitution: baseAttrs.constitution,
      spirit: baseAttrs.spirit,
      agility: baseAttrs.agility,
      // 战斗属性（由基础属性计算得出）
      ...battleStats,
      hp: battleStats.maxHp,
      mp: battleStats.maxMp,
      points: 5,
      baseAttrs: { ...baseAttrs }, // 保存初始基础属性
      sect: null, // 门派
      skills: [], // 技能列表
    }

    setPlayer(player)
    
    // 初始化金钱和物品
    setMoney(1000)
    setInventory({
      'small_hp': 5, // 初始给5个小还丹
      'small_mp': 3, // 初始给3个回气丹
    })
    setElementPoints({ gold: 0, wood: 0, water: 0, fire: 0, earth: 0 })
    setEquipmentInventory([])
    setEquippedItems({})
  }

  const handleLoadGame = () => {
    if (hasSavedGame && window.confirm('确定要加载存档吗？这将覆盖当前选择。')) {
      loadGame()
    }
  }

  return (
    <div className="character-select">
      <div className="container">
        <h1>选择你的角色</h1>
        {hasSavedGame && (
          <div className="load-save-prompt">
            <button className="btn-load-save" onClick={handleLoadGame}>
              加载存档
            </button>
          </div>
        )}
        <div className="character-grid">
          {elements.map(({ element, icon, name, desc }) => (
            <div
              key={element}
              className="character-card"
              onClick={() => handleSelect(element)}
            >
              <div className={`character-icon ${element.toLowerCase()}`}>
                {icon}
              </div>
              <h3>{name}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CharacterSelect

