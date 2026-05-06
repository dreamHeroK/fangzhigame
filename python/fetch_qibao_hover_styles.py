#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
拉取奇宝斋「购买商品」页装备 / 宠物图标 hover 浮层相关静态资源（样式 + 渲染脚本）。

站点列表页商品图使用 js_flashimg + iframep 容器，悬浮时由 XmlShowDetailInfo.js 等拉 XML 并套用
XmlShowDetailInfo.css 中的 .daojuShowDetailInfo、#templateString_equip、#templateString_pet 等规则。

用法:
  python fetch_qibao_hover_styles.py
  python fetch_qibao_hover_styles.py --out-dir ./reference/qibao_hover
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
from typing import Any, Dict, List, Tuple
from urllib.parse import urljoin, urlparse

import requests

CDN_BASE = "http://g.gyyxcdn.cn/qibao/Content"
DEFAULT_PAGE = "http://qibao.gyyx.cn/Buy/Index/"

# 与购买页底部引用一致（装备 / 宠物悬浮详情 + 公共壳样式）
DEFAULT_ASSETS: List[Tuple[str, str]] = [
    (f"{CDN_BASE}/css/common.css", "common.css"),
    (f"{CDN_BASE}/css/XmlShowDetailInfo.css", "XmlShowDetailInfo.css"),
    (f"{CDN_BASE}/js/XmlShowDetailInfo.js", "XmlShowDetailInfo.js"),
    (f"{CDN_BASE}/js/Xmlequip.js", "Xmlequip.js"),
    (f"{CDN_BASE}/js/XmlPet.js", "XmlPet.js"),
    (f"{CDN_BASE}/js/Xmlcommon.js", "Xmlcommon.js"),
    (f"{CDN_BASE}/js/Xmltemplate.js", "Xmltemplate.js"),
]

# 从 XmlShowDetailInfo.css 中筛出与装备 / 宠物浮层相关的规则块（按 `}` 粗分，极少误伤字符串中的 `}`）
FILTER_KEYWORDS = (
    "daojuShowDetailInfo",
    "templateString_equip",
    "templateString_pet",
    "#templateString_equip",
    "#templateString_pet",
    "templateString_pet_attr",
    "templateString-color",
    "#templateString_daoju",
    "cwgodbookdetail",
)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Referer": DEFAULT_PAGE,
}


def filter_css_blocks(css_text: str, keywords: Tuple[str, ...]) -> str:
    chunks: List[str] = []
    for part in css_text.split("}"):
        part = part.strip()
        if not part:
            continue
        block = part + "}"
        if any(k in block for k in keywords):
            chunks.append(block)
    return "\n\n".join(chunks) if chunks else "/* (no rules matched keywords) */\n"


def discover_assets_from_page(page_url: str, session: requests.Session, timeout: int) -> List[Tuple[str, str]]:
    """从列表页 HTML 解析 css/js 链接，只保留与 Xml / 悬浮详情相关的资源。"""
    r = session.get(page_url, timeout=timeout)
    r.raise_for_status()
    html = r.text
    found: Dict[str, str] = {}
    for m in re.finditer(
        r'<(?:link[^>]+href|script[^>]+src)\s*=\s*["\']([^"\']+)["\']',
        html,
        re.I,
    ):
        url = m.group(1).strip()
        if not url.startswith("http"):
            url = urljoin(page_url, url)
        low = url.lower()
        if any(
            x in low
            for x in (
                "xmlshowdetailinfo",
                "xmlequip",
                "xmlpet",
                "xmlcommon",
                "xmltemplate",
                "/content/css/common.css",
            )
        ):
            name = os.path.basename(urlparse(url).path.split("?")[0]) or "asset.bin"
            found[url] = name
    out = [(u, n) for u, n in found.items()]
    out.sort(key=lambda x: x[1])
    return out


def download_one(session: requests.Session, url: str, dest: str, sleep_s: float, timeout: int) -> Dict[str, Any]:
    time.sleep(sleep_s)
    r = session.get(url, timeout=timeout)
    r.raise_for_status()
    body = r.content
    os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
    with open(dest, "wb") as f:
        f.write(body)
    h = hashlib.sha256(body).hexdigest()
    return {
        "url": url,
        "path": dest,
        "bytes": len(body),
        "sha256": h,
    }


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    ap = argparse.ArgumentParser(description="拉取奇宝斋装备/宠物 hover 浮层相关 CSS/JS")
    ap.add_argument(
        "--page-url",
        default=DEFAULT_PAGE,
        help="商品列表页 URL，用于 Referer 与可选 --discover",
    )
    ap.add_argument(
        "--out-dir",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "reference", "qibao_hover_styles"),
        help="输出目录",
    )
    ap.add_argument("--sleep", type=float, default=0.35, help="两次请求间隔（秒）")
    ap.add_argument("--timeout", type=int, default=45, help="单次请求超时")
    ap.add_argument(
        "--discover",
        action="store_true",
        help="从 --page-url 解析链接并下载（否则使用内置 CDN 列表）",
    )
    args = ap.parse_args()

    out_dir = os.path.abspath(args.out_dir)
    os.makedirs(out_dir, exist_ok=True)

    session = requests.Session()
    session.headers.update(HEADERS)
    session.headers["Referer"] = args.page_url

    if args.discover:
        print(f"从页面解析资源: {args.page_url}")
        assets = discover_assets_from_page(args.page_url, session, args.timeout)
        if not assets:
            print("未发现相关资源，改用内置列表。")
            assets = list(DEFAULT_ASSETS)
    else:
        assets = list(DEFAULT_ASSETS)

    manifest: Dict[str, Any] = {
        "page_url": args.page_url,
        "assets": [],
        "notes": {
            "shell": ".daojuShowDetailInfo / .daojuShowDetailInfos — 浮层外壳（深色底 + 金边）",
            "equip": "#templateString_equip — 装备详情模板区域",
            "pet": "#templateString_pet — 宠物详情模板区域",
            "table_cell": ".goods_tab_con td .iframep / td.postd — 列表内图标格与占位（见 common.css）",
        },
    }

    print(f"输出目录: {out_dir}")
    for url, fname in assets:
        safe = re.sub(r'[^a-zA-Z0-9._-]', "_", fname)
        dest = os.path.join(out_dir, safe)
        try:
            info = download_one(session, url, dest, args.sleep, args.timeout)
            manifest["assets"].append(info)
            print(f"  OK {safe} ({info['bytes']} bytes)")
        except Exception as e:
            print(f"  FAIL {url} -> {e}")
            manifest["assets"].append({"url": url, "error": str(e)})

    # 生成装备+宠物相关 CSS 片段（仅当完整 XmlShowDetailInfo.css 已下载）
    xml_css_path = os.path.join(out_dir, "XmlShowDetailInfo.css")
    if os.path.isfile(xml_css_path):
        with open(xml_css_path, "r", encoding="utf-8", errors="replace") as f:
            full_css = f.read()
        snippet = filter_css_blocks(full_css, FILTER_KEYWORDS)
        snippet_path = os.path.join(out_dir, "snippet_equip_pet_hover.css")
        with open(snippet_path, "w", encoding="utf-8") as f:
            f.write(
                "/* Auto-filtered from XmlShowDetailInfo.css — equip (#templateString_equip) & pet (#templateString_pet) hover panel */\n\n"
            )
            f.write(snippet)
        manifest["snippet_equip_pet_hover"] = os.path.basename(snippet_path)
        print(f"已写入片段: {snippet_path} ({len(snippet)} chars)")

    man_path = os.path.join(out_dir, "manifest.json")
    with open(man_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"已写入清单: {man_path}")


if __name__ == "__main__":
    main()
