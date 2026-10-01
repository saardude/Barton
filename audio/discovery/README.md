# Cylinder legibility: discovery run (1 October 2026)

Test of reference-free audio-quality systems on 20 wax-cylinder recordings, to choose a
0 (almost illegible) to 1 (perfectly legible) score for a "wax cylinder only" filter.
Nothing here is wired into the app or the data build yet; the full run over all cylinder
tracks has not been done.

- `sample.json`: the 20 records (stratified by collector and decade; MH/KF cylinder series only).
- `score.py`: DNSMOS P.835 (speechmos), NISQA (torchmetrics, CC BY-NC-SA weights),
  TorchAudio SQUIM (STOI), Whisper small (faster-whisper) and a librosa signal score.
- `validate.py`: wear test, one recording degraded in five steps (noise, low-pass, crackle).
- `scores.json`, `validate.json`: raw outputs. `report-data.json`: the table behind the report,
  including the proposed blend `legib = 0.7 × librosa + 0.3 × lin(DNSMOS OVRL, 1.0, 2.4)`.

Findings: NISQA floors at 0 on every cylinder; SQUIM barely moves (0.40 to 0.70, 0.59 to 0.45
under wear); Whisper drops to 0 by the second wear step and was dropped for speed; ViSQOL is
full-reference (no clean copy of a cylinder exists) and the genderrecognition.com checker is a
closed paid API, so neither was run. The blend spreads 0.27 to 0.82 on the sample and falls at
every wear step (0.82 to 0.11).

Run (Python 3.11): `pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu`,
then `pip install onnxruntime librosa soundfile scipy speechmos torchmetrics faster-whisper`;
convert each MP3 to 16 kHz mono WAV named by cylinder, then
`python score.py sample.json wav scores.json --only dnsmos,librosa`.
