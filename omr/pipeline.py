"""Image -> OMR engine -> MusicXML -> MEI (verovio) -> SVG/MIDI, with header/lyric OCR
merged into the MEI header, schema validation and a confidence score.

Run inside omr/.venv (verovio, lxml, rapidocr, pillow). The OMR engines live in their
own environments (see omr/README.md):

  homr       omr/.venv-homr/bin/homr            (vision transformer, ONNX, CPU)
  oemer      omr/.venv-oemer/bin/oemer          (U-net segmentation, ONNX, CPU)
  audiveris  omr/cache/audiveris/opt/audiveris  (Java, bundled JRE + Tesseract)

Example:
  .venv/bin/python pipeline.py --id bsys-12-10 --suffix pr \
      --image https://systems.zti.hu/media/images/publications/BR_00010_pr.gif \
      --engines homr,audiveris

Outputs go to omr/samples/<id>[__suffix]/: input.*, input.png, ocr.json, <engine>.musicxml,
<engine>.mei, <engine>.svg, <engine>.mid, <engine>.log, result.json.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import json
import re
import shutil
import subprocess
import sys
import time
import zipfile
from pathlib import Path

from lxml import etree
from PIL import Image

import confidence

OMR_DIR = Path(__file__).resolve().parent
ROOT = OMR_DIR.parent
CACHE = OMR_DIR / "cache"
SAMPLES = OMR_DIR / "samples"
SCHEMA = CACHE / "5.1-mei-all.rng"
SCHEMA_URL = "https://music-encoding.org/schema/5.1/mei-all.rng"
MEI_NS = "http://www.music-encoding.org/ns/mei"
NS = {"mei": MEI_NS}
XML_ID = "{http://www.w3.org/XML/1998/namespace}id"
USER_AGENT = "Barton-viewer research (tsaar@maltandbrew.com)"

ENGINES = {
    "homr": OMR_DIR / ".venv-homr" / "bin" / "homr",
    "oemer": OMR_DIR / ".venv-oemer" / "bin" / "oemer",
    "audiveris": CACHE / "audiveris" / "opt" / "audiveris",
}

_last_fetch = 0.0


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def fetch(url: str) -> Path:
    """Download into omr/cache/img at 1 request/s per host; return the cached path."""
    global _last_fetch
    import requests
    dest = CACHE / "img" / url.rsplit("/", 1)[-1]
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    wait = 1.0 - (time.time() - _last_fetch)
    if wait > 0:
        time.sleep(wait)
    r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=60)
    _last_fetch = time.time()
    r.raise_for_status()
    dest.write_bytes(r.content)
    return dest


def prepare_image(src: Path, out_dir: Path) -> tuple[Path, Path]:
    """Copy the input, write input.png (grey) and input_x2.png (for Audiveris, which
    needs ~20 px interline)."""
    shutil.copy(src, out_dir / f"input{src.suffix.lower()}")
    im = Image.open(src).convert("L")
    png = out_dir / "input.png"
    im.save(png)
    x2 = out_dir / "input_x2.png"
    if im.width < 2000:
        im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(x2)
    else:
        im.save(x2)
    return png, x2


def run_ocr(png: Path, out: Path) -> list[dict]:
    from rapidocr_onnxruntime import RapidOCR
    t0 = time.time()
    res, _ = RapidOCR()(str(png))
    lines = []
    for box, text, sc in res or []:
        ys = [p[1] for p in box]
        xs = [p[0] for p in box]
        lines.append({"text": text, "score": round(float(sc), 3), "x": int(min(xs)), "y": int(min(ys)),
                      "h": int(max(ys) - min(ys))})
    lines.sort(key=lambda l: (l["y"] // 12, l["x"]))
    out.write_text(json.dumps({"engine": "rapidocr-onnxruntime", "seconds": round(time.time() - t0, 1),
                               "lines": lines}, ensure_ascii=False, indent=1))
    return lines


def run_engine(engine: str, png: Path, x2: Path, out_dir: Path) -> dict:
    """Run one recogniser; return {musicxml, seconds, log, error}."""
    work = out_dir / f"_{engine}"
    if work.exists():
        shutil.rmtree(work)
    work.mkdir()
    logf = out_dir / f"{engine}.log"
    t0 = time.time()
    res = {"engine": engine, "musicxml": None, "seconds": None, "error": None}
    try:
        if engine == "homr":
            shutil.copy(png, work / "page.png")
            cmd = [str(ENGINES["homr"]), str(work / "page.png")]
        elif engine == "oemer":
            cmd = [str(ENGINES["oemer"]), "-o", str(work), str(png)]
        elif engine == "audiveris":
            a = ENGINES["audiveris"]
            shutil.copy(x2, work / "page.png")
            cmd = [str(a / "lib" / "runtime" / "bin" / "java"), "--enable-native-access=ALL-UNNAMED",
                   "-cp", str(a / "lib" / "app") + "/*", "-Djava.awt.headless=true",
                   "org.audiveris.omr.Main", "-batch", "-transcribe", "-export",
                   "-constant", "org.audiveris.omr.text.Language.defaultSpecification=eng+hun+ron",
                   "-output", str(work), str(work / "page.png")]
        else:
            raise ValueError(engine)
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
        text = (p.stdout + "\n" + p.stderr).replace("\r", "\n")
        text = "\n".join(l for l in text.splitlines() if not re.match(r"^[\w.]+\.(h5|onnx): ", l) and "JAVA_TOOL" not in l)
        logf.write_text(text)
        if engine == "audiveris":
            found = list(work.glob("*.mxl"))
            if found:
                z = zipfile.ZipFile(found[0])
                name = [n for n in z.namelist() if n.endswith(".xml") and not n.startswith("META")][0]
                (out_dir / "audiveris.musicxml").write_bytes(z.read(name))
                res["musicxml"] = str(out_dir / "audiveris.musicxml")
                res["rec_grade"] = audiveris_grades(found[0].with_suffix(".omr"))
            else:
                res["error"] = "no .mxl exported; " + tail(text)
        else:
            found = list(work.glob("*.musicxml"))
            if found:
                shutil.copy(found[0], out_dir / f"{engine}.musicxml")
                res["musicxml"] = str(out_dir / f"{engine}.musicxml")
            else:
                res["error"] = f"exit {p.returncode}: " + tail(text)
    except subprocess.TimeoutExpired:
        res["error"] = "timeout"
    except Exception as e:  # noqa: BLE001
        res["error"] = f"{type(e).__name__}: {e}"
    res["seconds"] = round(time.time() - t0, 1)
    shutil.rmtree(work, ignore_errors=True)
    return res


def tail(text: str, n: int = 3) -> str:
    return " | ".join(text.strip().splitlines()[-n:])[:400]


def audiveris_grades(omr: Path) -> float | None:
    """Mean intrinsic grade of note-head and rest inters from the .omr book."""
    try:
        z = zipfile.ZipFile(omr)
        grades = []
        for name in z.namelist():
            if name.endswith(".xml") and "sheet#" in name:
                root = etree.fromstring(z.read(name))
                for el in root.iter():
                    tag = etree.QName(el).localname.lower()
                    g = el.get("grade")
                    if g and ("head" in tag or "rest" in tag):
                        grades.append(float(g))
        return round(sum(grades) / len(grades), 3) if grades else None
    except Exception:  # noqa: BLE001
        return None


def musicxml_to_mei(musicxml: Path) -> str:
    import verovio
    tk = verovio.toolkit()
    tk.setOptions({"inputFrom": "musicxml"})
    if not tk.loadFile(str(musicxml)):
        raise RuntimeError("verovio could not load " + str(musicxml))
    return tk.getMEI({"basic": False, "removeIds": False})


def E(tag, text=None, **attrs):
    el = etree.Element(f"{{{MEI_NS}}}{tag}")
    for k, v in attrs.items():
        if v is not None:
            el.set(k.replace("__", ":") if ":" in k else k, str(v))
    if text is not None:
        el.text = str(text)
    return el


def build_head(records: list[dict], image_url: str | None, engine: str, engine_version: str,
               ocr_lines: list[dict], conf: float | None) -> etree._Element:
    rec = records[0] if records else {}
    src = rec.get("source") or {}
    head = E("meiHead")
    fd = etree.SubElement(head, f"{{{MEI_NS}}}fileDesc")
    ts = etree.SubElement(fd, f"{{{MEI_NS}}}titleStmt")
    title = rec.get("title") or (Path(image_url).stem if image_url else "untitled")
    if len(records) > 1:
        title = "; ".join(r.get("title") or r["id"] for r in records)
    ts.append(E("title", title))
    rs = etree.SubElement(ts, f"{{{MEI_NS}}}respStmt")
    if rec.get("collector"):
        rs.append(E("persName", rec["collector"], role="collector"))
    perf = (rec.get("performer") or {}).get("name")
    if perf:
        rs.append(E("persName", perf, role="performer"))
    rs.append(E("name", f"omr/pipeline.py ({engine} {engine_version} + verovio)", role="encoder"))
    ps = etree.SubElement(fd, f"{{{MEI_NS}}}pubStmt")
    ps.append(E("publisher", "Bartok Romania field-collection viewer (research prototype)"))
    ps.append(E("date", isodate=dt.date.today().isoformat()))
    av = etree.SubElement(ps, f"{{{MEI_NS}}}availability")
    av.append(E("useRestrict", "Recognised automatically by optical music recognition; unverified. "
                     "The source image is served by HUN-REN BTK ZTI (systems.zti.hu) or by the "
                     "Internet Archive scan of Bartok, Rumanian Folk Music; this encoding indexes "
                     "the notation and does not replace the source."))
    sd = etree.SubElement(fd, f"{{{MEI_NS}}}sourceDesc")
    for r in records or [{}]:
        s = etree.SubElement(sd, f"{{{MEI_NS}}}source")
        b = etree.SubElement(s, f"{{{MEI_NS}}}bibl")
        rsrc = r.get("source") or {}
        if rsrc.get("siteName"):
            b.append(E("title", rsrc["siteName"]))
        if r.get("id"):
            b.append(E("identifier", r["id"], type="viewer-record-id"))
        if rsrc.get("siteId"):
            b.append(E("identifier", rsrc["siteId"], type="site-record-id"))
        if rsrc.get("url"):
            b.append(E("ptr", target=rsrc["url"]))
        if image_url:
            b.append(E("ptr", target=image_url))
        loc = r.get("location") or {}
        if loc.get("raw"):
            b.append(E("geogName", loc["raw"]))
        col = r.get("collected") or {}
        if col.get("raw") or col.get("year"):
            b.append(E("date", col.get("raw") or str(col.get("year"))))
    ed = etree.SubElement(head, f"{{{MEI_NS}}}encodingDesc")
    ai = etree.SubElement(ed, f"{{{MEI_NS}}}appInfo")
    app = E("application", version=engine_version)
    app.set(XML_ID, f"app.{engine}")
    app.append(E("name", engine))
    ai.append(app)
    import verovio
    app2 = E("application", version=verovio.toolkit().getVersion())
    app2.set(XML_ID, "app.verovio")
    app2.append(E("name", "verovio"))
    ai.append(app2)
    app3 = E("application", version="1.4.4")
    app3.set(XML_ID, "app.rapidocr")
    app3.append(E("name", "rapidocr-onnxruntime"))
    ai.append(app3)
    # schema order inside encodingDesc: appInfo, editorialDecl, projectDesc
    if ocr_lines:
        edl = etree.SubElement(ed, f"{{{MEI_NS}}}editorialDecl")
        edl.append(E("p", "Text lines read from the image by OCR (uncorrected): " +
                          " / ".join(l["text"] for l in ocr_lines)))
    pd = etree.SubElement(ed, f"{{{MEI_NS}}}projectDesc")
    pd.append(E("p", f"OMR pipeline of the Bartok Romania viewer. Confidence score "
                     f"{conf if conf is not None else 'n/a'} in [0,1] (see omr/confidence.py); "
                     f"components are stored in result.json next to this file."))
    if records:
        wl = etree.SubElement(head, f"{{{MEI_NS}}}workList")
        for r in records:
            w = etree.SubElement(wl, f"{{{MEI_NS}}}work")
            w.append(E("title", r.get("title") or r["id"]))
            if r.get("incipit"):
                inc = etree.SubElement(w, f"{{{MEI_NS}}}incip")
                it = etree.SubElement(inc, f"{{{MEI_NS}}}incipText")
                it.append(E("p", r["incipit"]))
            music = r.get("music") or {}
            terms = [("bartok-system", music.get("systemPosition")), ("cadences", music.get("cadences")),
                     ("syllables", music.get("syllables")), ("rhythm", music.get("rhythm")),
                     ("form", music.get("form")), ("genre", r.get("genre")), ("style", r.get("style")),
                     ("performance", r.get("performance"))]
            terms = [(k, v) for k, v in terms if v]
            if terms:
                cl = etree.SubElement(w, f"{{{MEI_NS}}}classification")
                tl = etree.SubElement(cl, f"{{{MEI_NS}}}termList")
                for k, v in terms:
                    tl.append(E("term", v, type=k))
    return head


def lyric_tokens(ocr_lines: list[dict]) -> list[str]:
    """Syllable tokens from OCR lines that look like hyphenated sung text."""
    toks = []
    for l in ocr_lines:
        t = l["text"]
        if t.count("-") < 1 and not re.match(r"^\d\.", t):
            continue
        if re.search(r"\d{3,}", t):
            continue
        t = re.sub(r"^\d+\.\s*", "", t)
        for w in re.split(r"\s+", t):
            for syl in w.split("-"):
                syl = syl.strip(" ,.;:!?()[]\"'")
                if syl:
                    toks.append(syl)
    return toks


def inject_lyrics(root: etree._Element, m: dict, toks: list[str]) -> bool:
    """Attach OCR syllables as <verse n='1'> when their count equals the sung units
    of the first strophe (or all units). Returns True when injected."""
    units = m["units"]
    if not toks or not units:
        return False
    # accept when the OCR syllable count is within 10% of the sung-note count; the
    # alignment is then sequential and approximate ("recognised, unverified")
    if abs(len(toks) - len(units)) > 0.1 * max(len(toks), len(units)):
        return False
    by_id = {}
    for n in root.findall(".//mei:note", NS):
        by_id[n.get(XML_ID)] = n
    for i, tok in enumerate(toks[:len(units)]):
        ev = m["events"][units[i]]
        note = by_id.get(ev["id"])
        if note is None:
            return False
        verse = etree.SubElement(note, f"{{{MEI_NS}}}verse", n="1")
        verse.append(E("syl", tok, con="d" if i + 1 < len(toks) else None))
    return True


def finalise_mei(mei_xml: str, records, image_url, engine, engine_version, ocr_lines, out: Path,
                 conf: float | None = None) -> etree._Element:
    root = etree.fromstring(mei_xml.encode("utf-8"), etree.XMLParser(remove_blank_text=True))
    root.set("meiversion", "5.1")
    old = root.find("mei:meiHead", NS)
    head = build_head(records, image_url, engine, engine_version, ocr_lines, conf)
    if old is not None:
        root.replace(old, head)
    else:
        root.insert(0, head)
    # verovio keeps unsupported MusicXML leftovers as <expansion>; drop them for mei-all cleanliness
    for ex in root.findall(".//mei:expansion", NS):
        ex.getparent().remove(ex)
    write_mei(root, out)
    return root


def write_mei(root: etree._Element, out: Path) -> None:
    xml = etree.tostring(root, pretty_print=True, encoding="unicode")
    pi = (f'<?xml version="1.0" encoding="UTF-8"?>\n<?xml-model href="{SCHEMA_URL}" '
          f'type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>\n')
    out.write_text(pi + xml, encoding="utf-8")


def render(mei: Path, svg: Path, midi: Path) -> dict:
    import verovio
    tk = verovio.toolkit()
    tk.setOptions({"inputFrom": "mei", "adjustPageHeight": True, "breaks": "auto", "pageWidth": 2100,
                   "scale": 40, "header": "none", "footer": "none", "svgViewBox": True})
    if not tk.loadFile(str(mei)):
        return {"svg": None, "midi": None, "error": "verovio could not load MEI"}
    svg.write_text(tk.renderToSVG(1))
    midi.write_bytes(base64.b64decode(tk.renderToMIDI()))
    return {"svg": svg.name, "midi": midi.name, "pages": tk.getPageCount()}


def validate(mei: Path) -> dict:
    if not SCHEMA.exists():
        return {"valid": None, "note": "schema not cached; run: curl -o omr/cache/5.1-mei-all.rng " + SCHEMA_URL}
    p = subprocess.run(["xmllint", "--noout", "--relaxng", str(SCHEMA), str(mei)], capture_output=True, text=True)
    errs = [l for l in p.stderr.splitlines() if "validity error" in l]
    return {"valid": p.returncode == 0, "schema": "mei-all 5.1 (RelaxNG, xmllint)", "errors": errs[:8],
            "error_count": len(errs)}


def engine_version(engine: str) -> str:
    try:
        if engine == "audiveris":
            return "5.9.0"
        venv = ENGINES[engine].parent.parent
        p = subprocess.run([str(venv / "bin" / "pip"), "show", engine], capture_output=True, text=True)
        m = re.search(r"Version: (\S+)", p.stdout)
        return m.group(1) if m else "?"
    except Exception:  # noqa: BLE001
        return "?"


def load_records(ids: list[str]) -> list[dict]:
    if not ids:
        return []
    songs = json.load(open(ROOT / "data" / "songs.json"))
    by = {s["id"]: s for s in songs}
    return [by[i] for i in ids if i in by]


def process(sample_id: str, image: str, engines: list[str], suffix: str | None = None,
            record_ids: list[str] | None = None, kind: str | None = None, note: str | None = None,
            skip_ocr: bool = False) -> dict:
    out_dir = SAMPLES / (f"{sample_id}__{suffix}" if suffix else sample_id)
    out_dir.mkdir(parents=True, exist_ok=True)
    records = load_records(record_ids or [sample_id])
    image_url = image if image.startswith("http") else None
    src = fetch(image) if image_url else Path(image)
    png, x2 = prepare_image(src, out_dir)
    result = {"id": sample_id, "suffix": suffix, "kind": kind, "note": note, "image": image,
              "records": [r["id"] for r in records], "generated": dt.datetime.now().isoformat(timespec="seconds"),
              "ocr": None, "engines": {}}
    ocr_lines = []
    if not skip_ocr:
        log(f"[{out_dir.name}] OCR")
        ocr_lines = run_ocr(png, out_dir / "ocr.json")
        result["ocr"] = {"lines": len(ocr_lines), "file": "ocr.json"}
    for eng in engines:
        log(f"[{out_dir.name}] engine {eng}")
        r = run_engine(eng, png, x2, out_dir)
        r["version"] = engine_version(eng)
        if r["musicxml"]:
            try:
                mei_path = out_dir / f"{eng}.mei"
                mei_xml = musicxml_to_mei(Path(r["musicxml"]))
                root = finalise_mei(mei_xml, records, image_url, eng, r["version"], ocr_lines, mei_path)
                m = confidence.parse_mei(mei_path)
                toks = lyric_tokens(ocr_lines)
                r["engine_lyrics"] = len(m["lyric_syllables"])
                r["lyrics_injected"] = False
                if not m["lyric_syllables"] and inject_lyrics(root, m, toks):
                    r["lyrics_injected"] = True
                    write_mei(root, mei_path)
                conf = confidence.score(mei_path, records, [l["text"] for l in ocr_lines], None,
                                        r.get("rec_grade"))
                # write the score into the header (rebuilds the head, keeps the music)
                finalise_mei(etree.tostring(root, encoding="unicode"), records, image_url, eng, r["version"],
                             ocr_lines, mei_path, conf["confidence"])
                r["mei"] = mei_path.name
                r["render"] = render(mei_path, out_dir / f"{eng}.svg", out_dir / f"{eng}.mid")
                r["validation"] = validate(mei_path)
                r["confidence"] = conf
            except Exception as e:  # noqa: BLE001
                r["error"] = (r.get("error") or "") + f" post-processing failed: {type(e).__name__}: {e}"
        result["engines"][eng] = r
    best = max((e for e in result["engines"].values() if e.get("confidence")),
               key=lambda e: e["confidence"]["confidence"], default=None)
    result["best"] = {"engine": best["engine"], "confidence": best["confidence"]["confidence"]} if best else None
    (out_dir / "result.json").write_text(json.dumps(result, ensure_ascii=False, indent=1))
    log(f"[{out_dir.name}] done: " + ", ".join(
        f"{k}={v['confidence']['confidence'] if v.get('confidence') else 'ERR'} ({v['seconds']}s)"
        for k, v in result["engines"].items()))
    return result


def rescore(out_dir: Path) -> dict:
    """Recompute confidence (and the score line in each MEI header) from the files already in
    a sample directory, without re-running the engines."""
    result = json.load(open(out_dir / "result.json"))
    records = load_records(result.get("records") or [])
    ocr_lines = json.load(open(out_dir / "ocr.json"))["lines"] if (out_dir / "ocr.json").exists() else []
    image_url = result["image"] if str(result["image"]).startswith("http") else None
    for eng, r in result["engines"].items():
        mei_path = out_dir / f"{eng}.mei"
        if not r.get("mei") or not mei_path.exists():
            continue
        conf = confidence.score(mei_path, records, [l["text"] for l in ocr_lines], None, r.get("rec_grade"))
        r["confidence"] = conf
        root = etree.parse(str(mei_path)).getroot()
        finalise_mei(etree.tostring(root, encoding="unicode"), records, image_url, eng, r.get("version", "?"),
                     ocr_lines, mei_path, conf["confidence"])
        r["validation"] = validate(mei_path)
    best = max((e for e in result["engines"].values() if e.get("confidence")),
               key=lambda e: e["confidence"]["confidence"], default=None)
    result["best"] = {"engine": best["engine"], "confidence": best["confidence"]["confidence"]} if best else None
    result["rescored"] = dt.datetime.now().isoformat(timespec="seconds")
    (out_dir / "result.json").write_text(json.dumps(result, ensure_ascii=False, indent=1))
    log(f"[{out_dir.name}] rescored: " + ", ".join(
        f"{k}={v['confidence']['confidence']}" for k, v in result["engines"].items() if v.get("confidence")))
    return result


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--rescore", metavar="DIR", help="recompute confidence for an existing sample dir and exit")
    ap.add_argument("--id", help="sample id (catalogue record id unless --record given)")
    ap.add_argument("--image", help="image URL (systems.zti.hu) or local path")
    ap.add_argument("--engines", default="homr,audiveris", help="comma list of homr,audiveris,oemer")
    ap.add_argument("--suffix", help="sample dir suffix, e.g. hw / pr / mh")
    ap.add_argument("--record", action="append", help="catalogue record id(s) to compare against")
    ap.add_argument("--kind", help="handwritten | typeset | printed-edition")
    ap.add_argument("--note", help="free-text description stored in result.json")
    ap.add_argument("--no-ocr", action="store_true")
    a = ap.parse_args()
    if a.rescore:
        rescore(Path(a.rescore))
        return
    if not a.id or not a.image:
        ap.error("--id and --image are required (or --rescore DIR)")
    process(a.id, a.image, a.engines.split(","), a.suffix, a.record, a.kind, a.note, a.no_ocr)


if __name__ == "__main__":
    main()
