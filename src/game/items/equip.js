// 配置：装备生成核心参数
const EQUIP_CONFIG = {
    // 1. 等级段模板 (每10级一档)
    levelBrackets: [
      { min: 1, max: 9, suffix: "粗布", grade: 1, baseAtk: 50, baseDef: 10, color: "#AAAAAA" },
      { min: 10, max: 19, suffix: "青铜", grade: 2, baseAtk: 150, baseDef: 30, color: "#5A8E3A" },
      { min: 20, max: 29, suffix: "铁质", grade: 3, baseAtk: 300, baseDef: 60, color: "#3A7EAA" },
      { min: 30, max: 39, suffix: "精铁", grade: 4, baseAtk: 500, baseDef: 100, color: "#8E3A8E" },
      { min: 40, max: 49, suffix: "百炼", grade: 5, baseAtk: 750, baseDef: 150, color: "#AA5A3A" },
      { min: 50, max: 59, suffix: "寒冰", grade: 6, baseAtk: 1100, baseDef: 220, color: "#3AA3AA" },
      { min: 60, max: 69, suffix: "流光", grade: 7, baseAtk: 1550, baseDef: 310, color: "#AA3A3A" },
      { min: 70, max: 79, suffix: "蟠龙", grade: 8, baseAtk: 2100, baseDef: 420, color: "#3AAA5A" },
      { min: 80, max: 89, suffix: "乾坤", grade: 9, baseAtk: 2800, baseDef: 560, color: "#AA8E3A" },
      { min: 90, max: 99, suffix: "苍穹", grade: 10, baseAtk: 3600, baseDef: 720, color: "#5A3AAA" },
      { min: 100, max: 109, suffix: "混沌", grade: 11, baseAtk: 4500, baseDef: 900, color: "#AA5AAA" },
      { min: 110, max: 119, suffix: "鸿蒙", grade: 12, baseAtk: 5500, baseDef: 1100, color: "#3A5AAA" },
      { min: 120, max: 129, suffix: "无极", grade: 13, baseAtk: 6600, baseDef: 1320, color: "#AAAA5A" },
      { min: 130, max: 139, suffix: "造化", grade: 14, baseAtk: 7800, baseDef: 1560, color: "#5AAAAA" },
      { min: 140, max: 149, suffix: "天道", grade: 15, baseAtk: 9100, baseDef: 1820, color: "#FFAA00" },
      { min: 150, max: 150, suffix: "问道", grade: 16, baseAtk: 10500, baseDef: 2100, color: "#FF5500" }
    ],
    
    // 2. 部位定义
    positions: [
      { id: "weapon", name: "武器", type: "weapon", attrType: "atk" },
      { id: "hat", name: "帽子", type: "defense", attrType: "def" },
      { id: "cloth", name: "衣服", type: "defense", attrType: "def" },
      { id: "shoe", name: "鞋子", type: "defense", attrType: "def" },
      { id: "belt", name: "腰带", type: "jewelry", attrType: "hp" },
      { id: "necklace", name: "项链", type: "jewelry", attrType: "mp" },
      { id: "pendant", name: "玉佩", type: "jewelry", attrType: "resist" },
      { id: "bangle", name: "手镯", type: "jewelry", attrType: "atk" }
    ],
    
    // 3. 五行武器映射
    weaponType: {
      "金": "枪", "木": "爪", "水": "剑", "火": "扇", "土": "锤"
    },
    
    // 4. 品质配置
    qualities: [
      { id: "white", name: "普通", color: "#FFFFFF", weight: 60, attrCount: 0 },
      { id: "blue", name: "精良", color: "#3A8EFF", weight: 30, attrCount: 2 },
      { id: "pink", name: "稀有", color: "#FF3AAA", weight: 8, attrCount: 3 },
      { id: "gold", name: "传说", color: "#FFAA00", weight: 2, attrCount: 4 },
      { id: "green", name: "套装", color: "#3AAA3A", weight: 0, attrCount: 5 } // 特殊生成
    ],
    
    // 5. 随机属性池
    attributePool: {
      // 通用属性
      common: [
        { key: "maxHp", name: "气血", base: 10, factor: 5 },
        { key: "maxMp", name: "法力", base: 8, factor: 4 },
        { key: "def", name: "防御", base: 3, factor: 1.5 },
        { key: "speed", name: "速度", base: 2, factor: 1 }
      ],
      // 武器专属
      weapon: [
        { key: "accuracy", name: "准确", base: 5, factor: 2 },
        { key: "criticalRate", name: "必杀", base: 1, factor: 0.5, isPercent: true },
        { key: "doubleHitRate", name: "连击", base: 1, factor: 0.5, isPercent: true },
        { key: "counterRate", name: "反击", base: 1, factor: 0.5, isPercent: true },
        { key: "allSkillLevel", name: "所有技能", base: 1, factor: 0.5 }
      ],
      // 防具专属
      defense: [
        { key: "allResist", name: "所有抗性", base: 2, factor: 1, isPercent: true },
        { key: "allStatusResist", name: "所有异常抗性", base: 1, factor: 0.5, isPercent: true },
        { key: "absorbDamage", name: "伤害吸收", base: 1, factor: 0.3, isPercent: true }
      ],
      // 首饰专属
      jewelry: [
        { key: "allAttribute", name: "所有属性", base: 2, factor: 1 },
        { key: "allXiangXing", name: "所有相性", base: 1, factor: 0.5 },
        { key: "resistMetal", name: "抗金", base: 2, factor: 1, isPercent: true },
        { key: "resistWood", name: "抗木", base: 2, factor: 1, isPercent: true },
        { key: "resistWater", name: "抗水", base: 2, factor: 1, isPercent: true },
        { key: "resistFire", name: "抗火", base: 2, factor: 1, isPercent: true },
        { key: "resistEarth", name: "抗土", base: 2, factor: 1, isPercent: true }
      ]
    },
    
    // 6. 套装配置
    suits: [
      { id: 1, name: "力破千军", needCount: 3, bonus: { phyAtk: 150, criticalRate: 5 } },
      { id: 2, name: "法通天地", needCount: 3, bonus: { magAtk: 180, allSkillLevel: 2 } },
      { id: 3, name: "金刚不坏", needCount: 3, bonus: { def: 200, allResist: 8 } },
      { id: 4, name: "追风逐电", needCount: 3, bonus: { speed: 120, avoid: 5 } },
      { id: 5, name: "问道至尊", needCount: 5, bonus: { allXiangXing: 3, allAttribute: 20 } }
    ]
  };
  
  // 工具函数
  function getBracketByLevel(level) {
    return EQUIP_CONFIG.levelBrackets.find(b => level >= b.min && level <= b.max) || 
           EQUIP_CONFIG.levelBrackets[EQUIP_CONFIG.levelBrackets.length - 1];
  }
  
  function getPositionConfig(positionId) {
    return EQUIP_CONFIG.positions.find(p => p.id === positionId) || EQUIP_CONFIG.positions[0];
  }
  
  function getRandomQuality() {
    const totalWeight = EQUIP_CONFIG.qualities.reduce((sum, q) => sum + q.weight, 0);
    let random = Math.random() * totalWeight;
    for (const quality of EQUIP_CONFIG.qualities) {
      if (random < quality.weight) return quality;
      random -= quality.weight;
    }
    return EQUIP_CONFIG.qualities[0]; // 默认白色
  }
  
  function calculateBaseValue(bracket, position, wuxing) {
    const pos = getPositionConfig(position);
    const grade = bracket.grade;
    
    switch(pos.attrType) {
      case "atk":
        if (position === "weapon") {
          return Math.round(bracket.baseAtk + (grade - 1) * 80);
        } else if (position === "bangle") {
          return Math.round(bracket.baseAtk * 0.4 + (grade - 1) * 30);
        }
        break;
        
      case "def":
        if (position === "cloth") {
          return Math.round(bracket.baseDef + (grade - 1) * 30);
        } else {
          return Math.round(bracket.baseDef * 0.6 + (grade - 1) * 20);
        }
        
      case "hp":
        return Math.round(200 + grade * 100);
        
      case "mp":
        return Math.round(150 + grade * 80);
        
      case "resist":
        return Math.round(5 + grade * 2);
    }
    return 0;
  }
  
  function generateRandomAttributes(level, position, quality) {
    if (quality.attrCount <= 0) return {};
    
    const attributes = {};
    const pos = getPositionConfig(position);
    const grade = getBracketByLevel(level).grade;
    
    // 确定可用的属性池
    let pools = [...EQUIP_CONFIG.attributePool.common];
    if (pos.type === "weapon") pools = pools.concat(EQUIP_CONFIG.attributePool.weapon);
    if (pos.type === "defense") pools = pools.concat(EIP_CONFIG.attributePool.defense);
    if (pos.type === "jewelry") pools = pools.concat(EQUIP_CONFIG.attributePool.jewelry);
    
    // 防止重复属性
    const usedIndices = new Set();
    
    for (let i = 0; i < quality.attrCount; i++) {
      if (usedIndices.size >= pools.length) break;
      
      let index;
      do {
        index = Math.floor(Math.random() * pools.length);
      } while (usedIndices.has(index));
      usedIndices.add(index);
      
      const attr = pools[index];
      const value = Math.round(attr.base + (grade - 1) * attr.factor);
      
      attributes[attr.key] = {
        name: attr.name,
        value: value,
        isPercent: attr.isPercent || false
      };
    }
    
    return attributes;
  }
  
  function generateEquipName(level, position, wuxing = "水") {
    const bracket = getBracketByLevel(level);
    const pos = getPositionConfig(position);
    
    if (position === "weapon") {
      const weaponName = EQUIP_CONFIG.weaponType[wuxing] || "剑";
      return `${bracket.suffix}${weaponName}`;
    }
    
    // 其他部位
    const suffixMap = {
      "hat": "冠", "cloth": "袍", "shoe": "履", 
      "belt": "带", "necklace": "链", "pendant": "佩", "bangle": "镯"
    };
    
    return `${bracket.suffix}${suffixMap[position] || "物"}`;
  }
  
  // 主生成函数
  function generateEquip(level, position, wuxing = "水", forceQuality = null) {
    const bracket = getBracketByLevel(level);
    const pos = getPositionConfig(position);
    const quality = forceQuality || getRandomQuality();
    
    // 生成装备对象
    const equip = {
      id: `${position}_${level}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: generateEquipName(level, position, wuxing),
      level: level,
      position: position,
      wuxing: position === "weapon" ? wuxing : null,
      quality: quality.id,
      qualityName: quality.name,
      color: quality.color || bracket.color,
      durability: 300 + (bracket.grade - 1) * 50,
      baseValue: calculateBaseValue(bracket, position, wuxing),
      attributes: generateRandomAttributes(level, position, quality),
      bracket: bracket.suffix,
      isSuit: quality.id === "green"
    };
    
    // 套装特殊处理
    if (equip.isSuit) {
      const suit = EQUIP_CONFIG.suits[Math.floor(Math.random() * EQUIP_CONFIG.suits.length)];
      equip.suitId = suit.id;
      equip.suitName = suit.name;
      equip.attributes.suitBonus = { name: `套装(${suit.name})`, value: suit.needCount };
    }
    
    return equip;
  }
  
  // 批量生成函数
  function generateEquipBatch(levelRange, count = 10) {
    const batch = [];
    const positions = EQUIP_CONFIG.positions.map(p => p.id);
    const wuxings = ["金", "木", "水", "火", "土"];
    
    for (let i = 0; i < count; i++) {
      const level = Math.floor(Math.random() * (levelRange.max - levelRange.min + 1)) + levelRange.min;
      const position = positions[Math.floor(Math.random() * positions.length)];
      const wuxing = wuxings[Math.floor(Math.random() * wuxings.length)];
      
      // 5%几率出套装
      const isSuit = Math.random() < 0.05;
      const quality = isSuit ? EQUIP_CONFIG.qualities.find(q => q.id === "green") : null;
      
      batch.push(generateEquip(level, position, wuxing, quality));
    }
    
    return batch;
  }
  
  // 导出
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EQUIP_CONFIG, generateEquip, generateEquipBatch };
  }
