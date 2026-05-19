#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 m.18183.com 问道手游数据库爬取装备属性数据。

列表页格式：https://m.18183.com/wdsyb/sjk/list_14685_{page}.html
详情页格式：https://m.18183.com/wdsyb/{year}/{id}.html

输出字段与 qibaoEquipCatalog.json 兼容：
  item_name, item_level, item_subtype_zh, item_type_id,
  base_attrs.hurt/defense/blood/magic/speed

注意：
  - 18183 数据为手游版本（端游需按比例缩放）
  - 属性字段名: 伤害/基础气血/基础法力/基础防御/基础速度
"""

from __future__ import annotations

import json
import os
import re
import time
from typing import Any, Dict, List, Optional

import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

BASE_URL = "https://m.18183.com"
LIST_URL = BASE_URL + "/wdsyb/sjk/list_14685_{page}.html"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Referer": "https://m.18183.com/wdsyb/sjk/",
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)

# ── 装备子类型映射 ────────────────────────────────────────────────────────────
# 通过关键词和五行属性推断装备槽位
WEAPON_TYPES = {'枪', '爪', '剑', '扇', '锤', '刀', '弓', '双戟', '拳套', '羽刃', '软鞭', '号角'}
ELEMENT_WEAPON = {'金': '枪', '木': '爪', '水': '剑', '火': '扇', '土': '锤'}

SLOT_TYPE_ID = {
    '武器': 201, '帽子': 202, '衣服': 203, '鞋子': 204,
    '法宝': 205, '首饰': 206, '腰带': 208,
}

# 缩放倍率（手游基础值 → 端游基础值估算）
SCALE = 3.0


def _get(url: str, sleep_s: float = 0.5) -> Optional[str]:
    time.sleep(sleep_s)
    try:
        r = SESSION.get(url, timeout=15)
        if r.status_code == 200:
            # 18183.com 使用 GBK；优先从响应头或 meta 标签检测
            enc = r.apparent_encoding or 'gbk'
            if enc.lower() in ('utf-8', 'utf8'):
                r.encoding = 'utf-8'
            else:
                r.encoding = 'gbk'
            return r.text
        print(f"  [WARN] {r.status_code} {url}")
        return None
    except Exception as e:
        print(f"  [ERR] {url}: {e}")
        return None


def _parse_kv(html: str) -> Dict[str, str]:
    """从页面中提取装备属性键值对。
    优先解析 <ul class="xjzlli"> 列表（body 真实数据），
    备用解析 <meta description>（可能截断）。
    """
    result: Dict[str, str] = {}

    # ── 方法1：<ul class="xjzlli"><li><strong>KEY</strong></li><li><strong>VAL</strong>
    ul_blocks = re.findall(
        r'<ul[^>]*class=["\'][^"\']*xjzlli[^"\']*["\'][^>]*>(.*?)</ul>',
        html, re.DOTALL | re.IGNORECASE,
    )
    for block in ul_blocks:
        strongs = re.findall(r'<strong[^>]*>(.*?)</strong>', block, re.DOTALL)
        strongs = [re.sub(r'<[^>]+>', '', s).strip() for s in strongs]
        for i in range(0, len(strongs) - 1, 2):
            k, v = strongs[i], strongs[i + 1]
            if k and v and v != '暂无':
                result[k] = v

    if result:
        return result

    # ── 方法2：meta description（备用，可能截断）
    m = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',
        html, re.IGNORECASE | re.DOTALL,
    )
    if not m:
        return {}
    desc = re.sub(r'<[^>]+>', ' ', m.group(1))
    desc = re.sub(r'\s+', ' ', desc).strip()

    KEYS = ['装备名称', '装备等级', '五行属性', '穿戴性别', '伤害', '基础气血', '基础法力',
            '基础防御', '基础速度', '获取途径']
    for key in KEYS:
        if key not in desc:
            continue
        start = desc.index(key) + len(key)
        remaining = desc[start:].strip()
        end = len(remaining)
        for other in KEYS:
            if other == key:
                continue
            pos = remaining.find(other)
            if 0 < pos < end:
                end = pos
        val = remaining[:end].strip().rstrip('，。、')
        if val and val != '暂无':
            result[key] = val

    return result


def _to_num(s: Optional[str]) -> Optional[int]:
    if s is None:
        return None
    m = re.search(r'[\d]+', s)
    return int(m.group()) if m else None


def _infer_subtype(name: str, element: Optional[str]) -> Optional[str]:
    """从装备名称或五行属性推断武器子类型。"""
    if element and element in ELEMENT_WEAPON:
        return ELEMENT_WEAPON[element]
    for wt in WEAPON_TYPES:
        if wt in name:
            return wt
    return None


def _infer_slot(name: str, kv: Dict[str, str]) -> tuple[str, int]:
    """推断槽位名称和 type_id。"""
    element = kv.get('五行属性')
    # 武器：有五行属性字段
    weapon_sub = _infer_subtype(name, element)
    if element or weapon_sub:
        return weapon_sub or '武器', 201
    # 防具：通过名称关键词
    for kw, slot, tid in [
        ('帽子', '帽子', 202), ('冠', '帽子', 202), ('盔', '帽子', 202),
        ('钗', '帽子', 202), ('巾', '帽子', 202), ('冕', '帽子', 202),
        ('衣', '衣服', 203), ('袍', '衣服', 203), ('甲', '衣服', 203),
        ('裙', '衣服', 203), ('袄', '衣服', 203),
        ('靴', '鞋子', 204), ('鞋', '鞋子', 204), ('履', '鞋子', 204),
        ('腰带', '腰带', 208), ('带', '腰带', 208), ('绦', '腰带', 208),
        ('宝', '法宝', 205), ('符', '法宝', 205), ('镜', '法宝', 205),
        ('图', '法宝', 205), ('绫', '法宝', 205), ('圈', '法宝', 205),
        ('镯', '首饰', 206), ('链', '首饰', 206), ('环', '首饰', 206),
        ('项链', '首饰', 206), ('扳指', '首饰', 206),
    ]:
        if kw in name:
            return slot, tid
    return '其他', 0


def parse_detail(url: str) -> Optional[Dict[str, Any]]:
    html = _get(url)
    if not html:
        return None

    kv = _parse_kv(html)
    name = kv.get('装备名称') or kv.get('名称')
    if not name:
        return None

    level = _to_num(kv.get('装备等级') or kv.get('等级'))

    hurt_raw  = _to_num(kv.get('伤害'))
    def_raw   = _to_num(kv.get('基础防御'))
    blood_raw = _to_num(kv.get('基础气血'))
    magic_raw = _to_num(kv.get('基础法力'))
    speed_raw = _to_num(kv.get('基础速度'))

    # 过滤：没有任何属性数值的条目（道具、宠物等）
    if all(v is None for v in [hurt_raw, def_raw, blood_raw, magic_raw, speed_raw]):
        return None

    # 推断槽位
    subtype, type_id = _infer_slot(name, kv)
    if type_id == 0:
        return None  # 无法识别的槽位，跳过

    def _scale(v: Optional[int]) -> Optional[int]:
        return round(v * SCALE) if v is not None else None

    return {
        'category': '武器' if type_id == 201 else '装备',
        'item_subtype_zh': subtype,
        'item_info_code': int(re.search(r'/(\d+)\.html', url).group(1)),
        'item_type_id': type_id,
        'item_name': name,
        'item_level': level,
        'base_attrs': {
            'hurt':    _scale(hurt_raw),
            'defense': _scale(def_raw),
            'blood':   _scale(blood_raw),
            'magic':   _scale(magic_raw),
            'speed':   _scale(speed_raw),
        },
        'random_attrs': [],
        'icon_url': '',
    }


def _to_mobile(url: str) -> str:
    """将 www.18183.com 详情 URL 转为 m.18183.com。"""
    return url.replace('https://www.18183.com', BASE_URL).replace('http://www.18183.com', BASE_URL)


def collect_item_urls(max_pages: int = 20) -> List[str]:
    """从列表页收集所有装备详情 URL。"""
    urls: list[str] = []
    seen: set = set()
    # 匹配绝对URL或相对路径，年份 6 位（201601~202599）
    pattern = re.compile(
        r'href=["\']?(?:https?://(?:www|m)\.18183\.com)?(/wdsyb/\d{6}/\d+\.html)',
        re.IGNORECASE,
    )

    for page in range(1, max_pages + 1):
        url = LIST_URL.format(page=page)
        html = _get(url)
        if not html:
            print(f"  列表第 {page} 页获取失败，停止")
            break
        found = pattern.findall(html)
        if not found:
            print(f"  列表第 {page} 页无条目，结束")
            break
        new = [BASE_URL + u for u in found if u not in seen]
        seen.update(found)
        urls.extend(new)
        print(f"  第 {page} 页: 新增 {len(new)} 条，累计 {len(urls)} 条")

    return urls


def main(max_pages: int = 20, sleep: float = 0.6, out: str = '') -> None:
    print(f"=== 18183 问道装备爬虫（缩放×{SCALE}）===")
    print("1. 收集列表页链接…")
    urls = collect_item_urls(max_pages)
    print(f"共找到 {len(urls)} 条详情链接\n")

    print("2. 爬取装备详情…")
    records: list[dict] = []
    skip = 0
    for i, url in enumerate(urls, 1):
        rec = parse_detail(url)
        if rec:
            records.append(rec)
        else:
            skip += 1
        if i % 20 == 0 or i == len(urls):
            print(f"  进度 {i}/{len(urls)}：保留 {len(records)} 件，跳过 {skip} 件")

    # 去重（同名同级只留一条）
    seen_keys: set = set()
    deduped = []
    for r in records:
        key = (r['item_name'], r['item_level'])
        if key not in seen_keys:
            seen_keys.add(key)
            deduped.append(r)
    print(f"\n去重后: {len(deduped)} 件（原 {len(records)} 件）")

    out_path = out or os.path.join(SCRIPT_DIR, 'qibao_18183_equip.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(deduped, f, ensure_ascii=False, indent=2)
    print(f"已写入 → {out_path}")

    # 统计
    from collections import Counter
    by_subtype = Counter(r['item_subtype_zh'] for r in deduped)
    print('\n类型分布:')
    for k, v in sorted(by_subtype.items(), key=lambda x: -x[1]):
        print(f'  {k}: {v}件')

    lvs = [r['item_level'] for r in deduped if r['item_level']]
    if lvs:
        print(f'等级范围: Lv{min(lvs)}-{max(lvs)}')


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--max-pages', type=int, default=20)
    p.add_argument('--sleep', type=float, default=0.6)
    p.add_argument('--out', default='')
    p.add_argument('--scale', type=float, default=3.0, help='手游→端游缩放比（默认3.0）')
    args = p.parse_args()
    SCALE = args.scale
    main(args.max_pages, args.sleep, args.out)
