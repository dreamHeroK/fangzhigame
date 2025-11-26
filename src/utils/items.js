// 药品配置
export const medicines = {
  '小还丹': {
    id: 'small_hp',
    name: '小还丹',
    type: 'hp',
    value: 50,
    price: 100,
    description: '恢复50点生命值',
    icon: '💊'
  },
  '大还丹': {
    id: 'large_hp',
    name: '大还丹',
    type: 'hp',
    value: 150,
    price: 300,
    description: '恢复150点生命值',
    icon: '💉'
  },
  '回气丹': {
    id: 'small_mp',
    name: '回气丹',
    type: 'mp',
    value: 30,
    price: 80,
    description: '恢复30点法力值',
    icon: '🔵'
  },
  '聚气丹': {
    id: 'large_mp',
    name: '聚气丹',
    type: 'mp',
    value: 80,
    price: 200,
    description: '恢复80点法力值',
    icon: '🔷'
  },
  '仙灵丹': {
    id: 'full_hp',
    name: '仙灵丹',
    type: 'hp',
    value: 9999, // 全恢复
    price: 500,
    description: '完全恢复生命值',
    icon: '✨'
  },
  '回元丹': {
    id: 'full_mp',
    name: '回元丹',
    type: 'mp',
    value: 9999, // 全恢复
    price: 400,
    description: '完全恢复法力值',
    icon: '🌟'
  },
}

// 获取所有药品列表
export function getAllMedicines() {
  return Object.values(medicines)
}

// 根据ID获取药品
export function getMedicineById(id) {
  return Object.values(medicines).find(med => med.id === id)
}

// 根据名称获取药品
export function getMedicineByName(name) {
  return medicines[name]
}

