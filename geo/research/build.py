import json, sys, re
sys.path.insert(0, "/tmp/claude-0/-home-user-Barton/ece056fb-e580-5d13-9138-c521b4d23aaf/scratchpad/cur")
from common import load_gazetteer, fold, SOURCES, ACCESSED
import entries_a, entries_b, entries_c

idx = load_gazetteer()
coll = {c["id"]: c for c in json.load(open("/home/user/Barton/data/collections-gyuj.json"))["collections"]}

# manual fallbacks: name as written -> modern name to look up in the gazetteer
ALT = {
    "Kerpenyed": "Carpinet", "Kerpenyes": "Carpinis", "Feketevolgy": "Neagra", "Alsovidra": "Vidra", "Fenes": "Fenes",
    "Ompolykovesd": "Petrosani", "Szombatsag": "Sambata", "Dragcseke": "Dragesti", "Tasadfo": "Tasad", "Holloszeg": "Corbesti",
    "Kabolapatak": "Iapa", "Mezozsadany": "Cornesti", "Feny": "Foeni", "Nagycsanad (Oscsanad)": "Cenad", "Kisbocsko": "Bocicoel",
    "Mikolapatak": "Valeni", "Lelesz": "Lelese", "Ohabasibisel": "Ohaba-Sibisel", "Paucsinesd": "Paucinesti", "Szocsed": "Socet",
    "Biharkaba": "Cabesti", "Solyom": "Soimi", "Belenyesorvenyes": "Urvis de Beius", "Pocsafalva": "Pocioveliste",
    "Tenkeszeplak": "Suplacu de Tinca", "Marosliget": "Dumbrava", "Idecspataka": "Idicel", "Kincses": "Chincis", "Kincsesfo": "Comori",
    "Nyaradto": "Ungheni", "Mezomajos": "Moisa", "Maroskisfalud": "Nazna", "Kortekapu": "Poarta", "Mezokok": "Cooc", "Alsodetrehem": "Tritenii de Jos",
    "Kendilona": "Luna de Jos", "Fuzesmikola": "Nicula", "Gilad": "Ghilad", "Tolvad": "Livezile", "Banlak": "Banloc", "Marospetres": "Petris",
    "Tok": "Toc", "Torjas": "Troas", "Mezokobolkut": "Fantanita", "Gyulatelke": "Coasta", "Pusztakamaras": "Camarasu", "Erdoszakal": "Sacalu de Padure",
    "Erdoszengyel": "Sangeru de Padure", "Remetemezo": "Pomi", "Maroshevz": "Toplita", "Biharfured": "Stana de Vale", "Ponor (u.p. Jozsikafalva)": "Ponor",
    "Telek": "Tileagd", "Lelesd": "Lelesti", "Kereszely": "Cresuia", "Biharkristyor": "Cristioru de Jos", "Belenyesszentmarton": "Sanmartin de Beius",
    "Korossebes": "Sebis", "Vaskohszeleste": "Salistea de Vascau", "Egres": "Igris", "Jadvolgy": "Bulz", "Hidasliget": "Pischia", "Temeskenez": "Satchinez",
    "Temesszecseny": "Seceani", "Vinga": "Vinga", "Denta": "Denta", "Varhely": "Sarmizegetusa", "Ciganyfalva (Pantasa)": "Pantasesti", "Borz": "Borz",
    "Csikmadaras": "Madaras", "Nagyszentmiklos": "Sannicolau Mare", "Nagyszollos": None,
}


def resolve(s):
    if s.get("country") not in (None, "RO"):
        return None, "outside gazetteer coverage (present-day Romania only)"
    cands = []
    for key in (s["placeName"], ALT.get(s["placeName"]), s.get("modernName")):
        if not key:
            continue
        key = re.sub(r"\s*\(.*?\)\s*", " ", key).strip()
        for part in [key] + key.split(" / "):
            hits = idx.get(fold(part), [])
            if hits:
                cands = hits
                break
        if cands:
            break
    if not cands:
        return None, "not in gazetteer"
    if s.get("county"):
        f = [h for h in cands if fold(h.get("county") or "") == fold(s["county"]) or fold(h.get("countyHistorical") or "") == fold(s["county"])]
        if f:
            cands = f
    if len(cands) > 1 and len({h["id"] for h in cands}) > 1:
        return None, "ambiguous: " + ", ".join(sorted({h["id"] for h in cands}))
    h = cands[0]
    return h["id"], None


entries = entries_a.ENTRIES + entries_b.ENTRIES + entries_c.ENTRIES
out = []
unres = []
for e in entries:
    e = dict(e)
    stops = []
    for i, s in enumerate(e["stops"], 1):
        s = dict(s)
        pid, why = resolve(s)
        s["seq"] = i
        s["placeId"] = pid
        if pid:
            h = [x for x in idx.get(fold(re.sub(r"\s*\(.*?\)\s*", " ", (ALT.get(s["placeName"]) or s["placeName"])).strip()), []) + idx.get(fold(re.sub(r"\s*\(.*?\)\s*", " ", s.get("modernName") or "").strip()), []) if x["id"] == pid]
            if h:
                s["lat"], s["lng"] = h[0]["lat"], h[0]["lng"]
                if not s.get("modernName"):
                    s["modernName"] = h[0]["name"]
        else:
            s["placeIdNote"] = why
            if s.get("country") in (None, "RO"):
                unres.append((e["id"], s["placeName"], s.get("modernName"), why))
        if not s.get("confidence"):
            s["confidence"] = "documented"
        stops.append(s)
    e["stops"] = stops
    mc = e.get("matchesCollection")
    if mc:
        c = coll.get(mc)
        if not c:
            print("WARN unknown collection", mc, e["id"])
        else:
            e["matchedLabel"] = c["label"]
    for a in e.get("alsoMatchesCollections", []):
        if a not in coll:
            print("WARN unknown alsoMatches", a, e["id"])
    e["alsoMatchedLabels"] = [coll[a]["label"] for a in e.get("alsoMatchesCollections", []) if a in coll]
    e.setdefault("romanianMaterial", None)
    out.append(e)

out.sort(key=lambda e: (e["dateStart"], e["id"]))
matched = {e["matchesCollection"] for e in out if e.get("matchesCollection")}
also = {a for e in out for a in e.get("alsoMatchesCollections", [])}
covered = matched | also
uncovered = sorted((c for c in coll if c not in covered), key=lambda c: coll[c]["date"]["start"])

meta = {
    "title": "Curated, cited itineraries of Bartok's collecting trips (documented layer over the bartok-gyujtesek.zti.hu trip index)",
    "spec": "docs/JOURNEY-SOURCES.md",
    "generatedAt": ACCESSED,
    "curatedBy": "research engineer, journey mapper, 2026-09-28",
    "howToMerge": "For each entry: if matchesCollection is set, merge over the journey gyuj-<id> (dates, departure, ordered stops, return, companions, summary, sources); the entries listed in alsoMatchesCollections are index entries subsumed by the same trip and should be shown as part of it (or linked to it), not as separate trips. Entries with matchesCollection null are new journeys with id cur-YYYY-MM-nn. A stop with confidence 'inferred' or a departure/return with evidence 'inferred' is a curator's inference from the cited text and must be labelled as such in the UI; 'documented' means the cited source states it. placeId is the gazetteer id (data/gazetteer.json, same scheme as parse-gyuj-collections.mjs); null placeId with placeIdNote means the locality is outside the gazetteer (non-Romanian) or not yet in it.",
    "fields": {
        "datePrecision": "day | phrase (a window such as 'end of March') | month",
        "evidenceQuality": "documented itinerary (day-level order of stops from a source) | dates only (dates/villages known, order not) | index only (no entry here; see docs/JOURNEY-SOURCES.md)",
        "stops[].placeName": "name as printed in the cited source (Hungarian official form of the period unless noted)",
        "stops[].modernName": "present-day name",
        "stops[].arrival/departure": "ISO date or month; equal to the trip range when the source gives only the month",
        "stops[].note": "what the source says about the stop; 'origin of songs' means the singers' home village, not necessarily a place visited",
        "sources[].locator": "page, footnote, music-example number, index entry or database query",
    },
    "sources": SOURCES,
    "counts": {
        "entries": len(out),
        "withMatch": len([e for e in out if e.get("matchesCollection")]),
        "newTrips": len([e for e in out if not e.get("matchesCollection")]),
        "indexEntriesCovered": len(covered),
        "indexEntriesNotCovered": len(uncovered),
        "stops": sum(len(e["stops"]) for e in out),
        "stopsWithPlaceId": sum(1 for e in out for s in e["stops"] if s.get("placeId")),
    },
    "indexEntriesNotCovered": [{"id": c, "label": coll[c]["label"]} for c in uncovered],
    "note": "Only what a cited source states is recorded; inferences are marked. Where sources disagree (index vs chronology vs RFM melody data) the entry keeps both and says so in the note or summary. Dates in Bartok's letters and in the chronology are Gregorian.",
}

json.dump({"_meta": meta, "journeys": out}, open("/home/user/Barton/data/journeys-curated.json", "w"), ensure_ascii=False, indent=2, sort_keys=True)
print("entries", len(out), "covered", len(covered), "uncovered", len(uncovered))
print("unresolved RO stops:")
for u in unres:
    print("  ", u)
print("uncovered:")
for c in uncovered:
    print("  ", c, coll[c]["label"])
