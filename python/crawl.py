#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从光宇奇宝斋「购买商品」列表拉取装备公开数据（图标 URL、名称、数值属性等），写入 JSON 并下载图标。

数据来源与页面一致：https://qibao.gyyx.cn/Buy/Index/
列表接口（与站点 AdvancedSearch.js / jquery.datalist.js 一致）：
  - GET https://qibao.gyyx.cn/AdvancedSearch/AccouterItemList  （装备，itemTypeID=0 不限部位）
  - GET https://qibao.gyyx.cn/AdvancedSearch/WeaponItemList    （武器，itemTypeID=0 不限类型）
  - GET https://qibao.gyyx.cn/AdvancedSearch/PetItemList      （宠物/坐骑，itemTypeID=0 不限种类）

抓取规则：
  - 等级与子类筛选均为「不限」，按 TotalCount / PageCount 翻页拉取列表全部数据；
  - 全局按 item_name 去重，同名只保留最先出现的一条。

图标：下载到 icons/ 目录，文件名为 item_name（非法文件名字符替换为下划线）+ 原图扩展名。

说明：
  - 请遵守站点服务条款与 robots，控制请求频率。
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import sys
import time
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import requests

from qibao_item_taxonomy import item_subtype_zh

# ===================== 配置 =====================
QIBAO_ORIGIN = "https://qibao.gyyx.cn"
LIST_EQUIP = f"{QIBAO_ORIGIN}/AdvancedSearch/AccouterItemList"
LIST_WEAPON = f"{QIBAO_ORIGIN}/AdvancedSearch/WeaponItemList"
LIST_PET = f"{QIBAO_ORIGIN}/AdvancedSearch/PetItemList"
SERVERS_URL = f"{QIBAO_ORIGIN}/AdvancedSearch/GameServerList"
ITEM_TYPES_URL = f"{QIBAO_ORIGIN}/iteminfo/itemtypes"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_ICON_DIR = os.path.join(SCRIPT_DIR, "icons")
DEFAULT_JSON = os.path.join(SCRIPT_DIR, "qibao_equip_data.json")

# 与购买页「不限」选项一致（装备/武器/宠物等级均传此值）
LEVEL_ANY = "不限"

# 默认区服：无双倾城（商品较多，ServerCode 以接口列表为准）
DEFAULT_SERVER_NAME = "无双倾城"

GOODS_STATES = "Sales,FreeShow,PublicityAndAssureing,Publicity"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Referer": f"{QIBAO_ORIGIN}/Buy/Index/",
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


def strip_html(s: Optional[str]) -> Optional[str]:
    if s is None:
        return None
    t = re.sub(r"<[^>]+>", " ", str(s))
    t = re.sub(r"\s+", " ", t).strip()
    return t or None


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def safe_filename_for_item_name(name: str, icon_url: str) -> str:
    """用装备名做文件名，去掉 Windows 非法字符；扩展名跟随后端图片 URL。"""
    base = re.sub(r'[\\/:*?"<>|]', "_", (name or "").strip())
    base = re.sub(r"\s+", "_", base).strip("._") or "item"
    path = urlparse(icon_url).path
    ext = os.path.splitext(path)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
        ext = ".jpg"
    return base + ext


def load_server_rows() -> List[Dict[str, Any]]:
    r = SESSION.get(SERVERS_URL, timeout=20)
    r.raise_for_status()
    data = r.json()
    if not data.get("IsSuccess") or not data.get("Data"):
        raise RuntimeError("无法获取区服列表")
    return list(data["Data"])


def resolve_server_id(
    preferred_code: Optional[int],
    preferred_name: Optional[str],
) -> Tuple[int, str]:
    """返回 (ServerCode, ServerName)。优先 --server；否则按名称在列表中精确匹配。"""
    rows = load_server_rows()
    if preferred_code is not None:
        for row in rows:
            if int(row["ServerCode"]) == int(preferred_code):
                return int(row["ServerCode"]), str(row.get("ServerName") or "")
        raise RuntimeError(f"区服列表中未找到 ServerCode={preferred_code}")
    name_target = (preferred_name or DEFAULT_SERVER_NAME or "").strip()
    if name_target:
        for row in rows:
            sn = (row.get("ServerName") or "").strip()
            if sn == name_target:
                return int(row["ServerCode"]), sn
    for row in rows:
        if row.get("IsOpen") and row.get("IsNormally"):
            return int(row["ServerCode"]), str(row.get("ServerName") or "")
    row0 = rows[0]
    return int(row0["ServerCode"]), str(row0.get("ServerName") or "")


def base_list_params(
    server_id: int,
    page_index: int,
    page_size: int,
    item_type_id: int,
    level: str,
    order: str = "0",
) -> Dict[str, Any]:
    return {
        "r": random.random(),
        "pageIndex": page_index,
        "pageSize": page_size,
        "itemTypeID": item_type_id,
        "state": GOODS_STATES,
        "order": order,
        "serverId": server_id,
        "level": level,
    }


def pet_list_params(
    server_id: int,
    page_index: int,
    page_size: int,
    pet_kind_id: int,
    level: str,
    order: str = "0",
) -> Dict[str, Any]:
    """与 AdvancedSearch.js 中 PetItemList 的 ajax 参数一致（默认值同页面「不限」）。"""
    return {
        "r": random.random(),
        "pageIndex": page_index,
        "pageSize": page_size,
        "itemTypeID": pet_kind_id,
        "state": GOODS_STATES,
        "order": order,
        "time": "",
        "orderState": "",
        "readed": "",
        "itemState": "",
        "keyWord": "",
        "name": "",
        "rank": "不限",
        "level": level,
        "capacityLevel": "不限",
        "minPrice": "",
        "maxPrice": "",
        "martial": "不限",
        "shape": "不限",
        "minMagPower": "",
        "maxMagPower": "",
        "minMaxLife": "",
        "maxMaxLife": "",
        "minSpeed": "",
        "maxSpeed": "",
        "minPhyPower": "",
        "maxPhyPower": "",
        "enchant": "不限",
        "eclosion": "不限",
        "magRebuildLevel": "不限",
        "phyRebuildLevel": "不限",
        "morphLifeTimes": "不限",
        "morphMagTimes": "不限",
        "morphManaTimes": "不限",
        "morphPhyTimes": "不限",
        "morphSpeedTimes": "不限",
        "isCrossServer": "0",
        "serverId": server_id,
    }


def fetch_json(url: str, params: Dict[str, Any], sleep_s: float) -> Dict[str, Any]:
    time.sleep(sleep_s)
    resp = SESSION.get(url, params=params, timeout=25)
    resp.raise_for_status()
    return resp.json()


def download_icon(url: str, dest_path: str, sleep_s: float) -> bool:
    if not url:
        return False
    time.sleep(sleep_s)
    try:
        ir = SESSION.get(url, timeout=20, stream=True)
        ir.raise_for_status()
        with open(dest_path, "wb") as f:
            f.write(ir.content)
        return True
    except Exception:
        return False


def raw_to_record(
    raw: Dict[str, Any],
    category: str,
    slot_name: str,
    level_filter: str,
) -> Dict[str, Any]:
    code = raw.get("ItemInfoCode")
    name = (raw.get("ItemName") or "").strip()
    img_url = raw.get("ItemImageName") or raw.get("ItemImage") or ""
    return {
        "category": category,
        "slot_name": slot_name,
        "item_subtype_zh": item_subtype_zh(category, raw.get("ItemTypeId")),
        "level_filter": level_filter,
        "item_info_code": code,
        "item_type_id": raw.get("ItemTypeId"),
        "item_name": name,
        "item_level": raw.get("ItemLevel"),
        "server_code": raw.get("ServerCode"),
        "server_name": raw.get("ServerName"),
        "hurt": raw.get("Hurt"),
        "hurt_display": strip_html(raw.get("HurtHtmlHelper")),
        "defense": raw.get("Defense"),
        "defense_display": strip_html(raw.get("DefenseHtmlHelper")),
        "blood": raw.get("Blood"),
        "magic": raw.get("Magic"),
        "speed": raw.get("Speed"),
        "speed_display": strip_html(raw.get("SpeedHtmlHelper")),
        "dodge": raw.get("Dodge"),
        "dodge_display": strip_html(raw.get("DodgeHtmlHelper")),
        "rebuild_level": raw.get("RebuildLevel"),
        "suit_polar": raw.get("SuitPolar"),
        "deal_price": raw.get("DealPrice"),
        "show_item_price": strip_html(raw.get("ShowItemPrice")),
        "business_valid_date": raw.get("BusinessValidDate"),
        "icon_url": img_url,
        "icon_local_path": None,
    }


def pet_raw_to_record(
    raw: Dict[str, Any],
    kind_label: str,
    level_filter: str,
) -> Dict[str, Any]:
    code = raw.get("ItemInfoCode")
    name = (raw.get("ItemName") or "").strip()
    img_url = raw.get("ItemImageName") or raw.get("ItemImage") or ""
    rec: Dict[str, Any] = {
        "category": "宠物",
        "slot_name": kind_label,
        "item_subtype_zh": item_subtype_zh("宠物", raw.get("ItemTypeId")),
        "level_filter": level_filter,
        "item_info_code": code,
        "item_type_id": raw.get("ItemTypeId"),
        "item_name": name,
        "item_level": raw.get("ItemLevel"),
        "server_code": raw.get("ServerCode"),
        "server_name": raw.get("ServerName"),
        "hurt": raw.get("PhyPower"),
        "hurt_display": strip_html(raw.get("PhyPowerHtmlHelper")),
        "defense": None,
        "defense_display": None,
        "blood": raw.get("MaxLife"),
        "magic": raw.get("MagPower"),
        "speed": raw.get("Speed"),
        "speed_display": strip_html(raw.get("SpeedHtmlHelper")),
        "dodge": None,
        "dodge_display": None,
        "rebuild_level": raw.get("PhyRebuildLevel"),
        "suit_polar": None,
        "deal_price": raw.get("DealPrice"),
        "show_item_price": strip_html(raw.get("ShowItemPrice")),
        "business_valid_date": raw.get("BusinessValidDate"),
        "icon_url": img_url,
        "icon_local_path": None,
        "martial_display": strip_html(raw.get("MartialHtmlHelper")),
        "shape_display": strip_html(raw.get("ShapeHtmlHelper")),
        "rebirth_level": raw.get("RebirthLevel"),
        "zhanli_lv": raw.get("ZhanliLv"),
    }
    return rec


def fetch_all_list_pages(
    list_url: str,
    build_params: Callable[[int], Dict[str, Any]],
    sleep_s: float,
    seen_names: set,
    to_record: Callable[[Dict[str, Any]], Dict[str, Any]],
    log_label: str,
    max_pages: int,
) -> List[Dict[str, Any]]:
    """按 PageCount 翻页拉取全部行，写入 to_record；按 seen_names 跳过同名（保留先出现的）。"""
    out: List[Dict[str, Any]] = []
    first = fetch_json(list_url, build_params(1), sleep_s)
    if not first.get("IsSuccess"):
        print(f"  [WARN] {log_label}: {first.get('Message')}")
        return out
    page_count = int(first.get("PageCount") or 0)
    total_count = int(first.get("TotalCount") or 0)
    if max_pages > 0:
        page_count = min(page_count, max_pages)
    print(f"  {log_label}: 接口 TotalCount={total_count}，将抓取 {page_count} 页")

    def consume(data: Dict[str, Any]) -> None:
        for raw in data.get("Data") or []:
            name = (raw.get("ItemName") or "").strip()
            if not name or name in seen_names:
                continue
            seen_names.add(name)
            out.append(to_record(raw))

    consume(first)
    for page in range(2, page_count + 1):
        data = fetch_json(list_url, build_params(page), sleep_s)
        if not data.get("IsSuccess"):
            print(f"  [WARN] {log_label} 第 {page} 页: {data.get('Message')}")
            break
        consume(data)
        if page % 10 == 0 or page == page_count:
            print(f"    …第 {page}/{page_count} 页，本类累计保留 {len(out)} 条（已按名去重）")
    print(f"  {log_label}: 本类结束，保留 {len(out)} 条")
    return out


def attach_icons(records: List[Dict[str, Any]], icon_dir: str, sleep_s: float) -> None:
    ensure_dir(icon_dir)
    for rec in records:
        url = rec.get("icon_url") or ""
        name = rec.get("item_name") or ""
        if not url or not name:
            continue
        fname = safe_filename_for_item_name(name, url)
        dest = os.path.join(icon_dir, fname)
        if download_icon(url, dest, sleep_s):
            rec["icon_local_path"] = dest
        else:
            rec["icon_local_path"] = None


def dedupe_records_by_name(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """按 item_name 只保留第一条（防御性）。"""
    seen: set = set()
    out: List[Dict[str, Any]] = []
    for r in records:
        n = (r.get("item_name") or "").strip()
        if not n or n in seen:
            continue
        seen.add(n)
        out.append(r)
    return out


def save_item_types(path: str, sleep_s: float) -> None:
    data = fetch_json(ITEM_TYPES_URL, {"r": random.random()}, sleep_s)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"已写入类型表: {path}")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    parser = argparse.ArgumentParser(
        description="奇宝斋装备/武器/宠物：不限筛选 + 全列表翻页 + 按 item_name 去重"
    )
    parser.add_argument("--server", type=int, default=None, help="ServerCode，指定后忽略 --server-name")
    parser.add_argument(
        "--server-name",
        default=DEFAULT_SERVER_NAME,
        help=f"区服名称（精确匹配），未指定 --server 时使用，默认「{DEFAULT_SERVER_NAME}」",
    )
    parser.add_argument(
        "--page-size",
        type=int,
        default=50,
        help="每页条数（接口接受较大值时可减少请求次数），至少 5",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=0,
        help="每类列表最多抓取页数，0 表示不限制（调试用）",
    )
    parser.add_argument("--sleep", type=float, default=0.6, help="请求间隔（秒）")
    parser.add_argument("--no-icons", action="store_true", help="不下载图片")
    parser.add_argument("--json", default=DEFAULT_JSON)
    parser.add_argument("--icon-dir", default=DEFAULT_ICON_DIR, help="图标目录，默认 python/icons")
    parser.add_argument("--no-equip", action="store_true", help="不抓取装备列表")
    parser.add_argument("--no-weapon", action="store_true", help="不抓取武器列表")
    parser.add_argument("--no-pet", action="store_true", help="不抓取宠物列表")
    parser.add_argument("--save-itemtypes", action="store_true", help="额外保存 itemtypes 到 qibao_itemtypes.json")
    args = parser.parse_args()

    server_id, server_label = resolve_server_id(args.server, args.server_name)
    print(f"使用区服 {server_label} (ServerCode={server_id})")
    page_size = max(5, int(args.page_size))
    max_pages = max(0, int(args.max_pages))

    seen_names: set = set()
    all_rows: List[Dict[str, Any]] = []

    if not args.no_equip:
        print("抓取装备（itemTypeID=0、等级不限、全页）…")

        def equip_params(page: int) -> Dict[str, Any]:
            return base_list_params(server_id, page, page_size, 0, LEVEL_ANY)

        all_rows.extend(
            fetch_all_list_pages(
                LIST_EQUIP,
                equip_params,
                args.sleep,
                seen_names,
                lambda r: raw_to_record(r, "装备", "装备", LEVEL_ANY),
                "装备",
                max_pages,
            )
        )

    if not args.no_weapon:
        print("抓取武器（itemTypeID=0、等级不限、全页）…")

        def weapon_params(page: int) -> Dict[str, Any]:
            return base_list_params(server_id, page, page_size, 0, LEVEL_ANY)

        all_rows.extend(
            fetch_all_list_pages(
                LIST_WEAPON,
                weapon_params,
                args.sleep,
                seen_names,
                lambda r: raw_to_record(r, "武器", "武器", LEVEL_ANY),
                "武器",
                max_pages,
            )
        )

    if not args.no_pet:
        print("抓取宠物（种类不限、等级不限、全页）…")

        def pet_params_page(page: int) -> Dict[str, Any]:
            return pet_list_params(server_id, page, page_size, 0, LEVEL_ANY)

        all_rows.extend(
            fetch_all_list_pages(
                LIST_PET,
                pet_params_page,
                args.sleep,
                seen_names,
                lambda r: pet_raw_to_record(r, "宠物", LEVEL_ANY),
                "宠物",
                max_pages,
            )
        )

    all_rows = dedupe_records_by_name(all_rows)

    if not args.no_icons:
        print(f"下载图标到: {args.icon_dir}（文件名 = item_name + 扩展名）")
        attach_icons(all_rows, args.icon_dir, args.sleep)

    with open(args.json, "w", encoding="utf-8") as f:
        json.dump(all_rows, f, ensure_ascii=False, indent=2)
    print(f"\n完成：共 {len(all_rows)} 条，已写入 {args.json}")
    if not args.no_icons:
        print(f"图标目录：{args.icon_dir}")

    if args.save_itemtypes:
        p = os.path.join(SCRIPT_DIR, "qibao_itemtypes.json")
        save_item_types(p, args.sleep)


if __name__ == "__main__":
    main()
