#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从光宇奇宝斋「购买商品」列表拉取装备公开数据，写入 JSON 并下载图标。

数据来源：https://qibao.gyyx.cn/Buy/Index/
列表接口：
  - GET https://qibao.gyyx.cn/AdvancedSearch/AccouterItemList  （装备）
  - GET https://qibao.gyyx.cn/AdvancedSearch/WeaponItemList    （武器）
  - GET https://qibao.gyyx.cn/AdvancedSearch/PetItemList       （宠物/坐骑）

XML 详情接口（--fetch-xml 启用）：
  - GET https://qibao.gyyx.cn/ItemInfo/ItemDetailXml?itemId={ItemInfoCode}
  返回 XML，包含 <basic_attrib>（基础属性）和 <attrib>（随机属性）节点。

去重规则：
  - 按 (item_name, item_level) 组合去重，同名同级只保留最先出现的一条。
  - 注意：旧版本按 item_name 去重，会丢失不同等级的同名装备。

输出字段说明：
  base_attrs  - 基础属性：来自列表 API 的固定数值（攻击/防御/气血/法力/速度/闪避等）
  random_attrs - 随机属性：来自 XML 详情的洗练/附加属性，需 --fetch-xml 才会填充
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import sys
import time
import xml.etree.ElementTree as ET
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

# 装备 XML 详情接口（返回 XML 包含基础属性 + 随机属性）
DETAIL_XML_URL = f"{QIBAO_ORIGIN}/ItemInfo/ItemDetailXml"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_ICON_DIR = os.path.join(SCRIPT_DIR, "icons")
DEFAULT_JSON = os.path.join(SCRIPT_DIR, "qibao_equip_data.json")

LEVEL_ANY = "不限"
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


# ===================== XML 详情解析 =====================

def _resolve_type_template(type_str: str, value: str) -> str:
    """将 type 属性中的 %s / %s% 替换为实际值，处理「所有相性 4 增加 (+1.02%)」格式。"""
    if "," in value:
        # 格式：「数值,百分比」，如 "4,1.02" → "所有相性 4 增加 (+1.02%)"
        idx = value.rfind(",")
        main_val = value[:idx]
        pct_val = value[idx + 1:]
        result = re.sub(r"%s%|%s", main_val, type_str, count=1)
        result = re.sub(r"\(%s\)", "", result)
        return result.strip() + f" (+{pct_val}%)"
    return re.sub(r"%s%|%s", value, type_str)


def parse_xml_attribs(xml_bytes: bytes) -> Dict[str, List[Dict[str, str]]]:
    """
    解析装备 XML 详情，返回：
      base_attrs  - list of {type, value, display, color}，来自 <basic_attrib> 节点
      random_attrs - list of {type, value, display, color}，来自 <attrib> 节点
    """
    try:
        text = xml_bytes.decode("utf-8", errors="replace")
        root = ET.fromstring(text)
    except ET.ParseError:
        return {"base_attrs": [], "random_attrs": []}

    # 查找 <attribs> 容器，不存在时直接用 root
    attribs_node = root.find("attribs")
    if attribs_node is None:
        attribs_node = root

    base_list: List[Dict[str, str]] = []
    rand_list: List[Dict[str, str]] = []

    for elem in attribs_node.iter():
        tag = elem.tag.lower()
        if tag not in ("basic_attrib", "attrib"):
            continue
        type_str = (elem.get("type") or "").strip()
        color = (elem.get("color") or "").strip()
        value = (elem.text or "").strip()
        if not type_str and not value:
            continue
        display = _resolve_type_template(type_str, value) if type_str else value
        entry = {"type": type_str, "value": value, "display": display, "color": color}
        if tag == "basic_attrib":
            base_list.append(entry)
        else:
            rand_list.append(entry)

    return {"base_attrs": base_list, "random_attrs": rand_list}


def fetch_item_xml_detail(item_info_code: int, sleep_s: float) -> Optional[Dict[str, List]]:
    """
    拉取单条装备的 XML 详情，解析基础属性和随机属性。
    返回 {"base_attrs": [...], "random_attrs": [...]} 或 None（失败时）。
    """
    params = {"itemId": item_info_code, "r": random.random()}
    time.sleep(sleep_s)
    try:
        resp = SESSION.get(DETAIL_XML_URL, params=params, timeout=25)
        resp.raise_for_status()
        if not resp.content or len(resp.content) < 10:
            return None
        return parse_xml_attribs(resp.content)
    except Exception as exc:
        print(f"    [WARN] XML 详情获取失败 itemId={item_info_code}: {exc}")
        return None


# ===================== 记录构建 =====================

def _make_base_attrs(raw: Dict[str, Any]) -> Dict[str, Any]:
    """从列表 API raw 中提取基础属性（固有数值，来自装备本身类型和等级）。"""
    return {
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
    }


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
        # 基础属性（固有，由装备类型和等级决定）
        "base_attrs": _make_base_attrs(raw),
        # 随机属性（洗练/附加，由 --fetch-xml 从 XML 详情填充；默认空列表）
        "random_attrs": [],
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
    base_attrs = {
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
        # 宠物专有
        "martial_display": strip_html(raw.get("MartialHtmlHelper")),
        "shape_display": strip_html(raw.get("ShapeHtmlHelper")),
        "rebirth_level": raw.get("RebirthLevel"),
        "zhanli_lv": raw.get("ZhanliLv"),
    }
    return {
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
        "base_attrs": base_attrs,
        "random_attrs": [],
        "deal_price": raw.get("DealPrice"),
        "show_item_price": strip_html(raw.get("ShowItemPrice")),
        "business_valid_date": raw.get("BusinessValidDate"),
        "icon_url": img_url,
        "icon_local_path": None,
    }


# ===================== 翻页抓取 =====================

def fetch_all_list_pages(
    list_url: str,
    build_params: Callable[[int], Dict[str, Any]],
    sleep_s: float,
    seen_pairs: set,
    to_record: Callable[[Dict[str, Any]], Dict[str, Any]],
    log_label: str,
    max_pages: int,
) -> List[Dict[str, Any]]:
    """
    按 PageCount 翻页拉取全部行。
    按 (item_name, item_level) 去重，同名同级只保留最先出现的一条。
    """
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
            level = raw.get("ItemLevel")
            key = (name, level)
            if not name or key in seen_pairs:
                continue
            seen_pairs.add(key)
            out.append(to_record(raw))

    consume(first)
    for page in range(2, page_count + 1):
        data = fetch_json(list_url, build_params(page), sleep_s)
        if not data.get("IsSuccess"):
            print(f"  [WARN] {log_label} 第 {page} 页: {data.get('Message')}")
            break
        consume(data)
        if page % 10 == 0 or page == page_count:
            print(f"    …第 {page}/{page_count} 页，本类累计保留 {len(out)} 条（按名+等级去重）")
    print(f"  {log_label}: 本类结束，保留 {len(out)} 条")
    return out


# ===================== XML 批量填充 =====================

def fill_xml_details(
    records: List[Dict[str, Any]],
    sleep_s: float,
    categories: Optional[set] = None,
) -> None:
    """
    为 records 中每条（装备/武器，不含宠物）拉取 XML 详情，填充 base_attrs 和 random_attrs。
    categories: 限定只处理的 category 集合（None 表示不限）。
    """
    targets = [
        r for r in records
        if r.get("item_info_code")
        and (categories is None or r.get("category") in categories)
    ]
    total = len(targets)
    print(f"\n开始拉取 XML 详情（共 {total} 条）…")
    ok = fail = 0
    for i, rec in enumerate(targets, 1):
        code = rec["item_info_code"]
        detail = fetch_item_xml_detail(code, sleep_s)
        if detail:
            # XML 详情的 base_attrs 列表合并进 base_attrs（以 display 形式追加）
            if detail.get("base_attrs"):
                rec["base_attrs"]["xml_base"] = detail["base_attrs"]
            rec["random_attrs"] = detail.get("random_attrs") or []
            ok += 1
        else:
            fail += 1
        if i % 50 == 0 or i == total:
            print(f"  XML 详情进度: {i}/{total}（成功 {ok} 失败 {fail}）")
    print(f"XML 详情拉取完成：成功 {ok}，失败 {fail}")


# ===================== 其他工具 =====================

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


def dedupe_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """按 (item_name, item_level) 只保留第一条（防御性）。"""
    seen: set = set()
    out: List[Dict[str, Any]] = []
    for r in records:
        name = (r.get("item_name") or "").strip()
        level = r.get("item_level")
        key = (name, level)
        if not name or key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out


def save_item_types(path: str, sleep_s: float) -> None:
    data = fetch_json(ITEM_TYPES_URL, {"r": random.random()}, sleep_s)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"已写入类型表: {path}")


# ===================== 主程序 =====================

def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    parser = argparse.ArgumentParser(
        description="奇宝斋装备/武器/宠物：全等级全品类抓取，分离基础属性与随机属性"
    )
    parser.add_argument("--server", type=int, default=None)
    parser.add_argument("--server-name", default=DEFAULT_SERVER_NAME)
    parser.add_argument("--page-size", type=int, default=50)
    parser.add_argument("--max-pages", type=int, default=0, help="每类最多页数，0=不限（调试用）")
    parser.add_argument("--sleep", type=float, default=0.6, help="列表请求间隔（秒）")
    parser.add_argument("--xml-sleep", type=float, default=0.8, help="XML 详情请求间隔（秒）")
    parser.add_argument(
        "--fetch-xml",
        action="store_true",
        help="为装备/武器拉取 XML 详情，填充随机属性（random_attrs）",
    )
    parser.add_argument(
        "--xml-categories",
        default="装备,武器",
        help="--fetch-xml 只处理的类别（逗号分隔），默认「装备,武器」",
    )
    parser.add_argument("--no-icons", action="store_true")
    parser.add_argument("--json", default=DEFAULT_JSON)
    parser.add_argument("--icon-dir", default=DEFAULT_ICON_DIR)
    parser.add_argument("--no-equip", action="store_true")
    parser.add_argument("--no-weapon", action="store_true")
    parser.add_argument("--no-pet", action="store_true")
    parser.add_argument("--save-itemtypes", action="store_true")
    # ── 等级扫描参数 ──────────────────────────────────────────────────────────
    parser.add_argument(
        "--level-min", type=int, default=10,
        help="扫描起始等级（含）；默认 10",
    )
    parser.add_argument(
        "--level-max", type=int, default=150,
        help="扫描结束等级（含）；默认 150",
    )
    parser.add_argument(
        "--level-step", type=int, default=10,
        help="逐级扫描步长；默认 10（问道装备以 10 级一档）",
    )
    parser.add_argument(
        "--no-level-sweep", action="store_true",
        help="跳过逐级扫描，仅用「不限」查询（旧行为）",
    )
    parser.add_argument(
        "--no-level-filter", action="store_true",
        help="保留所有等级数据，不按 level-min/level-max 过滤最终结果",
    )
    args = parser.parse_args()

    server_id, server_label = resolve_server_id(args.server, args.server_name)
    print(f"使用区服 {server_label} (ServerCode={server_id})")
    page_size = max(5, int(args.page_size))
    max_pages = max(0, int(args.max_pages))

    # 构建等级查询序列：逐级 [10, 20, ..., 150] + 兜底「不限」
    if args.no_level_sweep:
        level_queries: List[str] = [LEVEL_ANY]
    else:
        step = max(1, args.level_step)
        level_queries = [
            str(lv)
            for lv in range(args.level_min, args.level_max + 1, step)
        ]
        level_queries.append(LEVEL_ANY)  # 兜底：捕获不整除步长的散装等级
    print(
        f"等级扫描序列：{level_queries[:-1]} + 不限（共 {len(level_queries)} 次查询/类别）"
        if not args.no_level_sweep
        else "等级扫描：已跳过，仅查「不限」"
    )

    seen_pairs: set = set()  # (item_name, item_level)
    all_rows: List[Dict[str, Any]] = []

    if not args.no_equip:
        for lv_str in level_queries:
            label = f"装备 Lv{lv_str}" if lv_str != LEVEL_ANY else "装备 不限"
            print(f"抓取 {label}…")

            def _equip_params(page: int, _lv: str = lv_str) -> Dict[str, Any]:
                return base_list_params(server_id, page, page_size, 0, _lv)

            all_rows.extend(
                fetch_all_list_pages(
                    LIST_EQUIP,
                    _equip_params,
                    args.sleep,
                    seen_pairs,
                    lambda r, _lv=lv_str: raw_to_record(r, "装备", "装备", _lv),
                    label,
                    max_pages,
                )
            )

    if not args.no_weapon:
        for lv_str in level_queries:
            label = f"武器 Lv{lv_str}" if lv_str != LEVEL_ANY else "武器 不限"
            print(f"抓取 {label}…")

            def _weapon_params(page: int, _lv: str = lv_str) -> Dict[str, Any]:
                return base_list_params(server_id, page, page_size, 0, _lv)

            all_rows.extend(
                fetch_all_list_pages(
                    LIST_WEAPON,
                    _weapon_params,
                    args.sleep,
                    seen_pairs,
                    lambda r, _lv=lv_str: raw_to_record(r, "武器", "武器", _lv),
                    label,
                    max_pages,
                )
            )

    if not args.no_pet:
        print("抓取宠物（种类不限、等级不限、全页）…")

        def _pet_params(page: int) -> Dict[str, Any]:
            return pet_list_params(server_id, page, page_size, 0, LEVEL_ANY)

        all_rows.extend(
            fetch_all_list_pages(
                LIST_PET,
                _pet_params,
                args.sleep,
                seen_pairs,
                lambda r: pet_raw_to_record(r, "宠物", LEVEL_ANY),
                "宠物",
                max_pages,
            )
        )

    all_rows = dedupe_records(all_rows)

    # 按等级区间过滤（宠物不受此过滤影响，category != "宠物" 才限等级）
    if not args.no_level_filter and not args.no_level_sweep:
        before = len(all_rows)
        all_rows = [
            r for r in all_rows
            if r.get("category") == "宠物"
            or args.level_min <= (r.get("item_level") or 0) <= args.level_max
        ]
        print(
            f"等级过滤（Lv{args.level_min}-Lv{args.level_max}）："
            f"{before} → {len(all_rows)} 条"
        )

    # 可选：拉取 XML 详情填充随机属性
    if args.fetch_xml:
        xml_cats = {c.strip() for c in args.xml_categories.split(",") if c.strip()}
        fill_xml_details(all_rows, args.xml_sleep, xml_cats)

    if not args.no_icons:
        print(f"下载图标到: {args.icon_dir}")
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
