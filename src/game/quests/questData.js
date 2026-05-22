/**
 * 地图 NPC + 任务数据（参考问道端游主线/支线体系）
 * objective.type: 'visit_map' | 'battle' | 'talk'
 */

// NPC 角色类型
export const NPC_ROLES = {
  quest:    { label: '任务', color: 'var(--vermilion)' },
  merchant: { label: '商人', color: 'var(--gold-2)' },
  trainer:  { label: '修炼', color: 'var(--bamboo)' },
  activity: { label: '活动', color: '#7a5ab0' },
  event:    { label: '节庆', color: '#c84c20' },
  guild:    { label: '帮派', color: 'var(--ink-2)' },
  healer:   { label: '治疗', color: '#4a90d9' },
  guide:    { label: '指引', color: '#2d8a2d' },
  welfare:  { label: '福利', color: '#c87820' },
}

// ── NPC ────────────────────────────────────────────────────────────────────
export const NPCS = [
  // ── 揽仙镇（城镇）──
  { id: 'npc_lanxian_guide',   name: '小仙童',   title: '揽仙镇新手指引',  mapId: 'lanxian_zhen',   role: 'guide',    glyph: '引',
    idle: '初来乍到？贫道为你指引仙途——每位道友人手一套入门行头，助你少走弯路！' },
  { id: 'npc_lanxian_welfare', name: '福缘使者', title: '揽仙镇福利大使',  mapId: 'lanxian_zhen',   role: 'welfare',  glyph: '福',
    idle: '手持兑换码，好礼不等人！大千世界，缘分到了，礼也就到了。' },
  { id: 'npc_lanxian_mayor',   name: '陈福',     title: '揽仙镇镇长',     mapId: 'lanxian_zhen',   role: 'quest',    glyph: '陈',
    idle: '老夫在此镇守了三十年，见过无数修士从这里出发，踏上各自的道途。你来了，正是时候。' },
  { id: 'npc_lanxian_smith',   name: '铁匠老孟', title: '揽仙镇铁匠铺',   mapId: 'lanxian_zhen',   role: 'merchant', glyph: '孟',
    idle: '炉火日夜不熄，老汉这里的兵器件件手打，便宜不了，但绝对耐用。' },
  { id: 'npc_lanxian_teacher', name: '武当老道', title: '武当观修炼导师',  mapId: 'lanxian_zhen',   role: 'trainer',  glyph: '道',
    idle: '修炼之道，贵在持恒。老道在此为有缘人指点入门功法，不收分文。' },
  { id: 'npc_lanxian_post',    name: '驿站小二', title: '揽仙镇驿站',     mapId: 'lanxian_zhen',   role: 'activity', glyph: '驿',
    idle: '打尖住店一站搞定！咱们驿站每日有师门派发的差事，完成了有额外赏钱哦。' },
  { id: 'npc_lanxian_healer',  name: '陈大夫',   title: '揽仙镇游医',     mapId: 'lanxian_zhen',   role: 'healer',   glyph: '医',
    idle: '老夫行医三十载，金针度气、驱邪续命，样样在行。道行低的年轻人不收分文，高手么……那就得看伤势深浅了。' },

  // ── 天墉城（城镇）──
  { id: 'npc_tianyong_lord',    name: '令狐峰',   title: '天墉城城主',     mapId: 'tianyong_cheng', role: 'quest',    glyph: '令',
    idle: '天下修士皆以天墉城为家，老夫自当守护这片净土。有何要事，尽管直言。' },
  { id: 'npc_tianyong_wuxing',  name: '五行阁主', title: '五行感悟导师',   mapId: 'tianyong_cheng', role: 'trainer',  glyph: '五',
    idle: '金木水火土，五行相生相克。若你对自身属性有所疑惑，来找阁主便是。' },
  { id: 'npc_tianyong_arms',    name: '兵器大师', title: '天墉城兵器铺',   mapId: 'tianyong_cheng', role: 'merchant', glyph: '铸',
    idle: '天下名兵，皆出自老夫之手。如今材料难寻，价格自然水涨船高……' },
  { id: 'npc_tianyong_crystal', name: '天珠阁掌柜', title: '天珠黑水晶专卖', mapId: 'tianyong_cheng', role: 'merchant', glyph: '珠',
    idle: '黑水晶乃东海深处孕育的异宝，可吸附装备灵韵，万金难求。' },
  { id: 'npc_tianyong_quest',   name: '韩清',     title: '任务发布官',     mapId: 'tianyong_cheng', role: 'quest',    glyph: '韩',
    idle: '城内外的事务多如牛毛，官府单靠一己之力应付不来，故而向修士发布委托。' },
  { id: 'npc_tianyong_event',   name: '节庆使者', title: '天墉城活动官',   mapId: 'tianyong_cheng', role: 'event',    glyph: '节',
    idle: '近日中秋将至，城中将举办灯谜会、斗酒宴，欢迎各路修士踊跃参与！' },
  { id: 'npc_tianyong_guild',   name: '帮派使者', title: '各大帮派联络处', mapId: 'tianyong_cheng', role: 'guild',    glyph: '帮',
    idle: '天下各大帮派在此设有驻点，入帮、叛帮、帮派战事，皆可在此登记。' },

  // ── 东海渔村（城镇）──
  { id: 'npc_donghai_chief',    name: '海伯',     title: '东海渔村村长',   mapId: 'donghai_yucun',  role: 'quest',    glyph: '海',
    idle: '这渔村世代靠海为生，前些时日海兽横行，村里损失惨重，还望道友出手相助。' },
  { id: 'npc_donghai_merchant', name: '海货商人', title: '渔村集市',       mapId: 'donghai_yucun',  role: 'merchant', glyph: '货',
    idle: '东海珍馐，新鲜出水！海龟壳、鱼人珠、蓬莱灵草，应有尽有。' },
  { id: 'npc_donghai_captain',  name: '周文',     title: '蓬莱探险队长',   mapId: 'donghai_yucun',  role: 'quest',    glyph: '周',
    idle: '蓬莱岛上奇宝无数，但险象环生。本队长每次出航都要精心准备，道友若有意同行，先来与我说。' },
  { id: 'npc_donghai_diviner',  name: '观潮老者', title: '海图占卜师',     mapId: 'donghai_yucun',  role: 'activity', glyph: '潮',
    idle: '老夫观潮四十年，只要海面有变，都逃不过这双眼睛。来，让老夫为你推算一番行程。' },

  // 揽仙镇外
  { id: 'npc_zhang_elder', name: '张长老', title: '揽仙镇守护长老', mapId: 'lanxian_wai', glyph: '张',
    idle: '年轻人，这里便是你踏上修仙之路的起点。机遇与凶险并存，且行且珍重。' },
  { id: 'npc_zhao_alch',   name: '赵炼丹师', title: '镇中炼丹名家',  mapId: 'lanxian_wai', glyph: '赵',
    idle: '炉火尚旺，老朽正在研究新的丹方。近来草药来源颇为紧张……' },
  { id: 'npc_zhang_yi',    name: '护法张义', title: '镇门护法',      mapId: 'lanxian_wai', glyph: '义',
    idle: '镇门无患，但周遭野兽愈发凶猛，需得谨慎。' },

  // 卧龙坡
  { id: 'npc_lin_jian',    name: '林剑',    title: '流浪剑客',      mapId: 'wolong_po', glyph: '剑',
    idle: '江湖路远，剑不离身。你来此处修炼？倒也是个好去处。' },
  { id: 'npc_lao_li',      name: '老李',    title: '山中樵夫',      mapId: 'wolong_po', glyph: '李',
    idle: '唉，近来山里妖气渐重，老汉砍柴都不得安生。' },

  // 北海沙滩
  { id: 'npc_chen_bo',     name: '陈伯',    title: '北海老渔夫',    mapId: 'beiha_shatan', glyph: '陈',
    idle: '老汉在北海打鱼多年，这片海域从未如此不平静……' },
  { id: 'npc_meng_xuan',   name: '孟玄',    title: '海边道士',      mapId: 'beiha_shatan', glyph: '孟',
    idle: '贫道观此海域，阴阳失衡，恐有大变。' },

  // 轩辕坟
  { id: 'npc_wang_hu',     name: '王护',    title: '轩辕坟守卫老兵', mapId: 'xuanyuan_fen', glyph: '王',
    idle: '老朽守护此地三十余载，从未见过如此浓重的阴气。' },

  // 五派山头
  { id: 'npc_li_mi',       name: '李密',    title: '五派联络探子',   mapId: 'wupai_shantou', glyph: '密',
    idle: '嘘！五派各有心思，探子不好当啊……' },
  { id: 'npc_qing_xu',     name: '青虚道人', title: '山头隐士',      mapId: 'wupai_shantou', glyph: '虚',
    idle: '天下大势，合久必分，分久必合。五派亦如此。' },

  // 五龙窟
  { id: 'npc_leng_feng',   name: '冷锋',    title: '龙窟探险者',     mapId: 'wulong_ku', glyph: '冷',
    idle: '这五龙窟深处，藏着不少上古秘密，若有胆量不妨深入。' },
  { id: 'npc_dragon_guide',name: '龙渔向导', title: '龙窟向导',      mapId: 'wulong_ku', glyph: '导',
    idle: '窟中地形复杂，没有向导很容易迷路。' },

  // 蓬莱岛
  { id: 'npc_tong_xuan',   name: '通玄真人', title: '东海仙人',      mapId: 'penglai_dao', glyph: '通',
    idle: '东海之上，仙雾缭绕。老夫隐居于此，只待有缘人前来问道。' },

  // 幽冥涧
  { id: 'npc_gu_hun',      name: '孤魂使者', title: '冥界使者',      mapId: 'youming_jian', glyph: '冥',
    idle: '幽冥涧中，冤魂无数。若想了解上古封印之事，须先平息这片怨气。' },

  // 百花谷
  { id: 'npc_fei_yun',     name: '飞云仙子', title: '百花谷护法',    mapId: 'baihua_gu', glyph: '云',
    idle: '谷中百花盛开，然近来妖气侵扰，花已不如往昔鲜艳。' },

  // 绝人阵
  { id: 'npc_duan_hun',    name: '断魂',    title: '阵法封印使者',   mapId: 'jueren_zhen', glyph: '断',
    idle: '上古阵法尚在，但封印正逐渐松动。若不加以强化，后果不堪设想。' },

  // 绝仙阵
  { id: 'npc_xuan_tian',   name: '玄天宗师', title: '绝仙阵宗师',    mapId: 'juexian_zhen', glyph: '玄',
    idle: '绝仙阵每一层都是对心性的磨砺，能走到这里的，皆非凡人。' },

  // 天绝阵
  { id: 'npc_lie_tian',    name: '裂天将军', title: '天绝阵守将',    mapId: 'tianjue_zhen', glyph: '裂',
    idle: '天绝阵乃最后防线，若阵破则魔气将席卷中原。绝不能退！' },

  // 昆仑云海
  { id: 'npc_tai_qing',    name: '太清仙翁', title: '昆仑守门人',    mapId: 'kunlun_yunhai', glyph: '清',
    idle: '昆仑之巅，距天穹最近之处。老夫等候已久，知晓你将到来。' },

  // 雪域冰原
  { id: 'npc_bing_po',     name: '冰魄',    title: '雪域探险者',     mapId: 'xueyu_bingyuan', glyph: '冰',
    idle: '极北之地，风雪封路。然而越是危险之处，越藏有上古秘宝。' },
]

// ── 主线任务 ──────────────────────────────────────────────────────────────
export const MAIN_QUESTS = [
  // ── 序章：初入江湖 ─────────────────────────────────────────────────
  {
    id: 'main_01', chain: 'main', chapter: '序章·初入江湖',
    order: 1, npcId: 'npc_zhang_elder', levelReq: 1, prereqs: [],
    title: '初入揽仙镇',
    openText: '你终于来了，我已等候多时。揽仙镇外近日野兽横行，卧龙坡尤为严重，你且去探查一番，看看究竟出了何事。',
    closeText: '卧龙坡的情形比我预想的严峻。好在你平安归来，这只是修仙路的第一步，继续磨砺吧。这几粒丹药路上用得着。',
    objectives: [{ type: 'visit_map', target: 'wolong_po', count: 1, label: '前往卧龙坡探查' }],
    reward: {
      exp: 800, gold: 500, daoDays: 2, potential: 30,
      items: [
        { itemId: 'xiao_huanhun', qty: 5 },
        { itemId: 'xiao_juling',  qty: 3 },
      ],
    },
  },
  {
    id: 'main_02', chain: 'main', chapter: '序章·初入江湖',
    order: 2, npcId: 'npc_zhang_elder', levelReq: 5, prereqs: ['main_01'],
    title: '练气筑基',
    openText: '卧龙坡野兽日益猖獗，必须予以震慑。你去那里与野兽交手，磨炼身手，也为附近村民解忧。',
    closeText: '不错，初出茅庐便有如此战力。修仙之路重在积累，切莫急于求成。老夫这里还有些丹药，你且带着备用。',
    objectives: [{ type: 'battle', target: 'wolong_po', count: 3, label: '在卧龙坡胜利 3 场' }],
    reward: {
      exp: 2000, gold: 800, daoDays: 3, potential: 50,
      items: [
        { itemId: 'xiao_huanhun', qty: 5 },
        { itemId: 'xiao_juling',  qty: 3 },
        { itemId: 'zhong_huanhun', qty: 1 },
      ],
    },
  },
  {
    id: 'main_03', chain: 'main', chapter: '序章·初入江湖',
    order: 3, npcId: 'npc_zhao_alch', levelReq: 10, prereqs: ['main_02'],
    title: '灵草异变',
    openText: '哎呀，麻烦大了！桃柳林中的灵草近来全部枯萎，我怀疑是妖气太重所致。你能否前去查探一番，弄清究竟是何妖物在作怪？',
    closeText: '果然是妖气所致！桃精柳鬼修炼失控，扰乱了整片灵草地。多亏你去探查，事情才能这般顺利解决。这只迷路的桃精宝宝，就交给你收养吧——好好对它，它会是你最好的战友。',
    objectives: [{ type: 'visit_map', target: 'taoliulin', count: 1, label: '前往桃柳林探查' }],
    reward: {
      exp: 2500, gold: 600, daoDays: 2, potential: 40,
      items: [
        { itemId: 'xiao_huanhun', qty: 3 },
        { itemId: 'xiao_juling',  qty: 3 },
        { itemId: 'zhong_juling', qty: 1 },
      ],
      pet: { spawnKey: 'taojing', label: '桃精·宝宝' },
    },
  },
  {
    id: 'main_04', chain: 'main', chapter: '序章·初入江湖',
    order: 4, npcId: 'npc_lin_jian', levelReq: 15, prereqs: ['main_03'],
    title: '桃柳妖踪',
    openText: '我在卧龙坡一带游历多年，从未见过如此诡异的妖气。桃柳林中的妖物绝非寻常——你得亲手剿灭几番，才能彻底驱散那股阴邪之气。',
    closeText: '好样的！那股妖气确已散去不少。不过这背后似乎另有隐情，你须去张长老处汇报，继续追查。我这里有几粒中级丹药，还有一块强化石，留给你在装备上用。',
    objectives: [{ type: 'battle', target: 'taoliulin', count: 3, label: '在桃柳林胜利 3 场' }],
    reward: {
      exp: 4500, gold: 1200, daoDays: 5, potential: 80,
      items: [
        { itemId: 'zhong_huanhun', qty: 3 },
        { itemId: 'zhong_juling',  qty: 2 },
        { itemId: 'qianghuashi',   qty: 1 },
      ],
    },
  },

  // ── 第一章：中原探秘 ────────────────────────────────────────────────
  {
    id: 'main_05', chain: 'main', chapter: '第一章·中原探秘',
    order: 5, npcId: 'npc_zhang_elder', levelReq: 20, prereqs: ['main_04'],
    title: '北上探查',
    openText: '桃柳林的妖气只是异动的开端。据探报，北海沙滩一带也出现了异常——海浪反常，渔民无故失踪。你需要亲赴北海，弄清来龙去脉。',
    closeText: '北海的情形比我预料的更为复杂。老渔夫陈伯世代居于北海，对此地颇为了解，你去问问他吧。路途遥远，带上这些补给。',
    objectives: [{ type: 'visit_map', target: 'beiha_shatan', count: 1, label: '前往北海沙滩' }],
    reward: {
      exp: 6000, gold: 1500, daoDays: 6, potential: 100,
      items: [
        { itemId: 'zhong_huanhun', qty: 5 },
        { itemId: 'zhong_juling',  qty: 3 },
      ],
    },
  },
  {
    id: 'main_06', chain: 'main', chapter: '第一章·中原探秘',
    order: 6, npcId: 'npc_chen_bo', levelReq: 25, prereqs: ['main_05'],
    title: '轩辕古迹',
    openText: '老汉在北海打鱼几十年，头一次见到海龟如此躁动。听说这与轩辕坟有关——那里最近阴气大涨，波及到了北海。你去轩辕坟瞧瞧，或许能找到答案。',
    closeText: '轩辕坟果然不对劲。上古封印出了问题！去找守卫老兵王护，他知道的比我更多。',
    objectives: [{ type: 'visit_map', target: 'xuanyuan_fen', count: 1, label: '前往轩辕坟调查' }],
    reward: { exp: 8000, gold: 1500, daoDays: 8, potential: 120 },
  },
  {
    id: 'main_07', chain: 'main', chapter: '第一章·中原探秘',
    order: 7, npcId: 'npc_wang_hu', levelReq: 30, prereqs: ['main_06'],
    title: '古阵破解',
    openText: '轩辕坟中的上古封印是当年先贤以血肉之躯布下的，如今因坟中妖物修为大涨而动摇。你必须深入坟中，逐层清剿，以战气稳固封印！',
    closeText: '封印重新稳固，轩辕坟暂时安全了。但这只是治标之策，封印终究有限……你需要更强的实力，继续找线索。',
    objectives: [{ type: 'battle', target: 'xuanyuan_fen', count: 5, label: '在轩辕坟胜利 5 场' }],
    reward: { exp: 15000, gold: 3000, daoDays: 12, potential: 200 },
  },
  {
    id: 'main_08', chain: 'main', chapter: '第一章·中原探秘',
    order: 8, npcId: 'npc_li_mi', levelReq: 35, prereqs: ['main_07'],
    title: '五派汇聚',
    openText: '五大门派已察觉到天下的异动，正在五派山头秘密商议对策。你作为独立修士，正适合前去旁听——也许能从中获取珍贵情报。',
    closeText: '五派联盟初步达成，但各派心思不一。你所获得的情报将是接下来行动的关键，好好保管。',
    objectives: [{ type: 'visit_map', target: 'wupai_shantou', count: 1, label: '前往五派山头' }],
    reward: { exp: 18000, gold: 3500, daoDays: 15, potential: 250 },
  },

  // ── 第二章：东海探秘 ────────────────────────────────────────────────
  {
    id: 'main_09', chain: 'main', chapter: '第二章·东海探秘',
    order: 9, npcId: 'npc_leng_feng', levelReq: 41, prereqs: ['main_08'],
    title: '龙窟探秘',
    openText: '五龙窟是我见过最神秘的地方——五条巨龙各守一层，上古时代便已盘踞于此。五派的情报显示，龙窟深处藏有解开上古封印谜题的线索。跟我来，一起探索！',
    closeText: '龙窟深处确有异常，那里的龙族似乎收到了某种召唤……你的战力已经今非昔比，继续深入探索吧。',
    objectives: [{ type: 'battle', target: 'wulong_ku', count: 5, label: '在五龙窟胜利 5 场' }],
    reward: { exp: 35000, gold: 6000, daoDays: 20, potential: 400 },
  },
  {
    id: 'main_10', chain: 'main', chapter: '第二章·东海探秘',
    order: 10, npcId: 'npc_leng_feng', levelReq: 48, prereqs: ['main_09'],
    title: '寻访东海仙人',
    openText: '龙族的异动与东海有关，我听说蓬莱岛上隐居着一位通玄真人，知晓上古真相。你去拜访他，请他讲述那段不为人知的历史。',
    closeText: '通玄真人！他竟在此地！快去与他相见，时间紧迫。',
    objectives: [{ type: 'visit_map', target: 'penglai_dao', count: 1, label: '前往蓬莱岛寻访通玄真人' }],
    reward: { exp: 40000, gold: 7000, daoDays: 22, potential: 450 },
  },
  {
    id: 'main_11', chain: 'main', chapter: '第二章·东海探秘',
    order: 11, npcId: 'npc_tong_xuan', levelReq: 55, prereqs: ['main_10'],
    title: '幽冥裂缝',
    openText: '老夫等候你已久。上古之战遗留的幽冥裂缝正在扩大，屈魂怨鬼涌出幽冥涧，这预示着封印即将彻底崩解。你需前往幽冥涧，以战力镇压那里涌出的冤魂，同时寻找裂缝的核心。',
    closeText: '你已接触到了幽冥的边缘，做得很好。那里有一位冥界使者，他知道比我更多关于裂缝的事。',
    objectives: [{ type: 'battle', target: 'youming_jian', count: 3, label: '在幽冥涧胜利 3 场' }],
    reward: { exp: 55000, gold: 10000, daoDays: 30, potential: 600 },
  },

  // ── 第三章：百花仙境 ────────────────────────────────────────────────
  {
    id: 'main_12', chain: 'main', chapter: '第三章·百花仙境',
    order: 12, npcId: 'npc_gu_hun', levelReq: 61, prereqs: ['main_11'],
    title: '百花秘境',
    openText: '幽冥裂缝的根源，与百花谷中封存的上古灵气有关。数千年前，一位仙人将九成灵气封印于百花谷，以抵御魔气。如今封印动摇，你须前往百花谷，寻找护法仙子，了解详情。',
    closeText: '百花谷……你已进入仙境，做得不错。飞云仙子是百花谷的守护者，她将指引你下一步行动。',
    objectives: [{ type: 'visit_map', target: 'baihua_gu', count: 1, label: '进入百花谷' }],
    reward: { exp: 70000, gold: 12000, daoDays: 35, potential: 700 },
  },
  {
    id: 'main_13', chain: 'main', chapter: '第三章·百花仙境',
    order: 13, npcId: 'npc_fei_yun', levelReq: 68, prereqs: ['main_12'],
    title: '仙境守护',
    openText: '百花谷中的灵气正被外来魔气侵蚀。那些妖兽是在魔气的催动下失控的——你需要连续击败它们，以你的道行之力净化这片仙境。只有这样，封印才能得到修复。',
    closeText: '百花谷的灵气已大部分恢复，谷中花朵重新绽放，多谢你的护卫。下一步，你必须前往绝人阵，那里的封印最为脆弱。',
    objectives: [{ type: 'battle', target: 'baihua_gu', count: 5, label: '在百花谷胜利 5 场' }],
    reward: { exp: 90000, gold: 15000, daoDays: 45, potential: 900 },
  },
  {
    id: 'main_14', chain: 'main', chapter: '第三章·百花仙境',
    order: 14, npcId: 'npc_fei_yun', levelReq: 78, prereqs: ['main_13'],
    title: '阵法封印',
    openText: '绝人阵是上古封印体系的核心节点之一。那里的封印使者断魂，是唯一知晓阵法运作方式的存在。你务必找到他，协商如何重铸封印。',
    closeText: '你已踏入阵法禁地，接下来的一切都将是真正的考验。愿道心长存，助你渡过难关。',
    objectives: [{ type: 'visit_map', target: 'jueren_zhen', count: 1, label: '前往绝人阵' }],
    reward: { exp: 100000, gold: 18000, daoDays: 50, potential: 1000 },
  },

  // ── 第四章：阵法破魔 ────────────────────────────────────────────────
  {
    id: 'main_15', chain: 'main', chapter: '第四章·阵法破魔',
    order: 15, npcId: 'npc_duan_hun', levelReq: 82, prereqs: ['main_14'],
    title: '破阵而入',
    openText: '绝仙阵是封印体系第二层防线。那里的玄天宗师已在等候，但若要通过层层考验，你必须先以战力证明自己——击败阵中守卫，方可深入。',
    closeText: '好！你已具备进入绝仙阵深处的资格。玄天宗师会带你了解上古之战的全貌。',
    objectives: [{ type: 'battle', target: 'juexian_zhen', count: 3, label: '在绝仙阵胜利 3 场' }],
    reward: { exp: 150000, gold: 25000, daoDays: 65, potential: 1300 },
  },
  {
    id: 'main_16', chain: 'main', chapter: '第四章·阵法破魔',
    order: 16, npcId: 'npc_xuan_tian', levelReq: 92, prereqs: ['main_15'],
    title: '天绝之战',
    openText: '天绝阵是人间最后一道防线。魔头已在阵外蠢蠢欲动，裂天将军独木难支。你必须前往天绝阵，与裂天将军并肩作战，以最强战力彻底震慑魔气，为昆仑之行打开通道！',
    closeText: '天绝阵守住了……但代价惨重。昆仑云海是唯一能找到终极封印方法的地方。裂天将军让我转告你：前路珍重。',
    objectives: [{ type: 'battle', target: 'tianjue_zhen', count: 5, label: '在天绝阵胜利 5 场' }],
    reward: { exp: 250000, gold: 40000, daoDays: 90, potential: 1800 },
  },
  {
    id: 'main_17', chain: 'main', chapter: '第四章·阵法破魔',
    order: 17, npcId: 'npc_lie_tian', levelReq: 99, prereqs: ['main_16'],
    title: '直上云霄',
    openText: '天绝阵之战结束了，但真正的终局尚未到来。昆仑云海是天地灵气汇聚之处，太清仙翁在那里等候。去吧，完成你的命运。',
    closeText: '你已到达昆仑……此处灵气充盈，与中原截然不同。太清仙翁将带你完成最后的任务。',
    objectives: [{ type: 'visit_map', target: 'kunlun_yunhai', count: 1, label: '前往昆仑云海' }],
    reward: { exp: 300000, gold: 50000, daoDays: 100, potential: 2000 },
  },

  // ── 终章：问道苍穹 ─────────────────────────────────────────────────
  {
    id: 'main_18', chain: 'main', chapter: '终章·问道苍穹',
    order: 18, npcId: 'npc_tai_qing', levelReq: 103, prereqs: ['main_17'],
    title: '极北封印',
    openText: '老夫等候你已久。上古魔帅被封印于雪域冰原之下，封印已摇摇欲坠。你需深入冰原，以战力震慑魔气，为最终封印仪式争取时间。速去，不可迁延！',
    closeText: '雪域战罢，封印稳固了许多。但终极一战在即——海底迷宫深处，才是最终决战之所。',
    objectives: [{ type: 'battle', target: 'xueyu_bingyuan', count: 5, label: '在雪域冰原胜利 5 场' }],
    reward: { exp: 400000, gold: 70000, daoDays: 150, potential: 3000 },
  },
  {
    id: 'main_19', chain: 'main', chapter: '终章·问道苍穹',
    order: 19, npcId: 'npc_bing_po', levelReq: 110, prereqs: ['main_18'],
    title: '问道苍穹',
    openText: '你真的来了！海底迷宫的深处藏着魔帅的残魂，那是一切混乱的根源。以你今日的道行，正可一战。十战定乾坤——赢了，天下太平；输了，万劫不复。你可做好准备？',
    closeText: '……魔帅残魂已灭，上古封印彻底重铸。天地归于平静。你站在世界之巅，俯瞰苍穹，此刻的你，已然问道成功。\n\n【主线任务完成】',
    objectives: [{ type: 'battle', target: 'haidi_migong', count: 10, label: '在海底迷宫胜利 10 场' }],
    reward: { exp: 999999, gold: 200000, daoDays: 365, potential: 9999 },
  },
]

// ── 支线任务 ──────────────────────────────────────────────────────────────
export const SIDE_QUESTS = [
  {
    id: 'side_01', chain: 'side', chapter: '卧龙坡',
    order: 1, npcId: 'npc_lao_li', levelReq: 5, prereqs: [],
    title: '山中采药',
    openText: '老汉上山采药，屡屡被蛇咬伤。年轻人，你能帮老汉驱散坡上的毒蛇？老汉感激不尽，有几瓶好酒相谢。',
    closeText: '哎呀，谢天谢地！你这娃子真厉害，老汉的药材终于能安心采了，这是老汉的一点心意，收下吧。',
    objectives: [{ type: 'battle', target: 'wolong_po', count: 3, label: '在卧龙坡胜利 3 场' }],
    reward: {
      exp: 1200, gold: 500, daoDays: 1, potential: 50,
      items: [{ itemId: 'xiao_huanhun', qty: 3 }, { itemId: 'xiao_juling', qty: 2 }],
    },
  },
  {
    id: 'side_02', chain: 'side', chapter: '北海',
    order: 2, npcId: 'npc_chen_bo', levelReq: 22, prereqs: [],
    title: '渔村守护',
    openText: '渔村里的年轻人全被异兽吓跑了，只剩老汉和几个老人家。北海沙滩上那些海龟越来越凶，你能帮老汉驱散它们吗？',
    closeText: '渔村终于安静下来了！老汉代表全村老少谢谢你，这点薄礼不成敬意。',
    objectives: [{ type: 'battle', target: 'beiha_shatan', count: 5, label: '在北海沙滩胜利 5 场' }],
    reward: {
      exp: 5000, gold: 1500, daoDays: 4, potential: 100,
      items: [{ itemId: 'zhong_huanhun', qty: 2 }, { itemId: 'zhong_juling', qty: 2 }],
    },
  },
  {
    id: 'side_03', chain: 'side', chapter: '北海',
    order: 3, npcId: 'npc_meng_xuan', levelReq: 26, prereqs: [],
    title: '阴阳失衡',
    openText: '贫道观此地阴阳两气失衡，海面之下似有煞气凝聚。若不及时处置，恐将引发大祸。烦请你协助贫道稳固北海灵脉，多战几场以稳阵法。',
    closeText: '阴阳二气渐趋平衡，北海灵脉稳固许多。贫道感谢道友相助，小礼奉上。',
    objectives: [{ type: 'battle', target: 'beiha_shatan', count: 8, label: '在北海沙滩胜利 8 场' }],
    reward: { exp: 8000, gold: 1800, daoDays: 7, potential: 150 },
  },
  {
    id: 'side_04', chain: 'side', chapter: '轩辕坟',
    order: 4, npcId: 'npc_wang_hu', levelReq: 28, prereqs: [],
    title: '守墓旧约',
    openText: '老朽守此地已三十余年，立誓不让任何妖物踏出轩辕坟半步。近来妖物愈发猖獗，老汉一人力有未逮，请你援手，多战几场以正气镇压！',
    closeText: '老汉这把老骨头，终于可以稍稍歇息了。你的帮助，老汉铭记在心，这是我留存多年的积蓄，望笑纳。',
    objectives: [{ type: 'battle', target: 'xuanyuan_fen', count: 8, label: '在轩辕坟胜利 8 场' }],
    reward: { exp: 12000, gold: 2500, daoDays: 10, potential: 200 },
  },
  {
    id: 'side_05', chain: 'side', chapter: '五龙窟',
    order: 5, npcId: 'npc_dragon_guide', levelReq: 42, prereqs: [],
    title: '龙鳞采集',
    openText: '龙窟深处的龙鳞是极品炼器材料，但想要得到品质好的，必须和强大的龙族正面交手。你有胆量深入龙窟，为我采集足够多的战利品吗？',
    closeText: '战利品收获颇丰！你在龙窟中的战斗经历让你成长了不少，这是应得的报酬。',
    objectives: [{ type: 'battle', target: 'wulong_ku', count: 8, label: '在五龙窟胜利 8 场' }],
    reward: { exp: 28000, gold: 5000, daoDays: 18, potential: 360 },
  },
  {
    id: 'side_06', chain: 'side', chapter: '百花谷',
    order: 6, npcId: 'npc_fei_yun', levelReq: 63, prereqs: [],
    title: '仙子心愿',
    openText: '我有一个心愿——让百花谷永远保持这份纯净与美丽。那些因魔气失控的妖兽，让谷中灵花日渐枯萎。你若能帮我多驱几番，让灵气回归，我便心满意足了。',
    closeText: '谷中百花重新绽放，这是我见过最美的景象。多谢你，道友，请收下这份谷中灵气凝聚的礼物。',
    objectives: [{ type: 'battle', target: 'baihua_gu', count: 10, label: '在百花谷胜利 10 场' }],
    reward: { exp: 80000, gold: 14000, daoDays: 42, potential: 840 },
  },
  {
    id: 'side_07', chain: 'side', chapter: '阵法禁地',
    order: 7, npcId: 'npc_duan_hun', levelReq: 65, prereqs: [],
    title: '强化封印',
    openText: '绝人阵的封印每被强大战力冲击一次，便会得到一定程度的重铸。你愿意为了中原的安定，在此多战几场，以你的道行之气强化阵法封印吗？',
    closeText: '封印之力增强了数成！你是这片大地真正的守护者。',
    objectives: [{ type: 'battle', target: 'jueren_zhen', count: 5, label: '在绝人阵胜利 5 场' }],
    reward: { exp: 100000, gold: 18000, daoDays: 55, potential: 1100 },
  },
  {
    id: 'side_08', chain: 'side', chapter: '阵法禁地',
    order: 8, npcId: 'npc_xuan_tian', levelReq: 84, prereqs: [],
    title: '魔气净化',
    openText: '地绝阵是魔气最为浓郁之处，每一战都是对心性的极大考验。你愿意以自身道行之力，净化那里的魔气，为封印彻底稳固做最后的准备吗？',
    closeText: '魔气散尽，地绝阵终于清明。你的道行已入化境，实属难得。',
    objectives: [{ type: 'battle', target: 'dijue_zhen', count: 5, label: '在地绝阵胜利 5 场' }],
    reward: { exp: 180000, gold: 30000, daoDays: 80, potential: 1600 },
  },
  {
    id: 'side_09', chain: 'side', chapter: '昆仑远域',
    order: 9, npcId: 'npc_tai_qing', levelReq: 102, prereqs: [],
    title: '昆仑传承',
    openText: '老夫在昆仑修行千年，有一门功法传承至今无人继承。你愿意留在昆仑云海磨砺，以证你有资格承接这门传承吗？',
    closeText: '你已达到传承所要求的境界，这门传承便交予你了，望善加利用。',
    objectives: [{ type: 'battle', target: 'kunlun_yunhai', count: 5, label: '在昆仑云海胜利 5 场' }],
    reward: { exp: 350000, gold: 60000, daoDays: 130, potential: 2600 },
  },
  {
    id: 'side_10', chain: 'side', chapter: '昆仑远域',
    order: 10, npcId: 'npc_bing_po', levelReq: 105, prereqs: [],
    title: '深海秘宝',
    openText: '海底迷宫的最深处据说藏有上古龙族的宝库，里面财宝堆积如山。但那里的虾兵蟹将极为凶悍，需要相当的实力才能杀出一条血路。你有兴趣一试吗？',
    closeText: '海底之战，财宝虽未能带出，但你的修为又上了一个台阶，这本身就是最大的收获！',
    objectives: [{ type: 'battle', target: 'haidi_migong', count: 5, label: '在海底迷宫胜利 5 场' }],
    reward: { exp: 380000, gold: 65000, daoDays: 140, potential: 2800 },
  },
]

// ── 城镇委托任务 ──────────────────────────────────────────────────────────────
export const TOWN_QUESTS = [
  // ── 揽仙镇 ──
  {
    id: 'town_lanxian_01', chain: 'town', chapter: '揽仙镇·委托',
    order: 1, npcId: 'npc_lanxian_mayor', levelReq: 3, prereqs: [],
    title: '镇中失窃',
    openText: '近日镇内频频失窃，追查下来竟是卧龙坡里的野兽作怪，顺着官道流窜进来的。烦请道友前去将其驱散，还镇子一份安宁，老夫必有重谢。',
    closeText: '多谢道友出手！那帮畜生总算消停了，这些银两和丹药是镇上百姓的心意，还望笑纳。',
    objectives: [{ type: 'battle', target: 'wolong_po', count: 3, label: '在卧龙坡胜利 3 场' }],
    reward: { exp: 900, gold: 400, daoDays: 1, potential: 40,
      items: [{ itemId: 'xiao_huanhun', qty: 3 }, { itemId: 'xiao_juling', qty: 2 }] },
  },
  {
    id: 'town_lanxian_02', chain: 'town', chapter: '揽仙镇·委托',
    order: 2, npcId: 'npc_lanxian_smith', levelReq: 10, prereqs: [],
    title: '采购矿石',
    openText: '官道南北的山头里藏着不少铁矿石，老汉一个人去取不方便，还有那些狐狸野狗拦路。你若路过官道，帮老汉踩踩点，看看矿脉位置如何。',
    closeText: '有你这份情报，老汉采矿便方便多了！拿着这块强化石，算是老汉的一点心意。',
    objectives: [{ type: 'visit_map', target: 'guandao_nanbei', count: 1, label: '前往官道南/北探查' }],
    reward: { exp: 2200, gold: 800, daoDays: 2, potential: 60,
      items: [{ itemId: 'qianghuashi', qty: 1 }] },
  },
  {
    id: 'town_lanxian_03', chain: 'town', chapter: '揽仙镇·委托',
    order: 3, npcId: 'npc_lanxian_teacher', levelReq: 5, prereqs: [],
    title: '修炼指引',
    openText: '修炼之道，不可纸上谈兵。揽仙镇外便是试炼场，老道要你亲身出战，以实战淬炼本心。打赢了，再来见我，老道自有传授。',
    closeText: '不错，身手见长！老道这里有一套入门心法，可助你凝练气血，好生修炼。',
    objectives: [{ type: 'battle', target: 'lanxian_wai', count: 5, label: '在揽仙镇外胜利 5 场' }],
    reward: { exp: 1500, gold: 600, daoDays: 2, potential: 80,
      items: [{ itemId: 'xiao_juling', qty: 5 }] },
  },

  // ── 天墉城 ──
  {
    id: 'town_tianyong_01', chain: 'town', chapter: '天墉城·委托',
    order: 1, npcId: 'npc_tianyong_quest', levelReq: 20, prereqs: [],
    title: '城防巡逻',
    openText: '官道一带盗匪横行，已有数批押运队伍遭到袭击。官府委托修士协助清剿，以保商道畅通。请前往官道南/北，连续击退来犯之敌，还往来商旅一份安全。',
    closeText: '干得漂亮！商道已安全许多，城防账下已记录你的功劳，这是这次委托的酬劳。',
    objectives: [{ type: 'battle', target: 'guandao_nanbei', count: 5, label: '在官道南/北胜利 5 场' }],
    reward: { exp: 7000, gold: 2000, daoDays: 6, potential: 120 },
  },
  {
    id: 'town_tianyong_02', chain: 'town', chapter: '天墉城·委托',
    order: 2, npcId: 'npc_tianyong_quest', levelReq: 35, prereqs: [],
    title: '清剿山贼',
    openText: '十里坡近来聚集了一批凶悍山贼，与狼虎勾结，截杀过路修士已有数起。城主令狐峰下令重金悬赏，凡能连续清剿成功者，重重有赏。',
    closeText: '十里坡的威胁解除，百姓拍手称快！你的名字已列入天墉城英雄录，这份赏金实至名归。',
    objectives: [{ type: 'battle', target: 'shilipo', count: 5, label: '在十里坡胜利 5 场' }],
    reward: { exp: 22000, gold: 5000, daoDays: 16, potential: 300 },
  },
  {
    id: 'town_tianyong_03', chain: 'town', chapter: '天墉城·委托',
    order: 3, npcId: 'npc_tianyong_wuxing', levelReq: 60, prereqs: [],
    title: '五行感悟之旅',
    openText: '五行阁的传承功法需以实战印证悟道，百花谷中五行灵气最为纯粹。你且亲赴百花谷，以身感悟五行之力，回来后方可继续研习阁中秘典。',
    closeText: '不错，你身上的五行之气已颇为纯正。继续修炼，终有一日可达五行圆融之境。',
    objectives: [{ type: 'visit_map', target: 'baihua_gu', count: 1, label: '前往百花谷感悟五行' }],
    reward: { exp: 75000, gold: 13000, daoDays: 38, potential: 750 },
  },
  {
    id: 'town_tianyong_04', chain: 'town', chapter: '天墉城·委托',
    order: 4, npcId: 'npc_tianyong_lord', levelReq: 80, prereqs: [],
    title: '守护中原',
    openText: '绝人阵封印出现松动的迹象，大量煞气涌向中原腹地。老夫以城主之名，请求道友前往绝人阵以战力震慑魔气，为中原百万生灵守住这最后一道防线！',
    closeText: '有你这等高手相助，中原无忧矣！此乃天墉城最高规格的勋章，望日后继续守护中原。',
    objectives: [{ type: 'battle', target: 'jueren_zhen', count: 3, label: '在绝人阵胜利 3 场' }],
    reward: { exp: 120000, gold: 22000, daoDays: 60, potential: 1200 },
  },

  // ── 东海渔村 ──
  {
    id: 'town_donghai_01', chain: 'town', chapter: '东海渔村·委托',
    order: 1, npcId: 'npc_donghai_chief', levelReq: 22, prereqs: [],
    title: '渔获告急',
    openText: '北海沙滩上的海龟群近来异常凶暴，渔船屡屡被掀翻，渔获大减。村里老幼都指望着这片海域过活，还望道友伸出援手，驱散那批横行的海龟！',
    closeText: '多谢道友！海龟群退了，渔船终于可以安心出海了。这是村里筹的一些酬谢，不多，心意到了。',
    objectives: [{ type: 'battle', target: 'beiha_shatan', count: 3, label: '在北海沙滩胜利 3 场' }],
    reward: { exp: 5500, gold: 1600, daoDays: 5, potential: 110,
      items: [{ itemId: 'zhong_huanhun', qty: 2 }, { itemId: 'zhong_juling', qty: 1 }] },
  },
  {
    id: 'town_donghai_02', chain: 'town', chapter: '东海渔村·委托',
    order: 2, npcId: 'npc_donghai_captain', levelReq: 45, prereqs: [],
    title: '探索蓬莱',
    openText: '本队长已派出三批人手前往蓬莱岛勘探，无一生还。那岛上的巨蜥与石魔凶悍异常。听说道友身手不凡，可否先行踏上蓬莱岛踩个点，探查地形后回来汇报？',
    closeText: '好！蓬莱岛的情形已基本摸清，接下来可以部署正式探险了。这是你应得的报酬，后续行动还需仰仗道友！',
    objectives: [{ type: 'visit_map', target: 'penglai_dao', count: 1, label: '前往蓬莱岛探查' }],
    reward: { exp: 42000, gold: 7500, daoDays: 24, potential: 480 },
  },
  {
    id: 'town_donghai_03', chain: 'town', chapter: '东海渔村·委托',
    order: 3, npcId: 'npc_donghai_diviner', levelReq: 30, prereqs: [],
    title: '海图推算',
    openText: '老夫推算出北海有一处隐藏礁石群，正是渔船触礁之因。若想验证，须在北海沙滩多次出战，借助战力扰动海面气流，老夫方可借机推演精确位置。',
    closeText: '礁石位置已确认！老夫绘制了一份海图，渔船从此可绕开险地。这份酬谢是村里众人的心意。',
    objectives: [{ type: 'battle', target: 'beiha_shatan', count: 8, label: '在北海沙滩胜利 8 场' }],
    reward: { exp: 9000, gold: 2200, daoDays: 8, potential: 180 },
  },
]

export const ALL_QUESTS = [...MAIN_QUESTS, ...SIDE_QUESTS, ...TOWN_QUESTS]

/** 按 mapId 获取该地图的 NPC 列表 */
export function getNpcsForMap(mapId) {
  return NPCS.filter(n => n.mapId === mapId)
}

/** 按 npcId 获取该 NPC 的所有任务 */
export function getQuestsForNpc(npcId) {
  return ALL_QUESTS.filter(q => q.npcId === npcId)
}

/** 获取单个任务 */
export function getQuestById(id) {
  return ALL_QUESTS.find(q => q.id === id) ?? null
}
