import { useGame } from '../context/GameContext'
import { maps } from '../utils/maps'
import './MapPanel.css'

function MapPanel() {
  const { currentMap, setCurrentMap, inBattle } = useGame()
  const currentMapData = maps[currentMap]

  const handleMapChange = (mapName) => {
    if (inBattle) {
      alert('战斗中无法切换地图！')
      return
    }
    setCurrentMap(mapName)
  }

  return (
    <div className="map-panel">
      <div className="current-map">
        <h3>当前地图: {currentMapData.name}</h3>
        <p className="map-description">{currentMapData.description}</p>
        {currentMapData.type === 'safe' && (
          <span className="map-badge safe">安全区</span>
        )}
        {currentMapData.type === 'wild' && (
          <span className="map-badge wild">野外</span>
        )}
      </div>
      <div className="connected-maps">
        <h4>可前往:</h4>
        {currentMapData.connectedMaps.map(mapName => (
          <button
            key={mapName}
            className="map-button"
            onClick={() => handleMapChange(mapName)}
            disabled={inBattle}
          >
            {maps[mapName].name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default MapPanel

