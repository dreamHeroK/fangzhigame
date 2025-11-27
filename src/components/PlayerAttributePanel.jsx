import { useState } from 'react'
import { useGame } from '../context/GameContext'
import AttributePanel from './AttributePanel'
import ElementPanel from './ElementPanel'
import './PlayerAttributePanel.css'

function PlayerAttributePanel({ onClose }) {
  const { player, setPlayer } = useGame()
  const [activeTab, setActiveTab] = useState('attributes') // 'attributes' or 'elements'
  const [showNameEdit, setShowNameEdit] = useState(false)
  const [newName, setNewName] = useState(player?.name || '')

  if (!player) return null

  const handleNameChange = () => {
    if (newName.trim()) {
      setPlayer({ ...player, name: newName.trim() })
      setShowNameEdit(false)
    }
  }

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content player-attribute-panel" onClick={(e) => e.stopPropagation()}>
        <div className="player-attribute-layout">
          <div className="player-attribute-header">
            <span className="close" onClick={onClose}>
              &times;
            </span>
            <h2>人物属性</h2>
            <div className="player-name-section">
              {showNameEdit ? (
                <div className="name-edit">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleNameChange()}
                    autoFocus
                    maxLength={20}
                  />
                  <button className="btn btn-small btn-primary" onClick={handleNameChange}>
                    确定
                  </button>
                  <button className="btn btn-small btn-secondary" onClick={() => {
                    setNewName(player.name)
                    setShowNameEdit(false)
                  }}>
                    取消
                  </button>
                </div>
              ) : (
                <div className="name-display">
                  <span className="player-name">{player.name}</span>
                  <button className="btn btn-small btn-edit" onClick={() => {
                    setNewName(player.name)
                    setShowNameEdit(true)
                  }}>
                    编辑
                  </button>
                </div>
              )}
            </div>
            <div className="player-attribute-tabs">
              <button
                className={`tab-btn ${activeTab === 'attributes' ? 'active' : ''}`}
                onClick={() => setActiveTab('attributes')}
              >
                属性加点
              </button>
              <button
                className={`tab-btn ${activeTab === 'elements' ? 'active' : ''}`}
                onClick={() => setActiveTab('elements')}
              >
                相性点
              </button>
            </div>
          </div>

          <div className="player-attribute-content scrollable">
            {activeTab === 'attributes' ? (
              <AttributePanel onClose={onClose} embedded={true} />
            ) : (
              <ElementPanel onClose={onClose} embedded={true} />
            )}
          </div>

          <div className="player-attribute-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerAttributePanel

