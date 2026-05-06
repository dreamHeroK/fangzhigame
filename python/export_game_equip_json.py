#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 qibao_equip_data.json 导出文字游戏用装备配置（仅 装备 + 武器），去掉交易/区服/筛选等字段。

移除：deal_price、show_item_price、business_valid_date、server_code、server_name、
      level_filter、slot_name、icon_local_path

保留：数值与展示、图标 URL、分类与 item_subtype_zh、item_info_code（可作唯一键，但不写入 id 字段）。

排序：先大类（装备 → 武器），再 item_type_id，再 item_level 升序；同名以 item_name 作次序。

用法:
  python export_game_equip_json.py
  python export_game_equip_json.py --input ./qibao_equip_data.json --output ../src/game/data/qibaoEquipCatalog.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys

DROP_KEYS = frozenset(
    {
        "id",
        "deal_price",
        "show_item_price",
        "business_valid_date",
        "server_code",
        "server_name",
        "level_filter",
        "slot_name",
        "icon_local_path",
    }
)

# 大类顺序：装备在前，武器在后
_CATEGORY_ORDER = {"装备": 0, "武器": 1, "宠物": 2}


def to_game_row(raw: dict) -> dict:
    return {k: v for k, v in raw.items() if k not in DROP_KEYS}


def _sort_key(row: dict) -> tuple:
    cat = (row.get("category") or "").strip()
    cr = _CATEGORY_ORDER.get(cat, 99)
    tid = row.get("item_type_id")
    try:
        tid_n = int(tid)
    except (TypeError, ValueError):
        tid_n = 10**9
    lv = row.get("item_level")
    try:
        lv_n = int(lv)
    except (TypeError, ValueError):
        lv_n = -1
    name = (row.get("item_name") or "").strip()
    return (cr, tid_n, lv_n, name)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.normpath(os.path.join(here, ".."))
    default_in = os.path.join(here, "qibao_equip_data.json")
    default_out = os.path.join(root, "src", "game", "data", "qibaoEquipCatalog.json")

    ap = argparse.ArgumentParser(description="导出游戏用精简装备 JSON")
    ap.add_argument("--input", default=default_in)
    ap.add_argument("--output", default=default_out)
    ap.add_argument(
        "--include-pets",
        action="store_true",
        help="默认只导出装备+武器；加此参数则包含宠物",
    )
    args = ap.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        rows = json.load(f)

    allow = {"装备", "武器", "宠物"} if args.include_pets else {"装备", "武器"}
    game_rows = []
    for r in rows:
        cat = (r.get("category") or "").strip()
        if cat not in allow:
            continue
        game_rows.append(to_game_row(r))

    game_rows.sort(key=_sort_key)

    out_path = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(game_rows, f, ensure_ascii=False, indent=2)

    print(f"已写入 {len(game_rows)} 条 -> {out_path}")


if __name__ == "__main__":
    main()
