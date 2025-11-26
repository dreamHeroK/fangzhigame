// 门派配置
export const sects = {
  '金': {
    name: '五龙山云霄洞',
    element: '金',
    icon: '⚡',
    skills: [
      { id: 1, name: '金光乍现', element: '金', level: 10, mpCost: 20, damage: 1.5, desc: '金系基础技能' },
      { id: 2, name: '金虹贯日', element: '金', level: 15, mpCost: 30, damage: 2.0, desc: '金系中级技能' },
      { id: 3, name: '如封似闭', element: '金', level: 20, mpCost: 40, damage: 2.5, desc: '金系高级技能' },
    ]
  },
  '木': {
    name: '终南山玉柱洞',
    element: '木',
    icon: '🌲',
    skills: [
      { id: 1, name: '摘叶飞花', element: '木', level: 10, mpCost: 20, damage: 1.5, desc: '木系基础技能' },
      { id: 2, name: '盘根错节', element: '木', level: 15, mpCost: 30, damage: 2.0, desc: '木系中级技能' },
      { id: 3, name: '万木逢春', element: '木', level: 20, mpCost: 40, damage: 2.5, desc: '木系高级技能' },
    ]
  },
  '水': {
    name: '凤凰山斗阙宫',
    element: '水',
    icon: '💧',
    skills: [
      { id: 1, name: '滴水穿石', element: '水', level: 10, mpCost: 20, damage: 1.5, desc: '水系基础技能' },
      { id: 2, name: '水涨船高', element: '水', level: 15, mpCost: 30, damage: 2.0, desc: '水系中级技能' },
      { id: 3, name: '翻江倒海', element: '水', level: 20, mpCost: 40, damage: 2.5, desc: '水系高级技能' },
    ]
  },
  '火': {
    name: '乾元山金光洞',
    element: '火',
    icon: '🔥',
    skills: [
      { id: 1, name: '举火焚天', element: '火', level: 10, mpCost: 20, damage: 1.5, desc: '火系基础技能' },
      { id: 2, name: '星火燎原', element: '火', level: 15, mpCost: 30, damage: 2.0, desc: '火系中级技能' },
      { id: 3, name: '烈焰焚心', element: '火', level: 20, mpCost: 40, damage: 2.5, desc: '火系高级技能' },
    ]
  },
  '土': {
    name: '骷髅山白骨洞',
    element: '土',
    icon: '⛰️',
    skills: [
      { id: 1, name: '土遁术', element: '土', level: 10, mpCost: 20, damage: 1.5, desc: '土系基础技能' },
      { id: 2, name: '山崩地裂', element: '土', level: 15, mpCost: 30, damage: 2.0, desc: '土系中级技能' },
      { id: 3, name: '移山填海', element: '土', level: 20, mpCost: 40, damage: 2.5, desc: '土系高级技能' },
    ]
  },
}

// 属性相克关系
export const elementAdvantage = {
  '金': '木',
  '木': '土',
  '土': '水',
  '水': '火',
  '火': '金'
}

// 检查是否克制
export function isAdvantageous(attackerElement, defenderElement) {
  return elementAdvantage[attackerElement] === defenderElement
}

