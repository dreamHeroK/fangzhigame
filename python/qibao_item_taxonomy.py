# -*- coding: utf-8 -*-
"""奇宝斋列表接口 ItemTypeId → 中文子类（装备部位 / 武器种类 / 宠物种类）。"""

from __future__ import annotations

from typing import Any, Dict, Optional

# AccouterItemList：部位（与 crawl 原 EQUIP_SLOTS 一致）
ACCOUTER_TYPE_ZH: Dict[int, str] = {
    202: "帽子",
    203: "衣服",
    204: "鞋子",
    205: "法宝",
    206: "首饰",
    207: "娃娃",
    208: "腰带",
    210: "仙器",
}

# WeaponItemList：武器子类（与 WeaponItemTypeList 站点一致）
WEAPON_TYPE_ZH: Dict[int, str] = {
    20111: "枪",
    20112: "刀",
    20121: "爪",
    20122: "拳套",
    20131: "剑",
    20132: "双戟",
    20141: "扇",
    20142: "弓",
    20151: "锤",
    20152: "斧",
    20161: "羽刃",
    20162: "号角",
    20163: "鼓",
    20164: "软鞭",
}

# PetItemList：宠物/坐骑种类（与购买页 pet 种类 option 一致）
PET_TYPE_ZH: Dict[int, str] = {
    0: "不限",
    301: "普通宠物",
    302: "鬼宠",
    303: "坐骑",
    304: "变异",
    305: "神兽",
    306: "元灵",
    307: "仙元",
}


def item_subtype_zh(category: str, item_type_id: Any) -> str:
    """
    根据列表 JSON 的 category 与 ItemTypeId 返回中文子类名。
    装备：帽子/衣服/…；武器：枪/刀/…；宠物：神兽/变异/…
    """
    if item_type_id is None:
        return "未知"
    try:
        tid = int(item_type_id)
    except (TypeError, ValueError):
        return "未知"
    c = (category or "").strip()
    if c == "装备":
        return ACCOUTER_TYPE_ZH.get(tid) or f"装备(类型{tid})"
    if c == "武器":
        return WEAPON_TYPE_ZH.get(tid) or f"武器(类型{tid})"
    if c == "宠物":
        return PET_TYPE_ZH.get(tid) or f"宠物(类型{tid})"
    return f"未知({c})"


def enrich_record(rec: Dict[str, Any]) -> Dict[str, Any]:
    """为单条记录写入 item_subtype_zh（若已有且相同则跳过写入）。"""
    cat = (rec.get("category") or "").strip()
    tid = rec.get("item_type_id")
    zh = item_subtype_zh(cat, tid)
    out = dict(rec)
    out["item_subtype_zh"] = zh
    return out
