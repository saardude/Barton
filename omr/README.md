# omr/ - optical music recognition to MEI (research experiment)

Findings, sample table and recommendation: `docs/MEI-OMR-RESEARCH.md`. This folder holds the
code and the sample outputs. Nothing here is wired into the app or the data build.

## Layout

```
pipeline.py        image -> OMR engine -> MusicXML -> MEI (verovio) -> SVG/MIDI, OCR header and
                   lyrics merged into meiHead / verse, xmllint validation, confidence -> result.json
confidence.py      confidence score in [0,1]: recogniser grade, structural sanity, catalogue agreement
run_samples.py     the sample set used in the report (Bartok System images + RFM printed pages)
requirements.txt   pinned packages for the three virtualenvs (comments say which goes where)
samples/<id>[__suffix]/   inputs and every intermediate for each sample (committed)
cache/             downloads, model weights, Audiveris, schemas (git-ignored)
```

## Set-up (Linux x86_64, Python 3.11, Node not needed; CPU only; ~10 minutes)

```sh
cd omr
# 1. pipeline environment (verovio, lxml, RapidOCR, pypdfium2, cairosvg for previews)
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt cairosvg

# 2. homr (primary engine; vision transformer, ONNX). Separate venv: it pins opencv<5.
python3 -m venv .venv-homr && .venv-homr/bin/pip install homr==0.7.0
.venv-homr/bin/homr --init          # downloads the models once

# 3. oemer (optional second engine). Needs onnxruntime 1.16.x and numpy<2.
python3 -m venv .venv-oemer && .venv-oemer/bin/pip install oemer==0.1.8 \
    'onnxruntime==1.16.3' 'numpy<2' 'opencv-python-headless<4.11'
.venv-oemer/bin/pip uninstall -y onnxruntime-gpu
.venv-oemer/bin/pip install --force-reinstall --no-deps onnxruntime==1.16.3

# 4. Audiveris 5.9.0 (Java engine with Tesseract text OCR; the .deb bundles a JRE, no root needed)
mkdir -p cache/audiveris && cd cache
curl -L -o Audiveris-5.9.0-ubuntu24.04-x86_64.deb \
  https://github.com/Audiveris/audiveris/releases/download/5.9.0/Audiveris-5.9.0-ubuntu24.04-x86_64.deb
dpkg-deb -x Audiveris-5.9.0-ubuntu24.04-x86_64.deb audiveris
# Tesseract needs the *legacy* traineddata (tessdata, not tessdata_fast)
mkdir -p ~/.config/AudiverisLtd/audiveris/tessdata
for l in eng hun ron; do curl -L -o ~/.config/AudiverisLtd/audiveris/tessdata/$l.traineddata \
  https://raw.githubusercontent.com/tesseract-ocr/tessdata/main/$l.traineddata; done

# 5. MEI schema for validation (xmllint --relaxng)
curl -L -o 5.1-mei-all.rng https://music-encoding.org/schema/5.1/mei-all.rng
cd ..
```

Versions used in the report: homr 0.7.0, oemer 0.1.8, Audiveris 5.9.0 (bundled OpenJDK 25.0.1,
Tesseract 5.5.1), verovio 6.3.0, rapidocr-onnxruntime 1.4.4, onnxruntime 1.30.0 / 1.16.3,
MEI schema 5.1 (RelaxNG generated 2025-01-22), xmllint 2.9.

## Running

One image, any engines:

```sh
.venv/bin/python pipeline.py --id bsys-12-10 --suffix pr --kind typeset \
  --image https://systems.zti.hu/media/images/publications/BR_00010_pr.gif \
  --engines homr,audiveris,oemer
```

`--id` is the catalogue record id (looked up in `data/songs.json` for title, incipit,
cadences, syllables, source URL); use `--record` one or more times when the page carries
several records (printed edition pages). Remote images are fetched at 1 request/s into
`cache/img/`. Outputs land in `samples/<id>__<suffix>/`:

| file | what |
| --- | --- |
| `input.*`, `input.png`, `input_x2.png` | original, greyscale PNG, 2x upscale (Audiveris needs >= 20 px staff interline) |
| `ocr.json` | RapidOCR lines with position and score |
| `<engine>.musicxml` | raw engine output (Audiveris .mxl unzipped) |
| `<engine>.mei` | MEI 5.1 (mei-all) from verovio with our `meiHead`, OCR text, injected `verse` where the syllable count fits |
| `<engine>.svg`, `<engine>.mid` | verovio rendering and MIDI of the MEI |
| `<engine>.log` | engine log |
| `result.json` | timings, validation result, confidence score and its components per engine |

The sample set of the report: `.venv/bin/python run_samples.py` (22 min on 4 cores;
`--only bsys-12-10__pr --engines homr` for a quick check; `--rescore` recomputes the confidence
scores and the MEI header line from the existing outputs without re-running the engines, for
use after changing `confidence.py`). The results table of the report:
`.venv/bin/python report_table.py` (`--json` for the raw rows). Score an existing MEI on its own:
`.venv/bin/python confidence.py samples/bsys-12-10__pr/homr.mei --record bsys-12-10 --ocr samples/bsys-12-10__pr/ocr.json`.

Preview an SVG as PNG: `.venv/bin/python -c "import cairosvg; cairosvg.svg2png(url='samples/bsys-12-10__pr/homr.svg', write_to='/tmp/x.png', output_width=1400)"`.

## Notes and gotchas met while building this

- `oemer` installs `onnxruntime-gpu` and fails on CPU with onnxruntime >= 1.17
  (`ConvTranspose ... Attribute pads must not contain negative values`); pin 1.16.3 and numpy<2.
  Uninstalling `onnxruntime-gpu` deletes files shared with `onnxruntime`, hence the forced reinstall.
- Audiveris flags a sheet invalid when the staff interline is about 10 px ("try 300 DPI");
  the systems.zti.hu images are 750-1200 px wide, so the pipeline feeds it a 2x upscale.
- Audiveris' Tesseract wants the legacy engine components; `tessdata_fast` files give
  `Tesseract (legacy) engine requested, but components are not present`.
- verovio 6.3 writes `meiversion="6.0-dev"`; the pipeline rewrites it to `5.1` and validates
  against `mei-all` 5.1. Empty `respStmt` and MusicXML leftovers (`expansion`) from the
  engines are replaced or dropped. `mei-basic` is not targeted (it rejects `instrDef`,
  `expansion` and a few header parts).
- GitHub's API and HTML are blocked through the container proxy, but release asset downloads
  and `raw.githubusercontent.com` work.
