import { useGame } from '../context/GameContext'
import './BattleArea.css'

const elementIcons = {
  '金': '⚡',
  '木': '🌲',
  '水': '💧',
  '火': '🔥',
  '土': '⛰️'
}

// 怪物图标（如果有自定义图标则使用，否则使用元素图标）
function getMonsterIcon(monster) {
  return monster.icon || elementIcons[monster.element] || '👹'
}

function BattleArea() {
  const { monsters, selectedMonster, setSelectedMonster, inBattle, playerTurn } = useGame()
  const monsterList = Array.isArray(monsters) ? monsters : []

  const handleMonsterClick = (monster) => {
    if (inBattle && playerTurn && monster.hp > 0) {
      setSelectedMonster(monster)
    }
  }

  return (
    <div className="battle-area">
      <div className="monsters-container">
        {monsterList.length === 0 ? (
          <div className="no-monsters">点击"开始战斗"开始游戏</div>
        ) : (
          monsterList.map(monster => {
            if (monster.hp <= 0) return null
            
            const hpPercent = (monster.hp / monster.maxHp) * 100
            const isSelected = selectedMonster?.id === monster.id
            const isDead = monster.hp <= 0

            return (
              <div
                key={monster.id}
                className={`monster ${isSelected ? 'selected' : ''} ${isDead ? 'dead' : ''}`}
                onClick={() => handleMonsterClick(monster)}
              >
                <div className="monster-name">
                  {getMonsterIcon(monster)} {monster.name}
                </div>
                <div>等级: {monster.level}</div>
                <div className="monster-hp">生命: {monster.hp}/{monster.maxHp}</div>
                <div className="monster-hp-bar">
                  <div
                    className="monster-hp-fill"
                    style={{ width: `${hpPercent}%` }}
                  ></div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default BattleArea

