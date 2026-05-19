#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成完整问道端游装备目录（Lv1-150）。

属性公式来源：
  m.18183.com 问道手游数据库真实值 × 3 校准（手游→端游估算）
  速度属性保持手游原值（不放大，以维持端游战斗系统平衡）

装备名称来源：
  wd.leiting.com 问道手游官方资料站（端游同名）

输出格式与 qibaoEquipCatalog.json 兼容。
"""

from __future__ import annotations

import json
import math
import os
from collections import Counter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ══════════════════════ 属性公式（18183 × 3 校准）══════════════════════
# hurt(L)   = round(28.34 * L^1.05)        -- 武器基础伤害
# def(L)    = round(KDEF * L^1.29)         -- 各槽防御（系数不同）
# blood(L)  = round(KBLOOD * L^1.05)       -- 各槽气血（系数不同）
# magic(L)  = round(KMAGIC * L^1.05)       -- 各槽法力（系数不同）
# speed(L)  = round(22 + 1.8 * L)          -- 鞋子速度（保持手游原值）
#
# 各槽系数（以衣服为基准 = 1.0）：
#   衣服: def×1.0, blood×1.0, magic×1.0
#   帽子: def×0.5, blood×0.5, magic×0.5
#   鞋子: def×0.25, blood×0.2, magic×0.15  + 速度
#   腰带: def×0.4, blood×0.6, magic×0.2
#   法宝: def×0.25, blood×0.4, magic×1.5    (法力主)
#   首饰: def×0.25, blood×0.4, magic×0.75

# 衣服 18183 校准值: Lv10=def123/blood294/magic195; Lv50=def969/blood1650/magic1098
CLOTH_KDEF = 6.28      # from: 123 / 10^1.29 ≈ 6.28; 969 / 50^1.29 ≈ 6.38 (avg)
CLOTH_KBLOOD = 26.2    # from: 294 / 10^1.05 ≈ 26.2
CLOTH_KMAGIC = 17.4    # from: 195 / 10^1.05 ≈ 17.4
WEAPON_KHURT = 28.34   # from: 318 / 10^1.05 ≈ 28.34


def _hurt(L: int) -> int:
    return max(1, round(WEAPON_KHURT * (L ** 1.05)))


def _def(L: int, k: float) -> int | None:
    v = round(CLOTH_KDEF * k * (L ** 1.29))
    return v if v >= 1 else None


def _blood(L: int, k: float) -> int | None:
    v = round(CLOTH_KBLOOD * k * (L ** 1.05))
    return v if v >= 1 else None


def _magic(L: int, k: float) -> int | None:
    v = round(CLOTH_KMAGIC * k * (L ** 1.05))
    return v if v >= 1 else None


def _speed(L: int) -> int:
    """鞋子速度（手游原值，不×3）。"""
    return max(1, round(22 + 1.8 * L))


# ══════════════════════ 名称表 ══════════════════════
# 来自 wd.leiting.com 资料站
# 格式: (level, name)，Lv1 为游戏初始装备（资料站有记录但无属性）

WEAPONS: dict[str, list[tuple[int, str]]] = {
    '枪': [
        (1, '长枪'),       (10, '铁枪'),       (20, '点钢枪'),       (30, '乌金枪'),
        (40, '火焰枪'),    (50, '双头枪'),     (60, '寒风枪'),       (70, '暴雨梨花枪'),
        (80, '云龙枪'),    (90, '蕴雷枪'),     (100, '风火游龙枪'), (110, '九转金刚刃'),
        (120, '混元斩龙戟'),(130, '赤眼神龙枪'),(140, '九天祥云戟'), (150, '天帝霸王枪'),
    ],
    '爪': [
        (1, '铁爪'),       (10, '虎爪'),       (20, '赤炼爪'),       (30, '残青爪'),
        (40, '阴风爪'),    (50, '寒冰刺'),     (60, '骷髅爪'),       (70, '幽冥鬼爪'),
        (80, '噬魂魔爪'),  (90, '拂兰指'),     (100, '啼血爪'),     (110, '七巧玲珑爪'),
        (120, '镇魂摄天刺'),(130, '红绫火毒爪'),(140, '九幽伏魔爪'), (150, '万古噬神爪'),
    ],
    '剑': [
        (1, '长剑'),       (10, '青锋剑'),     (20, '沉香剑'),       (30, '飞虹剑'),
        (40, '乾元剑'),    (50, '斩妖剑'),     (60, '昆吾剑'),       (70, '追魂剑'),
        (80, '九黎剑'),    (90, '轩辕剑'),     (100, '乙木神剑'),   (110, '紫青玄魔剑'),
        (120, '封神诛仙剑'),(130, '九天玄冥剑'),(140, '赤魇遁龙剑'), (150, '诛天斩神剑'),
    ],
    '扇': [
        (1, '折扇'),       (10, '精铁扇'),     (20, '逍遥扇'),       (30, '玉骨扇'),
        (40, '阴阳扇'),    (50, '凤羽扇'),     (60, '百花扇'),       (70, '流云扇'),
        (80, '蔽日扇'),    (90, '乾坤扇'),     (100, '五彩神焰扇'), (110, '离火七翎扇'),
        (120, '赤霄烈焰扇'),(130, '红云火霞扇'),(140, '熠焰通灵扇'), (150, '焚天神罚扇'),
    ],
    '锤': [
        (1, '铜锤'),       (10, '流星锤'),     (20, '八棱锤'),       (30, '亮银锤'),
        (40, '乌金锤'),    (50, '混元锤'),     (60, '霹雳锤'),       (70, '晃金锤'),
        (80, '撼地锤'),    (90, '破天锤'),     (100, '加持杵'),     (110, '炼狱麒麟杵'),
        (120, '风雷如意杵'),(130, '玄黄破坚锤'),(140, '玄天火龙锤'), (150, '混元定海杵'),
    ],
}

HATS: list[tuple[int, str]] = [
    (1, '方巾'),     (10, '皮帽'),     (20, '青铜盔'),   (30, '冲天盔'),
    (40, '虎头盔'),  (50, '神龙盔'),   (60, '白玉冠'),   (70, '乾坤冠'),
    (80, '龙冠'),    (90, '蟠龙冠'),   (100, '九霄烈焰冠'),(110, '星耀冠'),
    (120, '七星宝冠'),(130, '白玉星冠'),(140, '双翼灵枭冠'),(150, '九天星辰冠'),
]

CLOTHS: list[tuple[int, str]] = [
    (1, '布衣'),     (10, '虎皮衣'),   (20, '青铜铠'),   (30, '皂罗袍'),
    (40, '金锁甲'),  (50, '莽龙袍'),   (60, '金丝甲'),   (70, '八卦衣'),
    (80, '连环甲'),  (90, '金缕衣'),   (100, '天衣'),   (110, '瀚宇法袍'),
    (120, '诸天法袍'),(130, '天玄真神甲'),(140, '赤金磐龙甲'),(150, '九天玄衣'),
]

SHOES: list[tuple[int, str]] = [
    (1, '麻鞋'),     (10, '布鞋'),     (20, '马靴'),     (30, '牛皮靴'),
    (40, '长筒靴'),  (50, '追云履'),   (60, '亮银靴'),   (70, '疾风履'),
    (80, '无影靴'),  (90, '天行履'),   (100, '踏云靴'), (110, '御风履'),
    (120, '钧天履'), (130, '雷弧闪'),  (140, '惊虹战靴'),(150, '九天御风靴'),
]

BELTS: list[tuple[int, str]] = [
    (1, '布腰带'),   (10, '皮腰带'),   (20, '铜扣带'),   (30, '虎皮带'),
    (40, '丝绦'),    (50, '玉扣带'),   (60, '云纹带'),   (70, '锦绣带'),
    (80, '龙纹腰带'),(90, '祥云玉带'), (100, '七彩锦带'),(110, '天蚕丝带'),
    (120, '玄龙腰带'),(130, '金龙护体带'),(140, '九霄紫金带'),(150, '混天玉带'),
]

LINGBAOS: list[tuple[int, str]] = [
    (1, '道符'),     (10, '玉符'),     (20, '铜钱剑'),   (30, '玄机令'),
    (40, '七星剑'),  (50, '玄宝葫芦'), (60, '翼火蛇鞭'), (70, '阴阳镜'),
    (80, '诛仙阵图'),(90, '五火七禽扇'),(100, '太乙神雷符'),(110, '混天绫'),
    (120, '乾坤圈'), (130, '山河社稷图'),(140, '太极图'), (150, '混元金斗'),
]

BRACELETS: list[tuple[int, str]] = [
    (1, '粗玉镯'),   (10, '玉镯'),      (20, '银镯'),      (30, '铜镯'),
    (40, '金镯'),    (50, '翡翠镯'),    (60, '白玉镯'),    (70, '青金镯'),
    (80, '七宝镯'),  (90, '玲珑镯'),   (100, '天玉镯'),   (110, '万宝琉璃镯'),
    (120, '玄铁腕镯'),(130, '龙纹宝镯'),(140, '九霄玉镯'), (150, '混元宝镯'),
]

NECKLACES: list[tuple[int, str]] = [
    (1, '铜链'),     (10, '玉链'),      (20, '银链'),      (30, '金链'),
    (40, '珍珠项链'), (50, '凤羽项链'), (60, '七彩项链'),  (70, '七星项链'),
    (80, '龙眼项链'), (90, '北斗七星链'),(100, '瑶光璎珞'), (110, '天蚕丝链'),
    (120, '灵玉项链'),(130, '天蚕神玉链'),(140, '九转琉璃链'),(150, '混元玉链'),
]

PENDANTS: list[tuple[int, str]] = [
    (1, '素玉配'),    (10, '玉环'),     (20, '金环'),      (30, '玄玉配'),
    (40, '龙凤佩'),   (50, '七彩玉佩'), (60, '灵玉佩'),    (70, '如意玉扳指'),
    (80, '玄天玉佩'), (90, '天枢玉佩'), (100, '北斗玉璧'), (110, '混元玉璧'),
    (120, '太极玉佩'),(130, '九天灵玉佩'),(140, '混元圣玉'),(150, '九天玲珑玉'),
]

# ══════════════════════ 生成器 ══════════════════════

_next_code = 800_000


def _code() -> int:
    global _next_code
    _next_code += 1
    return _next_code


def _mk_weapon(lv: int, name: str, subtype: str) -> dict:
    return {
        'category': '武器',
        'item_subtype_zh': subtype,
        'item_info_code': _code(),
        'item_type_id': 201,
        'item_name': name,
        'item_level': lv,
        'base_attrs': {
            'hurt':    _hurt(lv),
            'defense': None, 'blood': None, 'magic': None, 'speed': None,
        },
        'random_attrs': [],
        'icon_url': '',
    }


def _mk_armor(
    lv: int, name: str, subtype: str, type_id: int,
    dk: float = 0.0,   # defense 系数（相对衣服）
    bk: float = 0.0,   # blood 系数
    mk: float = 0.0,   # magic 系数
    speed: bool = False,
) -> dict:
    return {
        'category': '装备',
        'item_subtype_zh': subtype,
        'item_info_code': _code(),
        'item_type_id': type_id,
        'item_name': name,
        'item_level': lv,
        'base_attrs': {
            'hurt':    None,
            'defense': _def(lv, dk)   if dk   else None,
            'blood':   _blood(lv, bk) if bk   else None,
            'magic':   _magic(lv, mk) if mk   else None,
            'speed':   _speed(lv)     if speed else None,
        },
        'random_attrs': [],
        'icon_url': '',
    }


# ══════════════════════ 主生成 ══════════════════════

records: list[dict] = []

# ── 武器（5 系，各 16 档 = 80 件）
for subtype, entries in WEAPONS.items():
    for lv, name in entries:
        records.append(_mk_weapon(lv, name, subtype))

# ── 帽子（202，防御×0.5 + 气血×0.5 + 法力×0.5）
for lv, name in HATS:
    records.append(_mk_armor(lv, name, '帽子', 202, dk=0.5, bk=0.5, mk=0.5))

# ── 衣服（203，防御×1 + 气血×1 + 法力×1，主防具）
for lv, name in CLOTHS:
    records.append(_mk_armor(lv, name, '衣服', 203, dk=1.0, bk=1.0, mk=1.0))

# ── 鞋子（204，防御×0.25 + 速度）
for lv, name in SHOES:
    records.append(_mk_armor(lv, name, '鞋子', 204, dk=0.25, bk=0.2, mk=0.15, speed=True))

# ── 腰带（208，防御×0.4 + 气血×0.6）
for lv, name in BELTS:
    records.append(_mk_armor(lv, name, '腰带', 208, dk=0.4, bk=0.6, mk=0.2))

# ── 法宝（205，法力×1.5 主，气血×0.4，防御×0.25）
for lv, name in LINGBAOS:
    records.append(_mk_armor(lv, name, '法宝', 205, dk=0.25, bk=0.4, mk=1.5))

# ── 手镯（206，法力×0.75 + 气血×0.4 + 防御×0.25）
for lv, name in BRACELETS:
    records.append(_mk_armor(lv, name, '手镯', 206, dk=0.25, bk=0.4, mk=0.75))

# ── 项链（207，法力×0.75 + 气血×0.4 + 防御×0.25）
for lv, name in NECKLACES:
    records.append(_mk_armor(lv, name, '项链', 207, dk=0.25, bk=0.4, mk=0.75))

# ── 玉佩（209，法力×0.75 + 气血×0.4 + 防御×0.25）
for lv, name in PENDANTS:
    records.append(_mk_armor(lv, name, '玉佩', 209, dk=0.25, bk=0.4, mk=0.75))


# ══════════════════════ 输出 ══════════════════════

OUT_PATH = os.path.normpath(
    os.path.join(SCRIPT_DIR, '..', 'src', 'game', 'data', 'qibaoEquipCatalog.json')
)

with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print(f'生成完成：{len(records)} 件装备 → {OUT_PATH}')
print()

by_subtype = Counter(r['item_subtype_zh'] for r in records)
print('类型分布:')
for k, v in sorted(by_subtype.items(), key=lambda x: -x[1]):
    print(f'  {k}: {v}件')

lvs = [r['item_level'] for r in records]
print(f'\n等级范围: Lv{min(lvs)}-{max(lvs)}，共 {len(set(lvs))} 个等级档')

# 抽查 Lv100 属性
print('\nLv100 装备属性:')
for r in sorted(records, key=lambda x: x['item_level']):
    if r['item_level'] == 100:
        a = r['base_attrs']
        vals = [f'hurt={a["hurt"]}' if a['hurt'] else '',
                f'def={a["defense"]}' if a['defense'] else '',
                f'blood={a["blood"]}' if a['blood'] else '',
                f'magic={a["magic"]}' if a['magic'] else '',
                f'speed={a["speed"]}' if a['speed'] else '']
        print(f'  {r["item_name"]}({r["item_subtype_zh"]}): {" ".join(v for v in vals if v)}')
