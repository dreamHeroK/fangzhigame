import { useState, useRef } from 'react'
import { useGame } from '../context/GameContext'
import { exportGameData, importGameData, clearGameData } from '../utils/storage'
import './SaveLoadPanel.css'

function SaveLoadPanel({ onClose }) {
  const {
    player,
    pets,
    currentMap,
    money,
    inventory,
    elementPoints,
    equipmentInventory,
    equippedItems,
    autoSave,
    loadGame,
    hasSavedGame,
    setPlayer,
    setPets,
    setCurrentMap,
    setMoney,
    setInventory,
    setElementPoints,
    setEquipmentInventory,
    setEquippedItems,
  } = useGame()

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'
  const fileInputRef = useRef(null)

  const showMessage = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 3000)
  }

  // 手动保存
  const handleSave = () => {
    if (!player) {
      showMessage('没有游戏数据可保存', 'error')
      return
    }

    autoSave()
    showMessage('游戏数据已保存到本地！')
  }

  // 加载存档
  const handleLoad = () => {
    if (!hasSavedGame) {
      showMessage('没有找到保存的游戏数据', 'error')
      return
    }

    if (window.confirm('加载存档将覆盖当前游戏进度，确定要继续吗？')) {
      const success = loadGame()
      if (success) {
        showMessage('游戏数据已加载！')
        onClose()
      } else {
        showMessage('加载游戏数据失败', 'error')
      }
    }
  }

  // 导出游戏数据
  const handleExport = () => {
    if (!player) {
      showMessage('没有游戏数据可导出', 'error')
      return
    }

    try {
      const jsonData = exportGameData({
        player,
        pets,
        currentMap,
        money,
        inventory,
        elementPoints,
        equipmentInventory,
        equippedItems,
      })

      if (!jsonData) {
        showMessage('导出失败', 'error')
        return
      }

      // 创建下载链接
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wendao_save_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showMessage('游戏数据已导出！')
    } catch (error) {
      console.error('导出失败:', error)
      showMessage('导出失败: ' + error.message, 'error')
    }
  }

  // 导入游戏数据
  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonString = e.target.result
        const gameData = importGameData(jsonString)

        if (window.confirm('导入存档将覆盖当前游戏进度，确定要继续吗？')) {
          // 更新游戏状态
          setPlayer(gameData.player)
          setPets(gameData.pets || [])
          setCurrentMap(gameData.currentMap || '揽仙镇')
          setMoney(gameData.money || 1000)
          setInventory(gameData.inventory || {})
          setElementPoints(gameData.elementPoints || { gold: 0, wood: 0, water: 0, fire: 0, earth: 0 })
          setEquipmentInventory(gameData.equipmentInventory || [])
          setEquippedItems(gameData.equippedItems || {})

          // 保存到本地存储
          autoSave()

          showMessage('游戏数据已导入！')
          onClose()
        }
      } catch (error) {
        console.error('导入失败:', error)
        showMessage('导入失败: ' + error.message, 'error')
      }
    }
    reader.onerror = () => {
      showMessage('读取文件失败', 'error')
    }
    reader.readAsText(file)

    // 清空文件输入
    event.target.value = ''
  }

  // 清除存档
  const handleClear = () => {
    if (!hasSavedGame) {
      showMessage('没有保存的游戏数据', 'error')
      return
    }

    if (window.confirm('确定要清除所有本地存档吗？此操作不可恢复！')) {
      clearGameData()
      showMessage('本地存档已清除！')
    }
  }

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content save-load-panel" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>存档管理</h2>

        {message && (
          <div className={`save-load-message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="save-load-buttons">
          <button className="btn btn-primary" onClick={handleSave}>
            保存游戏
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={handleLoad}
            disabled={!hasSavedGame}
          >
            加载存档
          </button>

          <button className="btn btn-export" onClick={handleExport}>
            导出存档
          </button>

          <button className="btn btn-import" onClick={handleImport}>
            导入存档
          </button>

          <button 
            className="btn btn-danger" 
            onClick={handleClear}
            disabled={!hasSavedGame}
          >
            清除存档
          </button>
        </div>

        <div className="save-load-info">
          <p>• 游戏数据会自动保存到浏览器本地存储</p>
          <p>• 导出存档可以备份到其他设备</p>
          <p>• 导入存档会覆盖当前游戏进度</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}

export default SaveLoadPanel

