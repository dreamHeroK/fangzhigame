import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { saveGameData, loadGameData, clearGameData, hasSavedGame as checkHasSavedGame } from '../utils/storage'

const GameContext = createContext()
const defaultAutoSettings = {
  autoBattle: false,
  autoSkillId: null,
  autoCapture: false,
  autoChainBattle: false,
  autoPetSkillId: null,
}

export function GameProvider({ children }) {
  const [player, setPlayer] = useState(null)
  const [monsters, setMonsters] = useState([])
  const [pets, setPets] = useState([])
  const [inBattle, setInBattle] = useState(false)
  const [playerTurn, setPlayerTurn] = useState(true)
  const [selectedMonster, setSelectedMonster] = useState(null)
  const [battleLog, setBattleLog] = useState([])
  const [currentMap, setCurrentMap] = useState('揽仙镇') // 当前地图
  const [money, setMoney] = useState(1000) // 金钱
  const [inventory, setInventory] = useState({}) // 物品库存 {itemId: count}
  const [elementPoints, setElementPoints] = useState({ gold: 0, wood: 0, water: 0, fire: 0, earth: 0 }) // 相性点
  const [equipmentInventory, setEquipmentInventory] = useState([]) // 装备背包
  const [equippedItems, setEquippedItems] = useState({}) // 已装备 {slot: equipment}
  const [isLoaded, setIsLoaded] = useState(false) // 是否已加载存档
  const [saveVersion, setSaveVersion] = useState(0) // 用于触发hasSavedGame重新计算
  const [autoSettings, setAutoSettings] = useState({ ...defaultAutoSettings })
  const [redeemStatus, setRedeemStatus] = useState({ godMode: false, tripleSpeed: false })
  const [beginnerRewardClaimed, setBeginnerRewardClaimed] = useState(false)
  const [activePet, setActivePet] = useState(null) // 当前上阵的宠物

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setBattleLog(prev => [...prev, `[${timestamp}] ${message}`])
  }

  // 自动保存游戏数据
  const autoSave = useCallback(() => {
    if (!player) return // 如果没有玩家，不保存
    
    saveGameData({
      player,
      pets,
      currentMap,
      money,
      inventory,
      elementPoints,
      equipmentInventory,
      equippedItems,
      autoSettings,
      redeemStatus,
      beginnerRewardClaimed,
      activePet,
    })
    setSaveVersion(v => v + 1) // 更新版本号，触发hasSavedGame重新计算
  }, [player, pets, currentMap, money, inventory, elementPoints, equipmentInventory, equippedItems, autoSettings, redeemStatus, beginnerRewardClaimed, activePet])

  // 加载游戏数据
  const loadGame = useCallback(() => {
    const savedData = loadGameData()
    if (savedData) {
      setPlayer(savedData.player)
      setPets(savedData.pets || [])
      setCurrentMap(savedData.currentMap || '揽仙镇')
      setMoney(savedData.money || 1000)
      setInventory(savedData.inventory || {})
      setElementPoints(savedData.elementPoints || { gold: 0, wood: 0, water: 0, fire: 0, earth: 0 })
      setEquipmentInventory(savedData.equipmentInventory || [])
      setEquippedItems(savedData.equippedItems || {})
      setAutoSettings(savedData.autoSettings || { ...defaultAutoSettings })
      setRedeemStatus(savedData.redeemStatus || { godMode: false, tripleSpeed: false })
      setBeginnerRewardClaimed(!!savedData.beginnerRewardClaimed)
      setActivePet(savedData.activePet || null)
      setSaveVersion(v => v + 1) // 更新版本号
      return true
    }
    return false
  }, [])

  // 重置游戏（注销功能）
  const resetGame = useCallback(() => {
    // 清除所有状态
    setPlayer(null)
    setPets([])
    setMonsters([])
    setInBattle(false)
    setPlayerTurn(true)
    setSelectedMonster(null)
    setBattleLog([])
    setCurrentMap('揽仙镇')
    setMoney(1000)
    setInventory({})
    setElementPoints({ gold: 0, wood: 0, water: 0, fire: 0, earth: 0 })
    setEquipmentInventory([])
    setEquippedItems({})
    setAutoSettings({ ...defaultAutoSettings })
    setRedeemStatus({ godMode: false, tripleSpeed: false })
    setBeginnerRewardClaimed(false)
    setActivePet(null)
    
    // 清除本地存储
    clearGameData()
    setSaveVersion(v => v + 1)
  }, [])

  // 初始化时尝试加载存档
  useEffect(() => {
    if (!isLoaded) {
      loadGame()
      setIsLoaded(true)
    }
  }, [isLoaded, loadGame])

  // 每5分钟清理一次战斗日志
  useEffect(() => {
    const clearLogInterval = setInterval(() => {
      setBattleLog([])
    }, 5 * 60 * 1000) // 5分钟 = 300000毫秒

    return () => {
      clearInterval(clearLogInterval)
    }
  }, [])

  // 当关键数据变化时自动保存（延迟保存，避免频繁写入）
  useEffect(() => {
    if (!player || !isLoaded) return
    
    const timer = setTimeout(() => {
      autoSave()
    }, 1000) // 1秒后保存，避免频繁写入

    return () => clearTimeout(timer)
  }, [player, pets, currentMap, money, inventory, elementPoints, equipmentInventory, equippedItems, autoSave, isLoaded])

  return (
    <GameContext.Provider
      value={{
        player,
        setPlayer,
        monsters,
        setMonsters,
        pets,
        setPets,
        inBattle,
        setInBattle,
        playerTurn,
        setPlayerTurn,
        selectedMonster,
        setSelectedMonster,
        battleLog,
        addLog,
        currentMap,
        setCurrentMap,
        money,
        setMoney,
        inventory,
        setInventory,
        elementPoints,
        setElementPoints,
        equipmentInventory,
        setEquipmentInventory,
        equippedItems,
        setEquippedItems,
        autoSave,
        loadGame,
        autoSettings,
        setAutoSettings,
        redeemStatus,
        setRedeemStatus,
        beginnerRewardClaimed,
        setBeginnerRewardClaimed,
        activePet,
        setActivePet,
        resetGame,
        hasSavedGame: useMemo(() => checkHasSavedGame(), [saveVersion]),
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

