"""Print the sample results table (markdown) from omr/samples/*/result.json.

  omr/.venv/bin/python omr/report_table.py [--json]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

SAMPLES = Path(__file__).resolve().parent / "samples"


def rows():
    for d in sorted(SAMPLES.iterdir()):
        f = d / "result.json"
        if not f.exists():
            continue
        r = json.load(open(f))
        for eng, e in r["engines"].items():
            c = e.get("confidence")
            v = e.get("validation") or {}
            meta = (c or {}).get("meta", {})
            parts = meta.get("parts", {})
            det = meta.get("details", {})
            facts = (c or {}).get("struct", {}).get("facts", {})
            yield {
                "sample": d.name, "kind": r.get("kind"), "engine": eng, "seconds": e.get("seconds"),
                "error": e.get("error"), "valid": v.get("valid"),
                "confidence": (c or {}).get("confidence"),
                "rec": (c or {}).get("rec", {}).get("score"),
                "struct": (c or {}).get("struct", {}).get("score"),
                "meta": meta.get("score"),
                "cadence": parts.get("cadence"), "syllables": parts.get("syllables"),
                "lines": parts.get("lines"), "incipit": parts.get("incipit"),
                "cad_exp": " ".join(det.get("cadences_expected", []) or []),
                "cad_found": " ".join(det.get("cadences_found_by_syllables", []) or []),
                "matches": det.get("cadence_matches"),
                "notes": facts.get("notes"), "measures": facts.get("measures"), "units": facts.get("sung_units"),
                "lyrics": e.get("engine_lyrics"), "injected": e.get("lyrics_injected"),
            }


def fmt(x):
    if x is None:
        return "-"
    if isinstance(x, float):
        return f"{x:.2f}"
    return str(x)


def main():
    rs = list(rows())
    if "--json" in sys.argv:
        print(json.dumps(rs, indent=1))
        return
    print("| sample | kind | engine | s/page | MEI valid | conf | rec | struct | meta | cadence | syll | lines | incipit | cadences expected -> found (strict) | notes/units |")
    print("| --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |")
    for r in rs:
        if r["error"] and r["confidence"] is None:
            print(f"| {r['sample']} | {r['kind']} | {r['engine']} | {fmt(r['seconds'])} | - | failed | | | | | | | | {r['error'][:80]} | |")
            continue
        m = r["matches"] or {}
        strict = m.get("strict") if isinstance(m, dict) else m
        cad = f"{r['cad_exp']} -> {r['cad_found']} ({strict})" if r["cad_exp"] else "n/a"
        print(f"| {r['sample']} | {r['kind']} | {r['engine']} | {fmt(r['seconds'])} | {fmt(r['valid'])} | "
              f"{fmt(r['confidence'])} | {fmt(r['rec'])} | {fmt(r['struct'])} | {fmt(r['meta'])} | "
              f"{fmt(r['cadence'])} | {fmt(r['syllables'])} | {fmt(r['lines'])} | {fmt(r['incipit'])} | {cad} | "
              f"{fmt(r['notes'])}/{fmt(r['units'])} |")


if __name__ == "__main__":
    main()
