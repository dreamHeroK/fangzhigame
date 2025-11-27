import { useEffect, useRef } from 'react'
import { useGame } from '../context/GameContext'
import './BattleLog.css'

function BattleLog() {
  const { battleLog } = useGame()
  const logAreaRef = useRef(null)
  const shouldAutoScrollRef = useRef(true)

  // 检查是否在底部
  const isScrolledToBottom = () => {
    if (!logAreaRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = logAreaRef.current
    return scrollHeight - scrollTop - clientHeight < 10 // 10px 容差
  }

  // 滚动到底部
  const scrollToBottom = () => {
    if (logAreaRef.current) {
      logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight
    }
  }

  // 监听滚动事件，判断用户是否手动滚动
  const handleScroll = () => {
    shouldAutoScrollRef.current = isScrolledToBottom()
  }

  // 当战斗日志更新时，如果之前在底部，自动滚动到底部
  useEffect(() => {
    if (shouldAutoScrollRef.current && logAreaRef.current) {
      // 使用 setTimeout 确保 DOM 更新后再滚动
      setTimeout(() => {
        scrollToBottom()
      }, 0)
    }
  }, [battleLog])

  return (
    <div 
      className="log-area" 
      ref={logAreaRef}
      onScroll={handleScroll}
    >
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

