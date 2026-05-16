/**
 * 宠物目录 — 整合成长、相性、天生技能、修炼技能
 * 数据由 python/generate_pet_reference.py 生成
 */
import RAW from './data/petCatalog.json'

export const INNATE_NAMES = {
  bamiaozhuzhang: '拔苗助长',
  fangweidujian:  '防微杜渐',
  youshuozhishe:  '游说之舌',
  tianshenshenli: '天生神力',
  fanzhuanqiankun:'翻转乾坤',
  shemingyiji:    '舍命一击',
  bianchangmoji:  '鞭长莫及',
  siwangchanmian: '死亡缠绵',
  shenlongzhao:   '神龙罩',
  qiankunzhao:    '乾坤罩',
  ruyiquan:       '如意圈',
  mantianxuewu:   '漫天血舞',
  shiwanhuoji:    '十万火急',
  shenshengzenguang:'神圣之光',
}

export const INNATE_DESC = {
  bamiaozhuzhang: '战斗中提升己方宠物成长，使下次升级获得更多成长点',
  fangweidujian:  '被攻击时有概率免疫负面状态（遗忘/中毒/冰冻/昏睡/混乱）',
  youshuozhishe:  '降低敌方宠物一项随机属性，持续数回合',
  tianshenshenli: '提高物理攻击，攻击时额外造成固定伤害',
  fanzhuanqiankun:'将己方与敌方气血/法力差值的一部分转移给自己',
  shemingyiji:    '牺牲自身气血发动必杀，伤害与当前气血损失量成正比',
  bianchangmoji:  '对远程/法系敌方造成额外伤害，近战攻击无效果',
  siwangchanmian: '战斗结束时若宠物被击倒，对击倒者持续造成伤害',
  shenlongzhao:   '为己方全体施加防护罩，降低所承受的伤害',
  qiankunzhao:    '为全体友方宠物回复气血，回复量与宠物法力成正比',
  ruyiquan:       '降低敌方宠物速度，延迟其行动',
  mantianxuewu:   '对全体敌方造成范围伤害',
  shiwanhuoji:    '极大提升己方速度，本回合必先手行动',
  shenshengzenguang:'驱散敌方宠物的增益状态，并短暂封印其天生技能',
}

/** @type {Array} full catalog */
export const PET_CATALOG = RAW

const _byKey = {}
for (const p of RAW) _byKey[p.key] = p

/** @param {string} key @returns {object|undefined} */
export function getPetByKey(key) {
  return _byKey[key]
}
