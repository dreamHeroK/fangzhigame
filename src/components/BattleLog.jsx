import { useGame } from '../context/GameContext'
import './BattleLog.css'

function BattleLog() {
  const { battleLog } = useGame()

  return (
    <div className="log-area">
      {battleLog.length === 0 ? (
        <div className="log-empty">战斗日志将显示在这里...</div>
      ) : (
        battleLog.map((entry, index) => (
          <div key={index} className="log-entry">
            {entry}
          </div>
        ))
      )}
    </div>
  )
}

export default BattleLog

