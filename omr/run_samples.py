"""Run the OMR pipeline over the sample set described in docs/MEI-OMR-RESEARCH.md.

  omr/.venv/bin/python omr/run_samples.py [--only bsys-12-10__pr,...] [--engines homr,audiveris]

Printed-edition pages are rendered from the Internet Archive PDFs cached under print/raw/
(see docs/PRINT-SOURCES.md); the Bartok System images are fetched from systems.zti.hu at
1 request/s into omr/cache/img/.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pipeline  # noqa: E402

ROOT = pipeline.ROOT
RFM_PDF = ROOT / "print" / "raw"

SAMPLES = [
    # id, suffix, kind, image, records, engines, note
    ("bsys-12-10", "pr", "typeset",
     "https://systems.zti.hu/media/images/publications/BR_00010_pr.gif", None,
     ["homr", "audiveris", "oemer"],
     "Printed critical edition page (Bartok, Magyar nepdalok, Egyetemes gyujtemeny I no. 9): four "
     "systems, two notated strophes, lyrics under the notes, cadences III III VI boxed in the header."),
    ("bsys-13-105", "pr", "typeset",
     "https://systems.zti.hu/media/images/publications/BR_00114_pr.gif", None,
     ["homr", "audiveris", "oemer"],
     "Printed critical edition page (no. 114): typeset melody with lyrics and header."),
    ("bsys-12-10", "hw", "handwritten",
     "https://systems.zti.hu/media/images/BR/BR_00010_01.jpg", None,
     ["homr", "audiveris", "oemer"],
     "Bartok's master sheet (tamlap): pre-printed form header, one handwritten staff with the melody, "
     "variant fragments on a second staff, handwritten lyrics, coloured annotations."),
    ("bsys-13-105", "hw", "handwritten",
     "https://systems.zti.hu/media/images/BR/BR_00114_01.jpg", None,
     ["homr", "audiveris"],
     "Bartok's master sheet for no. 114 (handwritten notation and lyrics on a form)."),
    ("bsys-12-10", "mh", "handwritten",
     "https://systems.zti.hu/media/images/MH/MH_0470c2d2.jpg", None,
     ["homr", "audiveris"],
     "Phonograph transcription slip F. 470 c) in blue ink, entirely handwritten (staff lines included), "
     "pasted on a grey card together with a second slip."),
    ("rfm-4-p094", None, "printed-edition",
     ("4", 94), ["rfm-4-1a", "rfm-4-1b", "rfm-4-2", "rfm-4-3a"],
     ["homr", "audiveris"],
     "Rumanian Folk Music vol. IV p. 49 (Archive leaf n94): melodies 1a, 1b, 2, 3a of class A I / A II a); "
     "each with a bass-clef final-note prefix, circled cadence degrees, variant staves and data line."),
    ("rfm-4-p199", None, "printed-edition",
     ("4", 199), None,
     ["homr", "audiveris"],
     "Rumanian Folk Music vol. IV p. 154 (Archive leaf n199): colinde of class A, melody 100a and neighbours."),
    ("rfm-5-p082", None, "printed-edition",
     ("5", 82), ["rfm-5-1", "rfm-5-2", "rfm-5-3", "rfm-5-4", "rfm-5-5"],
     ["homr", "audiveris"],
     "Rumanian Folk Music vol. V p. 37 (Archive leaf n82): first Music Examples page, melodies 1-5 (Maramures)."),
]


def render_rfm(vol: str, leaf: int) -> Path:
    import pypdfium2 as pdfium
    out = pipeline.CACHE / "rfm" / f"vol{vol}_n{leaf}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        return out
    pdf = pdfium.PdfDocument(str(RFM_PDF / f"rumanianfolkmusi000{vol}blab.pdf"))
    page = pdf[leaf]
    page.render(scale=300 / 72).to_pil().convert("L").save(out)
    return out


def records_on_leaf(vol: str, leaf: int) -> list[str]:
    songs = json.load(open(ROOT / "data" / "songs.json"))
    ids = []
    for s in songs:
        if s["source"]["site"] != "rfm":
            continue
        for m in s["media"]["notation"]:
            if re.search(rf"rumanianfolkmusi000{vol}blab/page/n{leaf}$", m["url"]):
                ids.append(s["id"])
    return ids


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma list of sample dir names (id or id__suffix)")
    ap.add_argument("--engines", help="override engine list for every sample")
    ap.add_argument("--rescore", action="store_true", help="recompute confidence from existing outputs only")
    a = ap.parse_args()
    only = set(a.only.split(",")) if a.only else None
    t0 = time.time()
    for sid, suffix, kind, image, records, engines, note in SAMPLES:
        name = f"{sid}__{suffix}" if suffix else sid
        if only and name not in only:
            continue
        if a.rescore:
            pipeline.rescore(pipeline.SAMPLES / name)
            continue
        if isinstance(image, tuple):
            vol, leaf = image
            records = records or records_on_leaf(vol, leaf)
            image = str(render_rfm(vol, leaf))
        if a.engines:
            engines = a.engines.split(",")
        pipeline.process(sid, image, engines, suffix, records, kind, note)
    pipeline.log(f"all done in {round((time.time() - t0) / 60, 1)} min")


if __name__ == "__main__":
    main()
