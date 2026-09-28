import json, re, unicodedata

ACCESSED = "2026-09-28"

SOURCES = {
    "MEK": {
        "key": "MEK",
        "title": "Bartok Bela eletenek kronikaja (day-by-day chronology; first edition: Apam eletenek kronikaja, Zenemukiado, Budapest 1981)",
        "author": "ifj. Bartok Bela; ed. Vasarhelyi Gabor",
        "year": 2021,
        "publisher": "Magyarsagkutato Intezet, Budapest; digital copy Magyar Elektronikus Konyvtar (MEK) 22043",
        "url": "https://mek.oszk.hu/22000/22043/22043.pdf",
        "accessed": ACCESSED,
        "cached": "geo/cache/research/mek-22043-bartok-kronika.pdf (text: mek-22043-bartok-kronika.txt)",
    },
    "KELEMEN": {
        "key": "KELEMEN",
        "title": "Bartok roman nepzenegyujto utjai [Bartok's Romanian folk-music collecting trips], with a locality list by county (pp. 406-411)",
        "author": "Kelemen Imre",
        "year": 1978,
        "publisher": "Az Egri Ho Si Minh Tanarkepzo Foiskola tudomanyos kozlemenyei, Uj sorozat 14 (Acta Academiae Paedagogicae Agriensis, Nova series 14), pp. 399-415, ISSN 0138-9734",
        "url": "http://publikacio.uni-eszterhazy.hu/689/1/399-415_Kelemen.pdf",
        "accessed": ACCESSED,
        "cached": "geo/cache/research/kelemen-399-415.pdf (text: kelemen-399-415.txt)",
    },
    "RFM5": {
        "key": "RFM5",
        "title": "Rumanian Folk Music, vol. V: Maramures County (author's Preface; Editor's Preface by Benjamin Suchoff)",
        "author": "Bela Bartok; ed. Benjamin Suchoff",
        "year": 1975,
        "publisher": "Martinus Nijhoff, The Hague",
        "url": "https://archive.org/details/rumanianfolkmusi0005blab",
        "accessed": ACCESSED,
        "cached": "print/raw/rumanianfolkmusi0005blab_djvu.txt",
    },
    "RFM4": {
        "key": "RFM4",
        "title": "Rumanian Folk Music, vol. IV: Carols and Christmas Songs (Colinde) (source data printed under each music example: place, county, performer, month and year)",
        "author": "Bela Bartok; ed. Benjamin Suchoff",
        "year": 1975,
        "publisher": "Martinus Nijhoff, The Hague",
        "url": "https://archive.org/details/rumanianfolkmusi0004blab",
        "accessed": ACCESSED,
        "cached": "print/raw/rumanianfolkmusi0004blab_djvu.txt",
    },
    "IRASAI-HUNYAD": {
        "key": "IRASAI-HUNYAD",
        "title": "'A hunyadi roman nep zenedialektusa', Ethnographia XXV/2 (March 1914), 108-115; entry with full text on the Bela Bartok Writings database",
        "author": "Bela Bartok",
        "year": 1914,
        "publisher": "HUN-REN BTK Institute for Musicology, Bela Bartok Writings (bartok-irasai.zti.hu)",
        "url": "https://bartok-irasai.zti.hu/en/irasok/a-hunyadi-roman-nep-zenedialektusa-2/",
        "accessed": ACCESSED,
        "cached": "geo/cache/irasai/irasok-p*.json (post id 686)",
    },
    "CORR": {
        "key": "CORR",
        "title": "Bartok Correspondence database (Bartok Archives, Institute of Musicology): author/recipient/date of letters; no text, no place of writing",
        "author": "Bartok Archives, HUN-REN BTK Institute for Musicology",
        "year": None,
        "publisher": "db.zti.hu",
        "url": "https://db.zti.hu/bartok_correspondence/bmails_Search.asp",
        "accessed": ACCESSED,
        "cached": "geo/cache/research/corr-hits-1913.html",
    },
    "GYUJ": {
        "key": "GYUJ",
        "title": "Trip index of 'Bela Bartok, the Ethnomusicologist' (label verbatim)",
        "author": "HUN-REN BTK Institute for Musicology",
        "year": None,
        "publisher": "bartok-gyujtesek.zti.hu",
        "url": "https://bartok-gyujtesek.zti.hu/en/browse",
        "accessed": ACCESSED,
        "cached": "data/collections-gyuj.json",
    },
}


def src(key, locator, note=None):
    s = SOURCES[key]
    d = {"key": key, "title": s["title"], "author": s["author"], "year": s["year"], "locator": locator, "url": s["url"], "accessed": s["accessed"]}
    if note:
        d["note"] = note
    return d


def mek(page, quote=None):
    return src("MEK", f"p. {page}", quote)


def kel(page, quote=None):
    return src("KELEMEN", f"p. {page}", quote)


def fold(s):
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def slug(s):
    return fold(s).replace(" ", "-")


def load_gazetteer(path="/home/user/Barton/data/gazetteer.json"):
    g = json.load(open(path))
    cty = {c["name"]: c for c in g["counties"]}
    idx = {}
    for p in g["places"]:
        region = p.get("region") or (cty.get(p.get("county")) or {}).get("region") or "transylvania"
        pid = f"{(p.get('country') or 'xx').lower()}/{slug(region)}/{slug(p.get('county') or 'unresolved')}/{slug(p['name'])}"
        p = dict(p, id=pid)
        for n in [p["name"], p.get("nameHistorical")] + (p.get("aliases") or []):
            if n:
                idx.setdefault(fold(n), [])
                if not any(x["id"] == pid for x in idx[fold(n)]):
                    idx[fold(n)].append(p)
    return idx


def stop(hu, ro=None, county=None, arrival=None, departure=None, note=None, country="RO", confidence=None):
    """hu: name as printed in the source (usually the Hungarian form of the period); ro: modern name."""
    d = {"placeName": hu, "modernName": ro, "county": county, "country": country, "arrival": arrival, "departure": departure, "note": note}
    if confidence:
        d["confidence"] = confidence
    return d
