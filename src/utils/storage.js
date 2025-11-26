// 游戏数据存储工具
// 使用localStorage + 简单加密

const STORAGE_KEY = 'wendao_game_data'
const ENCRYPTION_KEY = 'wendao_2024_secret_key' // 简单的加密密钥

/**
 * 简单的字符串加密（XOR加密）
 */
function encrypt(text, key) {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result += String.fromCharCode(charCode)
  }
  return btoa(result) // Base64编码
}

/**
 * 简单的字符串解密
 */
function decrypt(encryptedText, key) {
  try {
    const text = atob(encryptedText) // Base64解码
    let result = ''
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    return result
  } catch (error) {
    console.error('解密失败:', error)
    return null
  }
}

/**
 * 保存游戏数据到localStorage
 */
export function saveGameData(gameData) {
  try {
    // 只保存需要持久化的数据
    const dataToSave = {
      player: gameData.player,
      pets: gameData.pets || [],
      currentMap: gameData.currentMap || '揽仙镇',
      money: gameData.money || 1000,
      inventory: gameData.inventory || {},
      elementPoints: gameData.elementPoints || { gold: 0, wood: 0, water: 0, fire: 0, earth: 0 },
      equipmentInventory: gameData.equipmentInventory || [],
      equippedItems: gameData.equippedItems || {},
      version: '1.0.0', // 数据版本号
      saveTime: new Date().toISOString(),
    }

    const jsonString = JSON.stringify(dataToSave)
    const encrypted = encrypt(jsonString, ENCRYPTION_KEY)
    
    localStorage.setItem(STORAGE_KEY, encrypted)
    return true
  } catch (error) {
    console.error('保存游戏数据失败:', error)
    return false
  }
}

/**
 * 从localStorage加载游戏数据
 */
export function loadGameData() {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY)
    if (!encrypted) {
      return null
    }

    const decrypted = decrypt(encrypted, ENCRYPTION_KEY)
    if (!decrypted) {
      return null
    }

    const gameData = JSON.parse(decrypted)
    return gameData
  } catch (error) {
    console.error('加载游戏数据失败:', error)
    return null
  }
}

/**
 * 清除游戏数据
 */
export function clearGameData() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('清除游戏数据失败:', error)
    return false
  }
}

/**
 * 导出游戏数据为JSON字符串（未加密，用于导出功能）
 */
export function exportGameData(gameData) {
  try {
    const dataToExport = {
      player: gameData.player,
      pets: gameData.pets || [],
      currentMap: gameData.currentMap || '揽仙镇',
      money: gameData.money || 1000,
      inventory: gameData.inventory || {},
      elementPoints: gameData.elementPoints || { gold: 0, wood: 0, water: 0, fire: 0, earth: 0 },
      equipmentInventory: gameData.equipmentInventory || [],
      equippedItems: gameData.equippedItems || {},
      version: '1.0.0',
      exportTime: new Date().toISOString(),
    }

    return JSON.stringify(dataToExport, null, 2)
  } catch (error) {
    console.error('导出游戏数据失败:', error)
    return null
  }
}

/**
 * 导入游戏数据（从JSON字符串）
 */
export function importGameData(jsonString) {
  try {
    const gameData = JSON.parse(jsonString)
    
    // 验证数据格式
    if (!gameData.player) {
      throw new Error('无效的游戏数据：缺少玩家信息')
    }

    return gameData
  } catch (error) {
    console.error('导入游戏数据失败:', error)
    throw error
  }
}

/**
 * 检查是否有保存的游戏数据
 */
export function hasSavedGame() {
  return localStorage.getItem(STORAGE_KEY) !== null
}

