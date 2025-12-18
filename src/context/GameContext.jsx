import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  const [isHealing, setIsHealing] = useState(false) // 是否在接受治疗（期间禁止其他行动）

  // 使用 ref 作为“单一数据源”，state 只用于触发 UI 刷新
  const playerRef = useRef(player)
  const monstersRef = useRef(monsters)
  const petsRef = useRef(pets)
  const currentMapRef = useRef(currentMap)
  const moneyRef = useRef(money)
  const inventoryRef = useRef(inventory)
  const elementPointsRef = useRef(elementPoints)
  const equipmentInventoryRef = useRef(equipmentInventory)
  const equippedItemsRef = useRef(equippedItems)
  const autoSettingsRef = useRef(autoSettings)
  const redeemStatusRef = useRef(redeemStatus)
  const beginnerRewardClaimedRef = useRef(beginnerRewardClaimed)
  const activePetRef = useRef(activePet)
  const isHealingRef = useRef(isHealing)

  // 统一封装 setter：先更新 ref，再更新 state（用于触发渲染）
  const wrapStateWithRef = (ref, setState) =>
    (updater) => {
      if (typeof updater === 'function') {
        setState((prev) => {
          const next = updater(prev)
          ref.current = next
          return next
        })
      } else {
        ref.current = updater
        setState(updater)
      }
    }

  // 带 ref 同步的 setter（除 player 外统一使用）
  const setMonstersWithRef = useCallback(wrapStateWithRef(monstersRef, setMonsters), [])
  const setPetsWithRef = useCallback(wrapStateWithRef(petsRef, setPets), [])
  const setCurrentMapWithRef = useCallback(wrapStateWithRef(currentMapRef, setCurrentMap), [])
  const setMoneyWithRef = useCallback(wrapStateWithRef(moneyRef, setMoney), [])
  const setInventoryWithRef = useCallback(wrapStateWithRef(inventoryRef, setInventory), [])
  const setElementPointsWithRef = useCallback(wrapStateWithRef(elementPointsRef, setElementPoints), [])
  const setEquipmentInventoryWithRef = useCallback(wrapStateWithRef(equipmentInventoryRef, setEquipmentInventory), [])
  const setEquippedItemsWithRef = useCallback(wrapStateWithRef(equippedItemsRef, setEquippedItems), [])
  const setAutoSettingsWithRef = useCallback(wrapStateWithRef(autoSettingsRef, setAutoSettings), [])
  const setRedeemStatusWithRef = useCallback(wrapStateWithRef(redeemStatusRef, setRedeemStatus), [])
  const setBeginnerRewardClaimedWithRef = useCallback(wrapStateWithRef(beginnerRewardClaimedRef, setBeginnerRewardClaimed), [])
  const setActivePetWithRef = useCallback(wrapStateWithRef(activePetRef, setActivePet), [])

  // 统一包装 setPlayer，便于排查是谁在改 player（尤其是覆盖 exp 的情况）
  const loggedSetPlayer = useCallback(
    (updater) => {
      if (typeof updater === 'function') {
        setPlayer((prev) => {
          const next = updater(prev)
          console.log('loggedSetPlayer: updater returned, next=', next, 'next.exp=', next?.exp)
          // 同步更新 ref，确保 autoSave 等地方拿到的是最新的值
          if (next) {
            const oldExp = playerRef.current?.exp
            playerRef.current = next
            console.log('loggedSetPlayer: updated playerRef.current.exp from', oldExp, 'to', next.exp, 'playerRef.current=', playerRef.current)
          } else {
            console.log('loggedSetPlayer: WARNING - next is null/undefined!')
            playerRef.current = null
          }
          // 只在 exp 变化时打印，避免刷屏
          if (prev?.exp !== next?.exp) {
            console.log('setPlayer (functional) called, exp change:', {
              prevExp: prev?.exp,
              nextExp: next?.exp,
              playerRefExp: playerRef.current?.exp,
            })
          }
          return next
        })
      } else {
        // 直接赋值的情况（例如从存档载入 / 导入存档）
        console.log('setPlayer (direct) called:', {
          prevExp: playerRef.current?.exp,
          nextExp: updater?.exp,
        })
        playerRef.current = updater || null
        setPlayer(updater || null)
      }
    },
    []
  )

  // 为了避免调试时看到旧的 state 快照，这里统一打印 playerRef.current（如果有）
  console.log(playerRef.current || player, 'player')
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setBattleLog(prev => [...prev, `[${timestamp}] ${message}`])
  }

  // 自动保存游戏数据（使用 ref 确保使用最新状态）
  const autoSave = useCallback(() => {
    const currentPlayer = playerRef.current
    if (!currentPlayer) return // 如果没有玩家，不保存
    console.log('autoSave, playerRef.current.exp=', currentPlayer.exp, 'player state.exp=', player?.exp)
    saveGameData({
      player: currentPlayer,
      pets: petsRef.current,
      currentMap: currentMapRef.current,
      money: moneyRef.current,
      inventory: inventoryRef.current,
      elementPoints: elementPointsRef.current,
      equipmentInventory: equipmentInventoryRef.current,
      equippedItems: equippedItemsRef.current,
      autoSettings: autoSettingsRef.current,
      redeemStatus: redeemStatusRef.current,
      beginnerRewardClaimed: beginnerRewardClaimedRef.current,
      activePet: activePetRef.current,
      isHealing: isHealingRef.current,
    })
    setSaveVersion(v => v + 1) // 更新版本号，触发hasSavedGame重新计算
  }, [])

  // 加载游戏数据
  const loadGame = useCallback(() => {
    console.log('loadGame')
    const savedData = loadGameData()
    if (savedData) {
      loggedSetPlayer(savedData.player)
      setPetsWithRef(savedData.pets || [])
      setCurrentMapWithRef(savedData.currentMap || '揽仙镇')
      setMoneyWithRef(savedData.money || 1000)
      setInventoryWithRef(savedData.inventory || {})
      setElementPointsWithRef(savedData.elementPoints || { gold: 0, wood: 0, water: 0, fire: 0, earth: 0 })
      setEquipmentInventoryWithRef(savedData.equipmentInventory || [])
      setEquippedItemsWithRef(savedData.equippedItems || {})
      setAutoSettingsWithRef(savedData.autoSettings || { ...defaultAutoSettings })
      setRedeemStatusWithRef(savedData.redeemStatus || { godMode: false, tripleSpeed: false })
      setBeginnerRewardClaimedWithRef(!!savedData.beginnerRewardClaimed)
      setActivePetWithRef(savedData.activePet || null)
      setIsHealing(false)
      setSaveVersion(v => v + 1) // 更新版本号
      return true
    }
    return false
  }, [])

  // 重置游戏（注销功能）
  const resetGame = useCallback(() => {
    // 清除所有状态
    loggedSetPlayer(null)
    setPetsWithRef([])
    setMonstersWithRef([])
    setInBattle(false)
    setPlayerTurn(true)
    setSelectedMonster(null)
    setBattleLog([])
    setCurrentMapWithRef('揽仙镇')
    setMoneyWithRef(1000)
    setInventoryWithRef({})
    setElementPointsWithRef({ gold: 0, wood: 0, water: 0, fire: 0, earth: 0 })
    setEquipmentInventoryWithRef([])
    setEquippedItemsWithRef({})
    setAutoSettingsWithRef({ ...defaultAutoSettings })
    setRedeemStatusWithRef({ godMode: false, tripleSpeed: false })
    setBeginnerRewardClaimedWithRef(false)
    setActivePetWithRef(null)
    
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

  // 对外暴露的 player 始终以 ref 为主（如果有），避免因为异步状态导致读取到旧的 player
  const exposedPlayer = playerRef.current || player

  // 接受治疗：20 秒内禁止行动，结束时回满血/法力
  const startHealing = useCallback(() => {
    if (!exposedPlayer || isHealingRef.current) return
    isHealingRef.current = true
    setIsHealing(true)

    setTimeout(() => {
      const current = playerRef.current || exposedPlayer
      if (!current) {
        isHealingRef.current = false
        setIsHealing(false)
        return
      }
      loggedSetPlayer(prev => {
        if (!prev) return prev
        return {
          ...prev,
          hp: prev.maxHp,
          mp: prev.maxMp,
        }
      })
      isHealingRef.current = false
      setIsHealing(false)
    }, 20000)
  }, [exposedPlayer, loggedSetPlayer])

  return (
    <GameContext.Provider
      value={{
        // 对外暴露的实体：仍然提供 state 版本用于触发组件重渲染
        player: exposedPlayer,
        // 对外暴露带日志的 setPlayer，方便定位覆盖来源
        setPlayer: loggedSetPlayer,
        monsters,
        setMonsters: setMonstersWithRef,
        pets,
        setPets: setPetsWithRef,
        inBattle,
        setInBattle,
        playerTurn,
        setPlayerTurn,
        selectedMonster,
        setSelectedMonster,
        battleLog,
        addLog,
        currentMap,
        setCurrentMap: setCurrentMapWithRef,
        money,
        setMoney: setMoneyWithRef,
        inventory,
        setInventory: setInventoryWithRef,
        elementPoints,
        setElementPoints: setElementPointsWithRef,
        equipmentInventory,
        setEquipmentInventory: setEquipmentInventoryWithRef,
        equippedItems,
        setEquippedItems: setEquippedItemsWithRef,
        autoSave,
        loadGame,
        autoSettings,
        setAutoSettings: setAutoSettingsWithRef,
        redeemStatus,
        setRedeemStatus: setRedeemStatusWithRef,
        beginnerRewardClaimed,
        setBeginnerRewardClaimed: setBeginnerRewardClaimedWithRef,
        activePet,
        setActivePet: setActivePetWithRef,
        isHealing,
        startHealing,
        resetGame,
        hasSavedGame: useMemo(() => checkHasSavedGame(), [saveVersion]),

        // 同时暴露 ref，便于需要“最新值”（长生命周期回调 / 定时器等）的逻辑使用
        playerRef,
        monstersRef,
        petsRef,
        currentMapRef,
        moneyRef,
        inventoryRef,
        elementPointsRef,
        equipmentInventoryRef,
        equippedItemsRef,
        autoSettingsRef,
        redeemStatusRef,
        beginnerRewardClaimedRef,
        activePetRef,
        isHealingRef,
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

