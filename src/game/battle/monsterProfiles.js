/**
 * 怪物相性（五行）与高级天生技能池（表内名称 → 内部 id）
 * 出战时由 rollInnateIds 对池内每项独立掷骰，是否携带与最终数量均随机。
 */

/** @typedef {{ affinity: '金'|'木'|'水'|'火'|'土'|null, innatePool: string[] }} MonsterProfile */

export const INNATE = {
  bamiaozhuzhang: 'bamiaozhuzhang',
  fangweidujian: 'fangweidujian',
  youshuozhishe: 'youshuozhishe',
  tianshenshenli: 'tianshenshenli',
  fanzhuanqiankun: 'fanzhuanqiankun',
  shemingyiji: 'shemingyiji',
  bianchangmoji: 'bianchangmoji',
  siwangchanmian: 'siwangchanmian',
  shenlongzhao: 'shenlongzhao',
  qiankunzhao: 'qiankunzhao',
  ruyiquan: 'ruyiquan',
  mantianxuewu: 'mantianxuewu',
  shiwanhuoji: 'shiwanhuoji',
  shenshengzenguang: 'shenshengzenguang',
}

const N = INNATE

/** @type {Record<string, MonsterProfile>} */
export const MONSTER_PROFILE_BY_KEY = {
  qingwa: { affinity: '水', innatePool: [] },
  songshu: { affinity: null, innatePool: [] },
  tuzi: { affinity: '木', innatePool: [] },
  she: { affinity: null, innatePool: [] },
  houzi: { affinity: null, innatePool: [] },
  shanmao: { affinity: '土', innatePool: [] },
  huli_guandao: { affinity: '木', innatePool: [] },
  yegou: { affinity: null, innatePool: [] },
  taojing: { affinity: '木', innatePool: [N.bamiaozhuzhang] },
  liugui: { affinity: '木', innatePool: [N.bamiaozhuzhang] },
  haigui: { affinity: '水', innatePool: [N.fangweidujian, N.youshuozhishe] },
  ying: { affinity: '金', innatePool: [N.tianshenshenli] },
  ying_bh: { affinity: '金', innatePool: [N.tianshenshenli] },
  baiyuan: { affinity: null, innatePool: [N.fanzhuanqiankun] },
  bianfu: { affinity: '水', innatePool: [N.fangweidujian, N.mantianxuewu] },
  mang: { affinity: '火', innatePool: [N.shiwanhuoji, N.siwangchanmian] },
  jiangshi: { affinity: null, innatePool: [N.fanzhuanqiankun, N.shemingyiji] },
  guihuoying: { affinity: '木', innatePool: [N.bamiaozhuzhang, N.shenshengzenguang] },
  lang_slp: { affinity: null, innatePool: [N.fanzhuanqiankun, N.siwangchanmian] },
  laohu: { affinity: null, innatePool: [N.fanzhuanqiankun, N.shemingyiji] },
  lang_wp: { affinity: null, innatePool: [N.fanzhuanqiankun, N.siwangchanmian] },
  laohu_wp: { affinity: null, innatePool: [N.fanzhuanqiankun, N.shemingyiji] },
  wulong: { affinity: '土', innatePool: [N.bianchangmoji, N.shemingyiji, N.shenlongzhao] },
  huayao: { affinity: '木', innatePool: [N.bamiaozhuzhang, N.mantianxuewu, N.qiankunzhao] },
  yanlong: { affinity: '火', innatePool: [N.shiwanhuoji, N.mantianxuewu, N.shenlongzhao] },
  yuren: { affinity: '水', innatePool: [N.fangweidujian, N.youshuozhishe, N.siwangchanmian] },
  binglong: { affinity: '水', innatePool: [N.fangweidujian, N.youshuozhishe, N.shenlongzhao] },
  dilieshou: { affinity: '土', innatePool: [N.bianchangmoji, N.siwangchanmian, N.shemingyiji] },
  qinglong: { affinity: '木', innatePool: [N.bamiaozhuzhang, N.shenshengzenguang, N.shenlongzhao] },
  jintoutuo: { affinity: null, innatePool: [N.fanzhuanqiankun, N.shemingyiji, N.siwangchanmian] },
  huanglong: { affinity: '金', innatePool: [N.tianshenshenli, N.shemingyiji, N.shenlongzhao] },
  huoya: { affinity: '火', innatePool: [N.shiwanhuoji, N.mantianxuewu, N.shenshengzenguang] },
  juxi: { affinity: '火', innatePool: [N.shiwanhuoji, N.youshuozhishe, N.shemingyiji] },
  shimo: { affinity: null, innatePool: [N.fanzhuanqiankun, N.siwangchanmian, N.ruyiquan] },
  quhun: { affinity: '木', innatePool: [N.bamiaozhuzhang, N.siwangchanmian, N.ruyiquan] },
  yuangui: { affinity: '水', innatePool: [N.fangweidujian, N.youshuozhishe, N.qiankunzhao] },
  fengyi: { affinity: null, innatePool: [N.fanzhuanqiankun, N.shemingyiji, N.shenlongzhao] },
  dianjing: { affinity: '火', innatePool: [N.shiwanhuoji, N.mantianxuewu, N.ruyiquan] },
  qingyi: { affinity: '木', innatePool: [N.bamiaozhuzhang, N.shenshengzenguang, N.mantianxuewu] },
  yushou: { affinity: '水', innatePool: [N.fangweidujian, N.mantianxuewu, N.qiankunzhao] },
  huangyi: { affinity: '金', innatePool: [N.tianshenshenli, N.shenshengzenguang, N.shemingyiji] },
  fengguai: { affinity: '土', innatePool: [N.bianchangmoji, N.siwangchanmian, N.shenshengzenguang] },
  hongyi: { affinity: '火', innatePool: [N.shiwanhuoji, N.youshuozhishe, N.siwangchanmian] },
  hongyao: { affinity: null, innatePool: [N.shenshengzenguang, N.qiankunzhao, N.siwangchanmian] },
  ziyi: { affinity: '土', innatePool: [N.bianchangmoji, N.shenshengzenguang, N.ruyiquan] },
  xuenv: { affinity: '水', innatePool: [N.fangweidujian, N.ruyiquan, N.shenshengzenguang] },
  lanyi: { affinity: '水', innatePool: [N.fangweidujian, N.youshuozhishe, N.mantianxuewu] },
  yunshou: { affinity: null, innatePool: [N.fanzhuanqiankun, N.mantianxuewu, N.qiankunzhao] },
  baiyi: { affinity: null, innatePool: [N.fanzhuanqiankun, N.shemingyiji, N.siwangchanmian] },
  leiguai: { affinity: '金', innatePool: [N.tianshenshenli, N.shenshengzenguang, N.shenlongzhao] },
  shiniuyao: { affinity: '土', innatePool: [N.bianchangmoji, N.shemingyiji, N.siwangchanmian] },
  kulou_zhanjiang: { affinity: '木', innatePool: [N.shenshengzenguang, N.siwangchanmian] },
  lanmaojushou: { affinity: '水', innatePool: [N.fangweidujian, N.youshuozhishe, N.shemingyiji] },
  tanglangguai: { affinity: null, innatePool: [N.fanzhuanqiankun, N.shenshengzenguang, N.ruyiquan] },
  santouquanan: { affinity: null, innatePool: [N.fanzhuanqiankun, N.youshuozhishe, N.qiankunzhao] },
  shixuejuren: { affinity: '金', innatePool: [N.tianshenshenli, N.youshuozhishe, N.shiwanhuoji] },
  lianmo: { affinity: '火', innatePool: [N.shiwanhuoji, N.shenshengzenguang, N.mantianxuewu] },
  hanbingguai: { affinity: '水', innatePool: [N.fangweidujian, N.shenshengzenguang, N.siwangchanmian] },
  xiabing: { affinity: '水', innatePool: [N.shenshengzenguang, N.shenlongzhao, N.mantianxuewu] },
  xiejiang: { affinity: null, innatePool: [N.shemingyiji, N.shenlongzhao, N.fangweidujian] },
  bingjinglonglinshou: { affinity: '水', innatePool: [N.mantianxuewu, N.fanzhuanqiankun] },
  jinchiyuan: { affinity: '金', innatePool: [N.tianshenshenli, N.qiankunzhao, N.shenshengzenguang] },
  xuehu: { affinity: '木', innatePool: [N.bamiaozhuzhang, N.shenshengzenguang, N.ruyiquan] },
  jianhun: { affinity: null, innatePool: [N.mantianxuewu, N.shenlongzhao, N.siwangchanmian] },

  huoguangshu: { affinity: '火', innatePool: [N.shiwanhuoji, N.youshuozhishe, N.ruyiquan] },
  ziyan: { affinity: '土', innatePool: [N.bianchangmoji, N.shemingyiji, N.siwangchanmian] },
  zhengshou: { affinity: null, innatePool: [N.mantianxuewu, N.shenshengzenguang, N.qiankunzhao] },
  diexian: { affinity: '火', innatePool: [N.shiwanhuoji, N.fanzhuanqiankun, N.ruyiquan] },
  bangji: { affinity: '水', innatePool: [N.fangweidujian, N.shenshengzenguang, N.qiankunzhao] },
  shuimoshen: { affinity: '水', innatePool: [N.fangweidujian, N.fanzhuanqiankun, N.ruyiquan] },
  jinjiexie: { affinity: '金', innatePool: [N.tianshenshenli, N.shenlongzhao, N.youshuozhishe] },
  doumoxi: { affinity: '火', innatePool: [N.shiwanhuoji, N.mantianxuewu, N.qiankunzhao] },
  huasheshou: { affinity: null, innatePool: [N.mantianxuewu, N.shenlongzhao, N.fanzhuanqiankun] },
  huling: { affinity: '土', innatePool: [N.bianchangmoji, N.ruyiquan, N.youshuozhishe] },
  zhenshuiguai: { affinity: '水', innatePool: [N.fangweidujian, N.shenlongzhao, N.siwangchanmian] },
  qiutangxianzi: { affinity: '木', innatePool: [N.bamiaozhuzhang, N.ruyiquan, N.mantianxuewu] },
  keyao: { affinity: '水', innatePool: [N.fangweidujian, N.youshuozhishe, N.shenlongzhao] },
  fuling: { affinity: '木', innatePool: [N.bamiaozhuzhang, N.shenshengzenguang, N.qiankunzhao] },
  qiling: { affinity: null, innatePool: [] },
  shishuzhe: { affinity: '土', innatePool: [N.bianchangmoji, N.siwangchanmian, N.shenlongzhao] },

  yangtouguai: { affinity: '土', innatePool: [N.bianchangmoji, N.shemingyiji, N.fanzhuanqiankun, N.mantianxuewu] },
  niutouguai: { affinity: null, innatePool: [N.fanzhuanqiankun, N.shemingyiji, N.shenlongzhao, N.qiankunzhao] },
  bainian_heixiong: { affinity: null, innatePool: [N.fanzhuanqiankun, N.shemingyiji, N.bianchangmoji, N.mantianxuewu] },
  bainian_kuangshi: { affinity: '金', innatePool: [N.tianshenshenli, N.shiwanhuoji, N.shemingyiji, N.shenlongzhao] },
  bainian_ciwei: { affinity: '水', innatePool: [N.fangweidujian, N.ruyiquan, N.shenshengzenguang, N.mantianxuewu] },
  bainian_zhuyao: { affinity: '木', innatePool: [N.bamiaozhuzhang, N.siwangchanmian, N.shemingyiji, N.ruyiquan] },
  baihuaxiu: { affinity: null, innatePool: [N.shenshengzenguang, N.qiankunzhao, N.mantianxuewu, N.siwangchanmian] },
  niumowang: { affinity: '火', innatePool: [N.shiwanhuoji, N.fanzhuanqiankun, N.shenlongzhao, N.shemingyiji] },
  yechawang: { affinity: '水', innatePool: [N.fangweidujian, N.mantianxuewu, N.qiankunzhao, N.siwangchanmian] },
}

const BOSS_FALLBACK_POOL = [
  N.fanzhuanqiankun,
  N.shenlongzhao,
  N.qiankunzhao,
  N.ruyiquan,
  N.mantianxuewu,
  N.shemingyiji,
  N.fangweidujian,
  N.tianshenshenli,
]

export function getMonsterProfile(spawnKey) {
  const p = MONSTER_PROFILE_BY_KEY[spawnKey]
  if (p) return { affinity: p.affinity ?? null, innatePool: [...p.innatePool] }
  return { affinity: null, innatePool: [...BOSS_FALLBACK_POOL] }
}

/**
 * 对 innatePool 中每个技能独立掷骰；期望携带数随 p 变化，0..len 均可出现。
 * @param {string[]} pool
 * @param {{ rng?: () => number, isBoss?: boolean, carryProb?: number }} opts
 */
export function rollInnateIds(pool, opts = {}) {
  const rng = opts.rng ?? Math.random
  if (!pool?.length) return []
  const base = opts.carryProb ?? (opts.isBoss ? 0.48 : 0.34)
  const out = []
  for (const id of pool) {
    if (rng() < base) out.push(id)
  }
  return out
}

/** 中文展示名（战报/UI） */
export const INNATE_DISPLAY_NAME = {
  [N.bamiaozhuzhang]: '拔苗助长',
  [N.fangweidujian]: '防微杜渐',
  [N.youshuozhishe]: '游说之舌',
  [N.tianshenshenli]: '天生神力',
  [N.fanzhuanqiankun]: '翻转乾坤',
  [N.shemingyiji]: '舍命一击',
  [N.bianchangmoji]: '鞭长莫及',
  [N.siwangchanmian]: '死亡缠绵',
  [N.shenlongzhao]: '神龙罩',
  [N.qiankunzhao]: '乾坤罩',
  [N.ruyiquan]: '如意圈',
  [N.mantianxuewu]: '漫天血舞',
  [N.shiwanhuoji]: '十万火急',
  [N.shenshengzenguang]: '神圣之光',
}

export function innateName(id) {
  return INNATE_DISPLAY_NAME[id] ?? id
}
