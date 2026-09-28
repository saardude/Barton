"""Confidence scoring for OMR-generated MEI against the Bartok catalogue.

Score in [0, 1] combining three groups (see docs/MEI-OMR-RESEARCH.md, step 4):

  rec     recogniser-internal signal (only Audiveris exposes per-symbol grades)
  struct  structural sanity of the recognised score
  meta    agreement with the catalogue record(s): cadence degrees at line ends,
          syllable (sung-note) count, number of lines, incipit text vs OCR/lyrics

Usage as a module: ``score(mei_path, records, ocr_lines, engine_lyrics, rec_grade)``.
Usage from the shell: ``python confidence.py sample.mei --record bsys-12-10``.

Plain ASCII in code; all numbers rounded to 3 decimals in the output dict.
"""
from __future__ import annotations

import difflib
import json
import re
import sys
import unicodedata
from fractions import Fraction
from pathlib import Path

from lxml import etree

MEI_NS = "http://www.music-encoding.org/ns/mei"
NS = {"mei": MEI_NS}
XML_ID = "{http://www.w3.org/XML/1998/namespace}id"

PNAME_SEMITONE = {"c": 0, "d": 2, "e": 4, "f": 5, "g": 7, "a": 9, "b": 11}
ACCID_SHIFT = {"s": 1, "f": -1, "n": 0, "ss": 2, "ff": -2, "x": 2}
KEY_ORDER_SHARPS = ["f", "c", "g", "d", "a", "e", "b"]
KEY_ORDER_FLATS = ["b", "e", "a", "d", "g", "c", "f"]

# Bartok's degree names relative to the final (g1 = 1). Above the final the scale
# is the natural letter series g a b c d e f (so f = 7, f# = #7, b-flat = b3);
# below the final the same letters carry Roman numerals (f = VII, e = VI, ...).
DEGREE_ABOVE = {0: "1", 1: "b2", 2: "2", 3: "b3", 4: "3", 5: "4", 6: "#4",
                7: "5", 8: "b6", 9: "6", 10: "7", 11: "#7"}
DEGREE_BELOW = {1: "#VII", 2: "VII", 3: "VI", 4: "bVI", 5: "V", 6: "#IV",
                7: "IV", 8: "III", 9: "bIII", 10: "II", 11: "bII", 12: "VIII"}
VALID_DURS = {"long", "breve", "1", "2", "4", "8", "16", "32", "64", "128"}

WEIGHTS = {"rec": 0.15, "struct": 0.15, "meta": 0.70}
META_WEIGHTS = {"cadence": 0.50, "syllables": 0.25, "lines": 0.10, "incipit": 0.15}
STRUCT_WEIGHTS = {"staves": 0.2, "content": 0.2, "rests": 0.2, "durations": 0.2,
                  "empty": 0.2}


def degree_name(semitones: int) -> str:
    """Bartok-style degree of a pitch ``semitones`` above (or below) the final."""
    if semitones >= 0:
        base = DEGREE_ABOVE[semitones % 12]
        octave = semitones // 12
        if octave == 0:
            return base
        m = re.match(r"([b#]?)(\d+)", base)
        return f"{m.group(1)}{int(m.group(2)) + 7 * octave}"
    below = -semitones
    if below > 12:
        below = ((below - 1) % 12) + 1
    return DEGREE_BELOW[below]


def normalise_text(s: str | None) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]", "", s.lower())


def keysig_map(keysig: str | None) -> dict:
    """'1s' -> {'f': 1}; '2f' -> {'b': -1, 'e': -1}; '0' -> {}."""
    if not keysig or keysig in ("0", "mixed"):
        return {}
    m = re.match(r"(\d)([sf])", keysig)
    if not m:
        return {}
    n, kind = int(m.group(1)), m.group(2)
    letters = KEY_ORDER_SHARPS[:n] if kind == "s" else KEY_ORDER_FLATS[:n]
    return {l: (1 if kind == "s" else -1) for l in letters}


def dur_fraction(el) -> Fraction | None:
    dur = el.get("dur")
    if dur is None:
        return None
    if dur == "breve":
        base = Fraction(2)
    elif dur == "long":
        base = Fraction(4)
    elif dur.isdigit():
        base = Fraction(1, int(dur))
    else:
        return None
    dots = int(el.get("dots") or 0)
    total = base
    add = base
    for _ in range(dots):
        add /= 2
        total += add
    return total


def parse_mei(path: str | Path) -> dict:
    """Extract a monophonic event list (staff 1, layer 1) and structural facts."""
    tree = etree.parse(str(path))
    root = tree.getroot()
    staffdefs = root.findall(".//mei:staffDef", NS)
    scoredef = root.find(".//mei:scoreDef", NS)
    meter_count = meter_unit = None
    keysig = None
    for sd in [scoredef] + staffdefs if scoredef is not None else staffdefs:
        if sd is None:
            continue
        meter_count = meter_count or sd.get("meter.count")
        meter_unit = meter_unit or sd.get("meter.unit")
        keysig = keysig or sd.get("keysig")
        ms = sd.find("mei:meterSig", NS)
        if ms is not None:
            meter_count = meter_count or ms.get("count")
            meter_unit = meter_unit or ms.get("unit")
        ks = sd.find("mei:keySig", NS)
        if ks is not None:
            keysig = keysig or ks.get("sig")
    key = keysig_map(keysig)

    measures = root.findall(".//mei:measure", NS)
    # system index of each measure: count <sb> elements met in document order
    system_of_measure = {}
    n_sb = 0
    for el in root.iter():
        tag = etree.QName(el).localname
        if tag == "sb":
            n_sb += 1
        elif tag == "measure":
            system_of_measure[el] = n_sb
    events = []  # dicts: kind, midi, pname, oct, dur, grace, id, measure, system
    measure_info = []
    slur_ranges = []  # (startid, endid)
    for mi, m in enumerate(measures):
        staff = m.find("mei:staff[@n='1']", NS)
        if staff is None:
            staff = m.find("mei:staff", NS)
        layer = staff.find("mei:layer", NS) if staff is not None else None
        filled = Fraction(0)
        n_notes = n_rests = 0
        accid_state = {}  # letter+oct -> shift within this measure
        if layer is not None:
            for el in layer.iter():
                tag = etree.QName(el).localname
                if tag not in ("note", "rest", "mRest", "space", "chord"):
                    continue
                if tag == "chord":
                    continue
                grace = el.get("grace") is not None
                frac = dur_fraction(el)
                if tag == "note":
                    pname = el.get("pname")
                    octv = el.get("oct")
                    midi = None
                    if pname and octv is not None:
                        accid_el = el.find("mei:accid", NS)
                        accid = el.get("accid") or (accid_el.get("accid") if accid_el is not None else None)
                        accid_ges = el.get("accid.ges") or (accid_el.get("accid.ges") if accid_el is not None else None)
                        keyid = f"{pname}{octv}"
                        if accid:
                            shift = ACCID_SHIFT.get(accid, 0)
                            accid_state[keyid] = shift
                        elif accid_ges:
                            shift = ACCID_SHIFT.get(accid_ges, 0)
                        elif keyid in accid_state:
                            shift = accid_state[keyid]
                        else:
                            shift = key.get(pname, 0)
                        midi = 12 * (int(octv) + 1) + PNAME_SEMITONE[pname] + shift
                    if not grace:
                        n_notes += 1
                        if frac is not None:
                            filled += frac
                    events.append({"kind": "note", "midi": midi, "pname": pname, "oct": octv,
                                   "dur": el.get("dur"), "dots": el.get("dots"), "grace": grace,
                                   "id": el.get(XML_ID), "measure": mi, "system": system_of_measure.get(m, 0),
                                   "valid_dur": el.get("dur") in VALID_DURS})
                else:
                    n_rests += 1
                    if tag == "mRest" and meter_count and meter_unit:
                        frac = Fraction(int(meter_count), int(meter_unit))
                    if frac is not None:
                        filled += frac
                    events.append({"kind": "rest", "midi": None, "dur": el.get("dur"), "grace": False,
                                   "id": el.get(XML_ID), "measure": mi, "system": system_of_measure.get(m, 0),
                                   "valid_dur": tag == "mRest" or el.get("dur") in VALID_DURS})
        for s in m.findall("mei:slur", NS) + m.findall("mei:tie", NS):
            if s.get("startid") and s.get("endid"):
                slur_ranges.append((s.get("startid").lstrip("#"), s.get("endid").lstrip("#")))
        measure_info.append({"n": m.get("n"), "notes": n_notes, "rests": n_rests, "filled": filled})

    # tie attributes on notes (verovio also writes @tie="i"/"m"/"t")
    idx_by_id = {e["id"]: i for i, e in enumerate(events) if e.get("id")}
    continuation = set()
    for a, b in slur_ranges:
        if a in idx_by_id and b in idx_by_id:
            lo, hi = sorted((idx_by_id[a], idx_by_id[b]))
            if events[lo].get("grace"):
                continue  # a slur from a grace note is an ornament, not a melisma
            for i in range(lo + 1, hi + 1):
                if events[i]["kind"] == "note":
                    continuation.add(i)
    for note in root.findall(".//mei:note", NS):
        t = note.get("tie")
        if t in ("m", "t") and note.get(XML_ID) in idx_by_id:
            continuation.add(idx_by_id[note.get(XML_ID)])

    units = []  # syllabic units: index of first note per sung syllable
    for i, e in enumerate(events):
        if e["kind"] != "note" or e["grace"] or e["midi"] is None:
            continue
        if i in continuation:
            continue
        units.append(i)

    n_sb = len(root.findall(".//mei:sb", NS))
    n_systems = n_sb + 1 if measures else 0
    lyric_syls = [s.text or "" for s in root.findall(".//mei:verse//mei:syl", NS)]
    return {
        "staves": len(staffdefs),
        "measures": len(measures),
        "notes": sum(1 for e in events if e["kind"] == "note" and not e["grace"]),
        "grace_notes": sum(1 for e in events if e["kind"] == "note" and e["grace"]),
        "rests": sum(1 for e in events if e["kind"] == "rest"),
        "meter": (meter_count, meter_unit),
        "keysig": keysig,
        "events": events,
        "units": units,
        "measure_info": measure_info,
        "systems": n_systems,
        "lyric_syllables": lyric_syls,
    }


def structural_score(m: dict) -> dict:
    notes, rests, measures = m["notes"], m["rests"], m["measures"]
    parts = {}
    parts["staves"] = 1.0 if m["staves"] >= 1 else 0.0
    parts["content"] = 1.0 if (measures > 0 and notes > 0) else 0.0
    parts["rests"] = 1.0 if notes == 0 else max(0.0, 1.0 - max(0.0, rests / (notes + rests) - 0.15) / 0.35)
    bad_dur = sum(1 for e in m["events"] if not e.get("valid_dur"))
    parts["durations"] = 1.0 if not m["events"] else max(0.0, 1.0 - bad_dur / len(m["events"]))
    # measures whose content does not fill the metre (first/last excused as anacrusis)
    mc, mu = m["meter"]
    unfilled = 0
    if mc and mu and measures > 2:
        want = Fraction(int(mc), int(mu))
        inner = m["measure_info"][1:-1]
        unfilled = sum(1 for x in inner if x["filled"] != want)
        parts["durations"] = min(parts["durations"], max(0.0, 1.0 - unfilled / max(1, len(inner))))
    empty = sum(1 for x in m["measure_info"] if x["notes"] == 0)
    parts["empty"] = 1.0 if measures == 0 else max(0.0, 1.0 - empty / measures)
    score = sum(STRUCT_WEIGHTS[k] * v for k, v in parts.items())
    return {"score": round(score, 3), "parts": {k: round(v, 3) for k, v in parts.items()},
            "facts": {"staves": m["staves"], "measures": measures, "notes": notes,
                      "grace_notes": m["grace_notes"], "rests": rests, "sung_units": len(m["units"]),
                      "unfilled_measures": unfilled, "empty_measures": empty,
                      "meter": "/".join(str(x) for x in m["meter"]) if all(m["meter"]) else None,
                      "keysig": m["keysig"], "systems": m["systems"]}}


def parse_cadences(s: str | None) -> list[str]:
    if not s:
        return []
    s = re.split(r"[/;]", s)[0]
    toks = re.findall(r"[b#]?(?:VIII|VII|VI|IV|V|III|II|I|\d+)", s.replace("(", " ").replace(")", " "))
    return toks


def parse_syllables(s: str | None, n_lines: int) -> list[int]:
    if not s:
        return []
    nums = [int(x) for x in re.findall(r"\d+", s)]
    if not nums:
        return []
    if n_lines <= 0:
        return nums
    if len(nums) == 1:
        return nums * n_lines
    if len(nums) == 2 and n_lines == 4:
        return [nums[0], nums[1], nums[0], nums[1]]
    while len(nums) < n_lines:
        nums.append(nums[-1])
    return nums[:n_lines]


def recognised_cadences(m: dict, syllables: list[int]) -> dict:
    """Line-ending degrees of the recognised melody, relative to the final (the last
    sung note of the whole recognised melody, which in these editions is the final
    even when several strophes or variants are notated).

    Two segmentations are tried: (a) by the catalogue syllable counts (line i ends at
    sung unit sum(syllables[:i+1])), reported strictly and with a tolerance of one
    unit either side; (b) by system breaks when the number of systems equals the
    number of lines (master sheets and slips have one line per system only rarely,
    printed editions usually two, so (b) is often unavailable)."""
    units = m["units"]
    total = sum(syllables)
    out = {"by_syllables": [], "by_syllables_tolerant": [], "by_systems": None, "strophes": 0, "final": None,
           "final_source": None}
    if not units or total == 0:
        return out
    out["strophes"] = max(1, round(len(units) / total))
    # Two candidates for the final: the last sung note of everything recognised (right when
    # the page ends with the tune) and the last note of strophe 1 by syllable count (right
    # when variant fragments follow the tune, as on the master sheets). The caller picks the
    # candidate that agrees better with the catalogue and records which one it was.
    cands = [("last-note", m["events"][units[-1]]["midi"])]
    if len(units) >= total:
        c2 = m["events"][units[total - 1]]["midi"]
        if c2 != cands[0][1]:
            cands.append(("end-of-strophe-1", c2))
    out["final_candidates"] = cands
    out["per_final"] = {}
    events = m["events"]
    sys_of_unit = [events[i].get("system", 0) for i in units]
    n_sys = m["systems"]
    for source, final in cands:
        def deg(unit_index, final=final):
            if unit_index < 0 or unit_index >= len(units):
                return "?"
            return degree_name(events[units[unit_index]]["midi"] - final)

        res = {"final": final, "by_syllables": [], "by_syllables_tolerant": [], "by_systems": None}
        pos = 0
        for syl in syllables:
            pos += syl
            res["by_syllables"].append(deg(pos - 1))
            res["by_syllables_tolerant"].append([deg(pos - 2), deg(pos - 1), deg(pos)])
        if n_sys == len(syllables) and sys_of_unit:
            cads = []
            for s in range(n_sys):
                idx = [k for k, sy in enumerate(sys_of_unit) if sy == s]
                cads.append(deg(idx[-1]) if idx else "?")
            res["by_systems"] = cads
        out["per_final"][source] = res
    first = out["per_final"][cands[0][0]]
    out.update({k: first[k] for k in ("final", "by_syllables", "by_syllables_tolerant", "by_systems")})
    out["final_source"] = cands[0][0]
    return out


def best_window_ratio(needle: str, hay: str) -> float:
    if not needle or not hay:
        return 0.0
    n = len(needle)
    if len(hay) <= n:
        return difflib.SequenceMatcher(None, needle, hay).ratio()
    best = 0.0
    for i in range(0, len(hay) - n + 1):
        r = difflib.SequenceMatcher(None, needle, hay[i:i + n]).ratio()
        if r > best:
            best = r
            if best > 0.98:
                break
    return best


def incipit_score(incipit: str | None, ocr_lines: list[str], lyrics: list[str]) -> dict:
    inc = normalise_text(incipit)
    if not inc:
        return {"score": None, "source": None}
    cands = []
    lines = [normalise_text(l) for l in ocr_lines]
    for i, l in enumerate(lines):
        cands.append(("ocr", l))
        if i + 1 < len(lines):
            cands.append(("ocr", l + lines[i + 1]))
    cands.append(("ocr-all", "".join(lines)))
    if lyrics:
        cands.append(("lyrics", "".join(normalise_text(x) for x in lyrics)))
    best, src = 0.0, None
    for s, text in cands:
        r = best_window_ratio(inc, text)
        if r > best:
            best, src = r, s
    return {"score": round(best, 3), "source": src, "incipit": incipit}


def catalogue_score(m: dict, records: list[dict], ocr_lines: list[str], lyrics: list[str]) -> dict:
    """Agreement with one or more catalogue records (several when a printed page
    carries several melodies; then only the incipit test is meaningful)."""
    out = {"parts": {}, "details": {}}
    rec = records[0] if records else {}
    music = rec.get("music") or {}
    cad_expected = parse_cadences(music.get("cadences"))
    n_lines = len(cad_expected)
    syllables = parse_syllables(music.get("syllables"), n_lines)
    if len(records) == 1 and cad_expected and syllables:
        rc = recognised_cadences(m, syllables)
        n = len(cad_expected) - 1  # the last cadence is 1 by construction; compare the first n-1
        exp = [c.upper() for c in cad_expected[:-1]]
        best_score, best_src, best_res = -1.0, None, None
        for src, res in (rc.get("per_final") or {}).items():
            strict = sum(1 for a, b in zip(exp, res["by_syllables"][:n]) if a == b.upper())
            tolerant = sum(1 for a, cands in zip(exp, res["by_syllables_tolerant"][:n])
                           if a in [c.upper() for c in cands])
            by_sys = None
            if res["by_systems"]:
                by_sys = sum(1 for a, b in zip(exp, res["by_systems"][:n]) if a == b.upper())
            # score: half strict (or system-based), half tolerant
            sc = (0.5 * max(strict, by_sys or 0) / n + 0.5 * max(tolerant, by_sys or 0) / n) if n else 0.0
            if sc > best_score:
                best_score, best_src = sc, src
                best_res = {"strict": strict, "tolerant": tolerant, "by_sys": by_sys, "res": res}
        if best_res is None:
            out["parts"]["cadence"] = 0.0
            out["details"]["cadences_expected"] = cad_expected
            out["details"]["cadences_found_by_syllables"] = []
        else:
            r_ = best_res["res"]
            out["parts"]["cadence"] = round(best_score, 3)
            out["details"]["cadences_expected"] = cad_expected
            out["details"]["cadences_found_by_syllables"] = r_["by_syllables"]
            out["details"]["cadences_found_by_systems"] = r_["by_systems"]
            out["details"]["cadence_matches"] = {
                "strict": f"{best_res['strict']}/{n}", "tolerant": f"{best_res['tolerant']}/{n}",
                "by_systems": f"{best_res['by_sys']}/{n}" if best_res["by_sys"] is not None else None}
            out["details"]["final_midi"] = r_["final"]
            out["details"]["final_source"] = best_src
            out["details"]["final_candidates"] = rc["final_candidates"]
        out["details"]["strophes_notated"] = rc["strophes"]
        total = sum(syllables)
        n_units = len(m["units"])
        k = max(1, min(4, round(n_units / total))) if total else 1
        out["parts"]["syllables"] = round(min(n_units, k * total) / max(n_units, k * total), 3) if total and n_units else 0.0
        out["details"]["syllables_expected"] = syllables
        out["details"]["sung_units_found"] = n_units
        systems = m["systems"]
        if systems and n_lines:
            ratio = min(systems, n_lines * k) / max(systems, n_lines * k)
            # printed editions put two text lines per system; accept 2:1 as well
            ratio2 = min(systems * 2, n_lines * k) / max(systems * 2, n_lines * k)
            out["parts"]["lines"] = round(max(ratio, ratio2), 3)
        else:
            out["parts"]["lines"] = 0.0
        out["details"]["lines_expected"] = n_lines
        out["details"]["systems_found"] = systems
    else:
        out["parts"]["cadence"] = None
        out["parts"]["syllables"] = None
        out["parts"]["lines"] = None
        out["details"]["note"] = ("catalogue has no cadence/syllable data for this record" if len(records) == 1
                                  else f"page carries {len(records)} records; only incipit tested")
    inc_scores = []
    inc_details = []
    for r in records:
        s = incipit_score(r.get("incipit") or r.get("title"), ocr_lines, lyrics)
        if s["score"] is not None:
            inc_scores.append(s["score"])
            inc_details.append({"id": r.get("id"), **s})
    out["parts"]["incipit"] = round(sum(inc_scores) / len(inc_scores), 3) if inc_scores else None
    out["details"]["incipit"] = inc_details
    # a test that cannot run (no catalogue data, several melodies on the page) is not
    # evidence either way: it enters as an uninformative 0.5 prior and is listed as such
    priors = [k for k, v in out["parts"].items() if v is None]
    out["priors"] = priors
    out["score"] = round(sum(META_WEIGHTS[k] * (0.5 if v is None else v) for k, v in out["parts"].items()), 3)
    return out


def score(mei_path, records, ocr_lines=None, engine_lyrics=None, rec_grade=None) -> dict:
    m = parse_mei(mei_path)
    st = structural_score(m)
    meta = catalogue_score(m, records or [], ocr_lines or [], engine_lyrics or m["lyric_syllables"])
    groups = {"rec": rec_grade, "struct": st["score"], "meta": meta["score"]}
    avail = {k: v for k, v in groups.items() if v is not None}
    wsum = sum(WEIGHTS[k] for k in avail)
    overall = round(sum(WEIGHTS[k] * v for k, v in avail.items()) / wsum, 3) if avail else 0.0
    return {
        "confidence": overall,
        "weights_used": {k: round(WEIGHTS[k] / wsum, 3) for k in avail},
        "rec": {"score": rec_grade},
        "struct": st,
        "meta": meta,
        "pitches": [f"{e['pname']}{e['oct']}" for e in m["events"] if e["kind"] == "note" and not e["grace"]][:80],
    }


def _load_records(ids: list[str]) -> list[dict]:
    songs = json.load(open(Path(__file__).resolve().parent.parent / "data" / "songs.json"))
    by = {s["id"]: s for s in songs}
    return [by[i] for i in ids if i in by]


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("mei")
    ap.add_argument("--record", action="append", default=[], help="catalogue record id (repeatable)")
    ap.add_argument("--ocr", help="ocr.json written by pipeline.py")
    args = ap.parse_args()
    ocr_lines = []
    if args.ocr:
        ocr_lines = [x["text"] for x in json.load(open(args.ocr))["lines"]]
    print(json.dumps(score(args.mei, _load_records(args.record), ocr_lines), indent=1, ensure_ascii=False))
