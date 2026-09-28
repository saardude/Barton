#!/usr/bin/env python3
"""print/reocr.py - re-OCR selected pages of the Rumanian Folk Music scans locally.

The Internet Archive's OCR drops whole text lines between staves on the notation
pages (see docs/PRINT-SOURCES.md). This script renders pages from the item PDF
(print/raw/<id>.pdf, downloaded by hand or via print/fetch.mjs --pdf) with
pypdfium2 and runs RapidOCR (ONNX runtime, CPU, English/Latin model) on them.
Output: print/raw/reocr/<id>/<page>.json, one per page, with the detected lines
in djvu.xml coordinates (the PDF page and the djvu page share the same crop, so
only a scale factor applies): {"page": k, "engine": ..., "lines": [{"x","y","w","h",
"text","score"}]}.

Usage (inside the venv: . print/.venv/bin/activate):
  python3 print/reocr.py <id> <page-index> [<page-index> ...]
  python3 print/reocr.py <id> 93-232         # inclusive range of 0-based page indexes
Options: --dpi 200 (default), --force, --djvu-size W H (default read from djvu.xml
is not needed: the scale is taken from the PDF page size at 360 dpi).
Dependencies are local to print/.venv (pypdfium2, rapidocr-onnxruntime, pillow).
"""

import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')


def parse_pages(args):
    pages = []
    for a in args:
        m = re.match(r'^(\d+)-(\d+)$', a)
        if m:
            pages.extend(range(int(m.group(1)), int(m.group(2)) + 1))
        elif a.isdigit():
            pages.append(int(a))
    return sorted(set(pages))


def main():
    argv = sys.argv[1:]
    dpi = 200
    force = False
    rest = []
    i = 0
    while i < len(argv):
        if argv[i] == '--dpi':
            dpi = int(argv[i + 1]); i += 2
        elif argv[i] == '--force':
            force = True; i += 1
        else:
            rest.append(argv[i]); i += 1
    if len(rest) < 2:
        print(__doc__); sys.exit(2)
    item = rest[0]
    pages = parse_pages(rest[1:])
    import pypdfium2 as pdfium
    from rapidocr_onnxruntime import RapidOCR

    pdf = pdfium.PdfDocument(os.path.join(RAW, f'{item}.pdf'))
    n = len(pdf)
    out_dir = os.path.join(RAW, 'reocr', item)
    os.makedirs(out_dir, exist_ok=True)
    ocr = RapidOCR()
    engine = 'rapidocr-onnxruntime (PP-OCRv4 det+rec, en/latin), page rendered from the item PDF with pypdfium2 at %d dpi' % dpi
    for k in pages:
        if k >= n:
            print(f'page {k} beyond PDF ({n} pages)'); continue
        dest = os.path.join(out_dir, f'{k}.json')
        if os.path.exists(dest) and not force:
            print(f'have {dest}'); continue
        t0 = time.time()
        page = pdf[k]
        w_pt, h_pt = page.get_size()
        # The djvu.xml coordinates are pixels at 360 dpi of the same page image.
        djvu_w = round(w_pt / 72 * 360)
        djvu_h = round(h_pt / 72 * 360)
        scale = dpi / 72
        img = page.render(scale=scale).to_pil().convert('RGB')
        import numpy as np
        result, _ = ocr(np.array(img))
        lines = []
        f = 360 / dpi
        for box, text, score in (result or []):
            xs = [p[0] for p in box]; ys = [p[1] for p in box]
            lines.append({
                'x': round(min(xs) * f), 'y': round(min(ys) * f),
                'w': round((max(xs) - min(xs)) * f), 'h': round((max(ys) - min(ys)) * f),
                'text': text, 'score': round(float(score), 3)
            })
        lines.sort(key=lambda l: (l['y'], l['x']))
        with open(dest, 'w', encoding='utf8') as fh:
            json.dump({'page': k, 'engine': engine, 'dpi': dpi, 'djvuWidth': djvu_w, 'djvuHeight': djvu_h, 'lines': lines}, fh, ensure_ascii=False, indent=1)
        print(f'page {k}: {len(lines)} lines in {time.time() - t0:.1f}s')


if __name__ == '__main__':
    main()
