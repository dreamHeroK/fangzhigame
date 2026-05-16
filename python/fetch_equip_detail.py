#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
第二阶段：对奇宝斋市场收集到的每条装备，逐一调用 XML 详情接口，
获取精确的基础属性（basic_attrib）和随机属性（attrib）。

工作流：
  1. 从 qibao_equip_data.json 读取 item_info_code 列表（来自 crawl.py 输出）
  2. 自动探测有效的 XML 详情 URL 格式（多个候选依次尝试）
  3. 批量拉取 XML 详情，解析 <basic_attrib> 和 <attrib> 节点
  4. 合并回原 JSON，写入 qibao_equip_detail.json（支持断点续抓）

用法：
  python fetch_equip_detail.py
  python fetch_equip_detail.py --input qibao_equip_data.json --output qibao_equip_detail.json
  python fetch_equip_detail.py --categories 装备,武器 --sleep 1.0
  python fetch_equip_detail.py --resume      # 跳过已有 random_attrs 的条目
  python fetch_equip_detail.py --probe-only  # 仅探测 URL，不抓取
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
from typing import Any, Dict, List, Optional, Tuple

import requests

QIBAO_ORIGIN = "https://qibao.gyyx.cn"

# 按可能性排列的 XML 详情 URL 候选（itemId 参数传 ItemInfoCode）
XML_URL_CANDIDATES = [
    f"{QIBAO_ORIGIN}/ItemInfo/ItemDetailXml",
    f"{QIBAO_ORIGIN}/ItemInfo/GetEquipXml",
    f"{QIBAO_ORIGIN}/ItemInfo/ItemXml",
    f"{QIBAO_ORIGIN}/ItemInfo/GetItemDetailXml",
    f"{QIBAO_ORIGIN}/iteminfo/ItemDetailXml",
    f"{QIBAO_ORIGIN}/iteminfo/GetEquipXml",
]

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_INPUT = os.path.join(SCRIPT_DIR, "qibao_equip_data.json")
DEFAULT_OUTPUT = os.path.join(SCRIPT_DIR, "qibao_equip_detail.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/xml,application/xml,*/*;q=0.9",
    "Referer": f"{QIBAO_ORIGIN}/Buy/Index/",
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


# ===================== XML 解析 =====================

def _resolve_display(type_str: str, value: str) -> str:
    """将 type 模板中的 %s / %s% 替换为实际值。"""
    if not type_str:
        return value
    if "," in value:
        idx = value.rfind(",")
        main_val = value[:idx]
        pct_val = value[idx + 1:]
        result = re.sub(r"%s%|%s", main_val, type_str, count=1)
        result = re.sub(r"\(%s\)", "", result).strip()
        return f"{result} (+{pct_val}%)"
    return re.sub(r"%s%|%s", value, type_str)


def parse_xml_attribs(xml_bytes: bytes) -> Optional[Dict[str, List[Dict[str, str]]]]:
    """
    解析装备 XML 详情字节流，返回：
      {
        "base_attrs": [{"type":..., "value":..., "display":..., "color":...}, ...],
        "random_attrs": [...]
      }
    解析失败返回 None。
    """
    try:
        text = xml_bytes.decode("utf-8", errors="replace")
        root = ET.fromstring(text)
    except ET.ParseError:
        return None

    # 尝试找 <attribs> 容器
    container = root.find("attribs") or root

    base_list: List[Dict[str, str]] = []
    rand_list: List[Dict[str, str]] = []

    for elem in container.iter():
        tag = elem.tag.lower()
        if tag not in ("basic_attrib", "attrib"):
            continue
        type_str = (elem.get("type") or "").strip()
        color = (elem.get("color") or "").strip()
        value = (elem.text or "").strip()
        if not type_str and not value:
            continue
        entry = {
            "type": type_str,
            "value": value,
            "display": _resolve_display(type_str, value),
            "color": color,
        }
        if tag == "basic_attrib":
            base_list.append(entry)
        else:
            rand_list.append(entry)

    # 空结果视为解析失败（可能是错误页面）
    if not base_list and not rand_list:
        return None
    return {"base_attrs": base_list, "random_attrs": rand_list}


def is_valid_xml_response(content: bytes) -> bool:
    """快速检查响应是否是包含 attribs 标签的有效装备 XML。"""
    if len(content) < 20:
        return False
    snippet = content[:500].decode("utf-8", errors="replace").lower()
    return "<attribs" in snippet or "<basic_attrib" in snippet or "<attrib" in snippet


# ===================== URL 探测 =====================

def probe_xml_url(item_codes: List[int], sleep_s: float) -> Optional[str]:
    """
    用前几个 item_code 探测哪个 URL 模板能返回有效 XML。
    返回有效的 URL 字符串，失败返回 None。
    """
    probe_codes = item_codes[:5]
    print("探测 XML 详情接口 URL…")

    for url_base in XML_URL_CANDIDATES:
        print(f"  尝试: {url_base}")
        hits = 0
        for code in probe_codes:
            try:
                time.sleep(sleep_s)
                params = {"itemId": code, "r": random.random()}
                resp = SESSION.get(url_base, params=params, timeout=20)
                if resp.status_code == 200 and is_valid_xml_response(resp.content):
                    hits += 1
            except Exception:
                pass
        if hits > 0:
            print(f"  ✓ 有效 URL: {url_base}（{hits}/{len(probe_codes)} 探测命中）")
            return url_base
        print(f"    ✗ 无有效响应")

    print("所有候选 URL 均无效。")
    print("建议：在浏览器打开奇宝斋商品列表，F12 > Network，")
    print("      鼠标悬停装备图标，找到返回 XML 的请求 URL，")
    print("      用 --xml-url 参数手动指定。")
    return None


# ===================== 单条抓取 =====================

def fetch_detail(xml_url: str, item_info_code: int, sleep_s: float) -> Optional[Dict]:
    params = {"itemId": item_info_code, "r": random.random()}
    try:
        time.sleep(sleep_s)
        resp = SESSION.get(xml_url, params=params, timeout=25)
        resp.raise_for_status()
        if not resp.content:
            return None
        return parse_xml_attribs(resp.content)
    except Exception as exc:
        return None


# ===================== 增量保存 =====================

def load_checkpoint(output_path: str) -> Dict[int, Dict]:
    """加载已有输出文件，返回 {item_info_code: record} 字典。"""
    if not os.path.isfile(output_path):
        return {}
    with open(output_path, "r", encoding="utf-8") as f:
        rows = json.load(f)
    return {int(r["item_info_code"]): r for r in rows if r.get("item_info_code")}


def save_rows(output_path: str, rows: List[Dict]) -> None:
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)


# ===================== 主程序 =====================

def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    ap = argparse.ArgumentParser(
        description="批量拉取奇宝斋装备 XML 详情，提取基础属性与随机属性"
    )
    ap.add_argument("--input", default=DEFAULT_INPUT, help="crawl.py 输出的 JSON 文件")
    ap.add_argument("--output", default=DEFAULT_OUTPUT, help="输出 JSON 文件")
    ap.add_argument("--sleep", type=float, default=0.8, help="请求间隔（秒）")
    ap.add_argument("--categories", default="装备,武器", help="只处理的类别，逗号分隔")
    ap.add_argument(
        "--xml-url",
        default=None,
        help="手动指定 XML 详情接口 base URL（跳过自动探测）",
    )
    ap.add_argument(
        "--probe-only",
        action="store_true",
        help="只探测 URL 可用性，不执行批量抓取",
    )
    ap.add_argument(
        "--resume",
        action="store_true",
        help="跳过输出文件中已有 random_attrs（断点续抓）",
    )
    ap.add_argument(
        "--checkpoint-every",
        type=int,
        default=100,
        help="每抓取 N 条保存一次（默认 100）",
    )
    ap.add_argument(
        "--limit",
        type=int,
        default=0,
        help="只处理前 N 条（0=不限，调试用）",
    )
    args = ap.parse_args()

    # 读取输入
    with open(args.input, "r", encoding="utf-8") as f:
        all_rows: List[Dict] = json.load(f)

    target_cats = {c.strip() for c in args.categories.split(",") if c.strip()}
    targets = [r for r in all_rows if r.get("category") in target_cats and r.get("item_info_code")]
    if args.limit > 0:
        targets = targets[:args.limit]

    print(f"输入: {len(all_rows)} 条，筛选 {target_cats} 后: {len(targets)} 条")

    # 收集所有 code
    all_codes = [int(r["item_info_code"]) for r in targets]

    # 探测或使用指定 URL
    xml_url = args.xml_url
    if not xml_url:
        xml_url = probe_xml_url(all_codes, args.sleep)
    else:
        print(f"使用指定 URL: {xml_url}")

    if args.probe_only:
        return

    if not xml_url:
        print("无法确定 XML 接口 URL，退出。请用 --xml-url 手动指定。")
        sys.exit(1)

    # 加载断点（resume 模式）
    done_codes: set = set()
    checkpoint: Dict[int, Dict] = {}
    if args.resume and os.path.isfile(args.output):
        checkpoint = load_checkpoint(args.output)
        done_codes = {
            code for code, rec in checkpoint.items()
            if rec.get("random_attrs") is not None
        }
        print(f"断点续抓：已完成 {len(done_codes)} 条")

    # 构建输出字典（从所有输入行初始化）
    out_by_code: Dict[int, Dict] = {}
    for r in all_rows:
        code = r.get("item_info_code")
        if code is not None:
            out_by_code[int(code)] = dict(r)  # 复制，保留原始字段

    # 覆盖已有 checkpoint 数据
    out_by_code.update(checkpoint)

    # 批量抓取
    pending = [c for c in all_codes if c not in done_codes]
    total = len(pending)
    print(f"\n开始批量抓取 XML 详情（{total} 条）…")

    ok = fail = 0
    for i, code in enumerate(pending, 1):
        detail = fetch_detail(xml_url, code, args.sleep)
        rec = out_by_code.get(code)
        if rec is None:
            continue

        if detail:
            # 合并 XML 基础属性进 base_attrs
            if "base_attrs" not in rec or not isinstance(rec["base_attrs"], dict):
                rec["base_attrs"] = {}
            if detail.get("base_attrs"):
                rec["base_attrs"]["xml_base"] = detail["base_attrs"]
            rec["random_attrs"] = detail.get("random_attrs") or []
            ok += 1
        else:
            # 标记抓取失败但不覆盖已有数据
            if rec.get("random_attrs") is None:
                rec["random_attrs"] = []
            fail += 1

        # 定期保存
        if i % args.checkpoint_every == 0 or i == total:
            out_rows = list(out_by_code.values())
            save_rows(args.output, out_rows)
            print(f"  [{i}/{total}] 成功 {ok} / 失败 {fail}，已保存 {args.output}")

    # 最终汇总
    out_rows = list(out_by_code.values())
    save_rows(args.output, out_rows)

    has_random = sum(1 for r in out_rows if r.get("random_attrs"))
    print(f"\n完成：共 {len(out_rows)} 条写入 {args.output}")
    print(f"  含随机属性：{has_random} 条")
    print(f"  无随机属性：{len(out_rows) - has_random} 条（未上架或接口未返回）")

    if fail > 0:
        print(f"\n[提示] {fail} 条抓取失败，可用 --resume 重跑补抓。")


if __name__ == "__main__":
    main()
