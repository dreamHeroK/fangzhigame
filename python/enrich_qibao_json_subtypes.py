#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""为已有 qibao_equip_data.json 批量写入 item_subtype_zh（帽子/刀/神兽等）。"""

from __future__ import annotations

import argparse
import json
import os
import sys

from qibao_item_taxonomy import enrich_record


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    script_dir = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description="为 qibao JSON 补充 item_subtype_zh")
    ap.add_argument("--json", default=os.path.join(script_dir, "qibao_equip_data.json"))
    args = ap.parse_args()

    path = os.path.abspath(args.json)
    with open(path, "r", encoding="utf-8") as f:
        rows = json.load(f)
    out = [enrich_record(r) for r in rows]
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"已更新 {len(out)} 条: {path}")


if __name__ == "__main__":
    main()
