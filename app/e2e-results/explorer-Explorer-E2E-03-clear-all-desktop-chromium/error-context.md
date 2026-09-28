# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: explorer.spec.ts >> Explorer >> E2E-03 clear all
- Location: e2e/explorer.spec.ts:85:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/$/
Received string:  "http://localhost:4173/?sort=year&dir=desc"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    31 × locator resolved to <html lang="en">…</html>
       - unexpected value "http://localhost:4173/?sort=year&dir=desc"

```

```yaml
- link "Skip to results":
  - /url: "#results"
- banner:
  - link "Bartok / Romania":
    - /url: /?sort=year&dir=desc
  - navigation "Primary":
    - link "Explorer":
      - /url: /?sort=year&dir=desc
    - link "Journeys":
      - /url: /journeys?sort=year&dir=desc
    - link "About and sources":
      - /url: /about?sort=year&dir=desc
  - searchbox "Search melodies"
  - button "Colour by genre"
  - text: Theme
  - combobox "Theme":
    - option "Auto" [selected]
    - option "Light"
    - option "Dark"
- complementary "Filters":
  - heading "Filters" [level=2]
  - group:
    - text: Place Loc / Hely Country
    - combobox "Country":
      - option "Romania" [selected]
      - option "Croatia"
      - option "Hungary"
      - option "Serbia"
      - option "Slovakia"
      - option "Ukraine"
      - option "Unknown country"
      - option "All countries"
    - tree "Places":
      - treeitem "Romania 4,072" [expanded] [level=1] [selected]
      - treeitem "Banat 75" [level=2]
      - treeitem "Bukovina 351" [level=2]
      - treeitem "Crișana 602" [level=2]
      - treeitem "Maramureș 370" [level=2]
      - treeitem "Moldavia 311" [level=2]
      - treeitem "Transylvania 2,360" [level=2]
      - treeitem "(county unknown)not mapped 3" [level=2]
      - treeitem "Croatia 1" [level=1]
      - treeitem "Hungary 6,472" [level=1]
      - treeitem "Serbia 2" [level=1]
      - treeitem "Slovakia 1,210" [level=1]
      - treeitem "Ukraine 7" [level=1]
      - treeitem "Unknown countrynot mapped 2,646" [level=1]
  - group:
    - text: Genre Gen / Műfaj
    - group "Genre":
      - checkbox "bocet / lament 21"
      - text: bocet / lament 21
      - checkbox "colindă / winter carol 497"
      - text: colindă / winter carol 497
      - checkbox "doină / lyrical improvised song (hora lungă) 9"
      - text: doină / lyrical improvised song (hora lungă) 9
      - checkbox "joc / dance tune 113"
      - text: joc / dance tune 113
      - checkbox "cântec de nuntă / wedding song (0)" [disabled]
      - text: cântec de nuntă / wedding song (0)
      - checkbox "cântec (propriu-zis) / song proper 173"
      - text: cântec (propriu-zis) / song proper 173
      - checkbox "altele / other / unclassified 17"
      - text: altele / other / unclassified 17
  - group:
    - text: Style Stil / Stílus
    - group "Style":
      - button "instrumental 204"
      - button "mixed style 702"
      - button "new style 656"
      - button "not classified 113"
      - button "old style 1,480"
  - group:
    - text: Performance Interpretare / Előadásmód
    - group "Performance":
      - button "vocal 775"
      - button "instrumental 288"
      - button "vocal and instrumental (0)" [disabled]
      - button "unknown 3,009"
  - group:
    - text: Instrument Instrument / Hangszer
    - group "Instrument":
      - button "alphorn (bucium) 12"
      - button "bagpipe 2"
      - button "shepherd's flute (fluier) 6"
      - button "guitar 1"
      - button "violin 8"
  - group:
    - text: Year An / Év From
    - spinbutton "From": "1865"
    - text: To
    - spinbutton "To": "1943"
    - img "Melodies per 5 years, 1865 to 1944; most in 1910s"
    - text: From
    - slider "From": "1865"
    - text: To
    - slider "To": "1943"
  - button "Clear all filters" [disabled]
- main:
  - region "Map":
    - application "Map of melodies; use the list after the map for keyboard access":
      - 'button "Satu Mare (Szatmár): 82 melodies in 5 villages"'
      - 'button "Maramureș (Máramaros): 370 melodies in 14 villages"'
      - 'button "Suceava (Bukovina): 351 melodies in 5 villages"'
      - 'button "Bistrița-Năsăud (Szolnok-Doboka): 1 melodies in 1 villages"'
      - 'button "Iași (Moldva): 5 melodies in 1 villages"'
      - 'button "Sălaj (Szilágy): 53 melodies in 5 villages"'
      - 'button "Neamț (Moldva): 2 melodies in 1 villages"'
      - 'button "Bihor (Bihar): 436 melodies in 28 villages"'
      - 'button "Cluj (Kolozs): 284 melodies in 15 villages"'
      - 'button "Bacău (Moldva): 304 melodies in 14 villages"'
      - 'button "Mureș (Maros-Torda): 459 melodies in 38 villages"'
      - 'button "Csongrád-Csanád (Torontál): 4 melodies in 2 villages"'
      - 'button "Harghita (Udvarhely): 1,359 melodies in 79 villages"'
      - 'button "Arad: 31 melodies in 12 villages"'
      - 'button "Alba (Torda-Aranyos): 70 melodies in 9 villages"'
      - 'button "Covasna (Háromszék): 50 melodies in 9 villages"'
      - 'button "Timiș (Torontál): 70 melodies in 13 villages"'
      - 'button "Hunedoara (Hunyad): 105 melodies in 9 villages"'
      - 'button "Brașov (Brassó): 32 melodies in 4 villages"'
      - 'button "Caraș-Severin (Krassó-Szörény): 1 melodies in 1 villages"'
      - link "Leaflet":
        - /url: https://leafletjs.com
      - text: ©
      - link "OpenStreetMap":
        - /url: https://www.openstreetmap.org/copyright
      - text: contributors ©
      - link "CARTO":
        - /url: https://carto.com/attributions
    - button "Zoom in": +
    - button "Zoom out": −
    - button "Fit to Romania"
    - button "Colour by genre"
    - text: "Dot size: melodies 1 680 1,359"
    - link "3 not mapped":
      - /url: /?sort=year&dir=desc&unmapped=1
    - group: List counties (20)
  - region "Results":
    - text: 4,072 of 4,072 melodies Sort by
    - combobox "Sort by":
      - option "Title"
      - option "Style"
      - option "Location"
      - option "Year" [selected]
      - option "Source number"
    - button "Toggle sort direction" [pressed]: ↓
    - button "Export 4,072 melodies as JSON": Export JSON
    - list "Results":
      - listitem:
        - link "„Verbunk” – humming Remetea (Gyergyóremete) / Harghita, 1943":
          - /url: /song/bsys-82-13142?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/82/13142
          - text: F 53
      - listitem:
        - link "Ne menj rózsám a tarlóra Galbeni (Trunk) / Bacău, 1938":
          - /url: /song/bsys-10-12874?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/10/12874
          - text: C 1155a
        - text: has notation
      - listitem:
        - link "Körösfői Részek alatt AZ 1.LAP HIÁNYZIK, AHOL EZ A SZÖVEGKEZDET !!! Izvoru Crișului (Körösfő) / Cluj, 1938":
          - /url: /song/bsys-23-4069?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/23/4069
          - text: A 1307b
        - text: has notation
      - listitem:
        - link "Jöjjön haza, édesanyám, mert beteg az édesapám Kászonimpér / Harghita, 1938":
          - /url: /song/bsys-83-13665?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/83/13665
          - text: F 574
      - listitem:
        - link "Jaj Istenem, ezt a vént Kászonimpér / Harghita, 1938":
          - /url: /song/bsys-52-10520?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/52/10520
          - text: C 211
      - listitem:
        - link "Holtig bánom, amit cselekedtem Izvoru Crișului (Körösfő) / Cluj, 1938":
          - /url: /song/bsys-33-6578?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/33/6578
          - text: B 433e
        - text: has notation
      - listitem:
        - link "Hej, kisétálok kőkertembe Galbeni (Trunk) / Bacău, 1938":
          - /url: /song/bsys-63-11201?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/63/11201
          - text: C 477a
      - listitem:
        - link "Édesanyám volt az oka mindennek Izvoru Crișului (Körösfő) / Cluj, 1938":
          - /url: /song/bsys-25-4659?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/25/4659
          - text: A 1474a
        - text: has notation
      - listitem:
        - link "„Csürgöngölő” – humming Nearșova (Nyárszó) / Cluj, 1938":
          - /url: /song/bsys-82-13335?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/82/13335
          - text: F 245
      - listitem:
        - link "A temető kapu Izvoru Crișului (Körösfő) / Cluj, 1938":
          - /url: /song/bsys-39-10001?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/39/10001
          - text: C 36f
      - listitem:
        - link "Árva madár mit keseregsz az égen? Kászonimpér / Harghita, 1938":
          - /url: /song/bsys-25-4715?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/25/4715
          - text: A 1487
        - text: has notation
      - listitem:
        - link "Arra kérem az én jó Istenemet Izvoru Crișului (Körösfő) / Cluj, 1938":
          - /url: /song/bsys-25-4709?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/25/4709
          - text: A 1483i
        - text: has notation
      - listitem:
        - link "Szomoran szól a nagyharang Nearșova (Nyárszó) / Cluj, 1937":
          - /url: /song/bsys-53-10573?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/53/10573
          - text: C 227d
      - listitem:
        - link "Nem messze van ide a rózsám háza Nearșova (Nyárszó) / Cluj, 1937":
          - /url: /song/bsys-25-4800?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/25/4800
          - text: A 1489hhhh
        - text: has recording has notation
      - listitem:
        - link "Még azt mondják, hogy bort iszik a báró Nearșova (Nyárszó) / Cluj, 1937":
          - /url: /song/bsys-25-4925?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/25/4925
          - text: A 1539f
        - text: has recording has notation
      - listitem:
        - link "Kicsi tulok nagy a járom Nearșova (Nyárszó) / Cluj, 1937":
          - /url: /song/bsys-23-4217?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/23/4217
          - text: A 1355c
        - text: has recording has notation
      - listitem:
        - link "Jönnek, jönnek, visznek, visznek Nearșova (Nyárszó) / Cluj, 1937":
          - /url: /song/bsys-47-10419?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/47/10419
          - text: C 164e
      - listitem:
        - link "Jönnek, jönnek, visznek, visznek Nearșova (Nyárszó) / Cluj, 1937":
          - /url: /song/bsys-47-10420?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/47/10420
          - text: C 164f
      - listitem:
        - link "Hogy megtudtam kedves babám Nearșova (Nyárszó) / Cluj, 1937":
          - /url: /song/bsys-25-5163?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/25/5163
          - text: A 1588
        - text: has recording has notation
      - listitem:
        - link "A menyasszony irul-pirul Nearșova (Nyárszó) / Cluj, 1937":
          - /url: /song/bsys-83-13765?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/83/13765
          - text: F 674
      - listitem:
        - link "A falusi legények Nearșova (Nyárszó) / Cluj, 1937":
          - /url: /song/bsys-42-10166?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/42/10166
          - text: C 93a
      - listitem:
        - link "Vessél nekem ágyat falevélből Unirea (Felvinc) / Alba, 1935":
          - /url: /song/bsys-83-13676?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/83/13676
          - text: F 585
      - listitem:
        - link "Van nekem egy lovam a ménesbe Unirea (Felvinc) / Alba, 1935":
          - /url: /song/bsys-83-13668?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/83/13668
          - text: F 577
      - listitem:
        - link "Spiritusból csinálják a pálinkát Unirea (Felvinc) / Alba, 1935":
          - /url: /song/bsys-25-4923?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/25/4923
          - text: A 1539d
        - text: has notation
      - listitem:
        - link "Mos jövök Gyuláról Kecsetkisfalud / Harghita, 1935":
          - /url: /song/bsys-29-5292?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/29/5292
          - text: B 28b
        - text: has recording has notation
      - listitem:
        - link "Mikor mentem Gyergyó felé, Gyergyó felé Kecsetkisfalud / Harghita, 1935":
          - /url: /song/bsys-41-10130?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/41/10130
          - text: C 83b
      - listitem:
        - link "Meg akartam házasodni Kecsetkisfalud / Harghita, 1935":
          - /url: /song/bsys-39-10032?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/39/10032
          - text: C 44b
      - listitem:
        - link "Korond felett van egy homály Kecsetkisfalud / Harghita, 1935":
          - /url: /song/bsys-15-1507?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/15/1507
          - text: A 524l
        - text: has recording has notation
      - listitem:
        - link "Én Istenem, add megérnem Kecsetkisfalud / Harghita, 1935":
          - /url: /song/bsys-15-2156?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/15/2156
          - text: A 709
        - text: has recording has notation
      - listitem:
        - link "Édesanyám kertjében nyílik az ibolya Kecsetkisfalud / Harghita, 1935":
          - /url: /song/bsys-72-11880?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/72/11880
          - text: C 750a
      - listitem:
        - link "clarinet Kecsetkisfalud / Harghita, 1935":
          - /url: /song/bsys-82-13248?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/82/13248
          - text: F 158
      - listitem:
        - link "Bor, bor, bor, de jó ez a piros bor Unirea (Felvinc) / Alba, 1935":
          - /url: /song/bsys-10-12811?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/10/12811
          - text: C 1114o
        - text: has notation
      - listitem:
        - link "Akármerre járok Kecsetkisfalud / Harghita, 1935":
          - /url: /song/bsys-13-197?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/13/197
          - text: A 71b
        - text: has recording has notation
      - listitem:
        - link "Vótam én es, mikor vótam Luizi-Călugăra (Lujzikalagor) / Bacău, 1934":
          - /url: /song/bsys-10-12784?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/10/12784
          - text: C 1102c
        - text: has recording has notation
      - listitem:
        - link "Vékony deszka, kerítés, kerítés Țibeni (Istensegíts) / Suceava, 1934":
          - /url: /song/bsys-17-3048?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/17/3048
          - text: A 1004h
        - text: has recording has notation
      - listitem:
        - link "Vashelyen van egy ház Luizi-Călugăra (Lujzikalagor) / Bacău, 1934":
          - /url: /song/bsys-13-44?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/13/44
          - text: A 25b
        - text: has recording has notation
      - listitem:
        - link "Vásárokról vásárokra járok én Unirea (Felvinc) / Alba, 1934":
          - /url: /song/bsys-83-13578?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/83/13578
          - text: F 487
      - listitem:
        - link "Utca, utca, bánat utca Țibeni (Istensegíts) / Suceava, 1934":
          - /url: /song/bsys-15-1719?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/15/1719
          - text: A 573
        - text: has recording has notation
      - listitem:
        - link "Tizenhárom récetojás Luizi-Călugăra (Lujzikalagor) / Bacău, 1934":
          - /url: /song/bsys-10-12787?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/10/12787
          - text: C 1105
        - text: has recording has notation
      - listitem:
        - link "Tizenhárom meg egy fél, kérettelek nem jöttél Măneuți (Andrásfalva) / Suceava, 1934":
          - /url: /song/bsys-22-3866?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/22/3866
          - text: A 1220b
        - text: has recording has notation
      - listitem:
        - link "tilinka Luizi-Călugăra (Lujzikalagor) / Bacău, 1934":
          - /url: /song/bsys-82-13415?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/82/13415
          - text: F 324
      - listitem:
        - link "Templom kerítésben folyó patakocska Țibeni (Istensegíts) / Suceava, 1934":
          - /url: /song/bsys-19-3397?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/19/3397
          - text: A 1098u
        - text: has recording has notation
      - listitem:
        - link "„»Szüttő« vagy »Süttőből«” – flute Luizi-Călugăra (Lujzikalagor) / Bacău, 1934":
          - /url: /song/bsys-82-13414?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/82/13414
          - text: F 323
      - listitem:
        - link "Szól a kakas hajnaljára Luizi-Călugăra (Lujzikalagor) / Bacău, 1934":
          - /url: /song/bsys-10-12780?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/10/12780
          - text: C 1101a
        - text: has recording has notation
      - listitem:
        - link "Szeretsz-e, vagy szeresselek? Luizi-Călugăra (Lujzikalagor) / Bacău, 1934":
          - /url: /song/bsys-10-12782?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/10/12782
          - text: C 1102a
        - text: has recording has notation
      - listitem:
        - link "Szeretnék szántani Țibeni (Istensegíts) / Suceava, 1934":
          - /url: /song/bsys-13-573?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/13/573
          - text: A 206a
        - text: has recording has notation
      - listitem:
        - link "Szen e kerek erdőt járom én Valea Seacă (Bogdánfalva) / Bacău, 1934":
          - /url: /song/bsys-11-13036?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/11/13036
          - text: C [1262]
        - text: has recording has notation
      - listitem:
        - link "Szegény Szabó Erzsi Dornești (Hadikfalva) / Suceava, 1934":
          - /url: /song/bsys-13-525?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/13/525
          - text: A 198r
        - text: has recording has notation
      - listitem:
        - link "Rajtam a bú hármat hajlott Țibeni (Istensegíts) / Suceava, 1934":
          - /url: /song/bsys-10-12786?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/10/12786
          - text: C 1104a
        - text: has recording has notation
      - listitem:
        - link "Nem adom a jó bort Luizi-Călugăra (Lujzikalagor) / Bacău, 1934":
          - /url: /song/bsys-13-471?sort=year&dir=desc
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/13/471
          - text: A 193e
        - text: has recording has notation
    - navigation "Results pages":
      - button "Previous page" [disabled]: ←
      - text: Go to page
      - spinbutton "Go to page": "1"
      - text: Page 1 of 82
      - button "Next page": →
- status "Query status":
  - code: "?sort=year&dir=desc"
  - button "Copy link"
  - text: 4,072 of 4,072 melodies, 3 not mapped
  - button "Export 4,072 melodies as JSON": Export JSON
- contentinfo:
  - paragraph:
    - text: "Data: HUN-REN BTK Institute for Musicology, Budapest (Bartok Archives): \""
    - link "Folk Music in Bartók's Compositions":
      - /url: https://bartok-nepzene.zti.hu/en/
    - text: "\", \""
    - link "The Bartók System":
      - /url: https://systems.zti.hu/br/en
    - text: "\" and \""
    - link "Béla Bartók, the Ethnomusicologist":
      - /url: https://bartok-gyujtesek.zti.hu/en
    - text: "\"."
  - paragraph: Records, notation images and recordings remain the property of the Institute; this viewer is an independent interface and is not affiliated with it.
  - paragraph:
    - text: "Printed edition: Bela Bartok, Rumanian Folk Music (ed. Benjamin Suchoff, Martinus Nijhoff, 1967-1975),"
    - link "open volumes on the Internet Archive":
      - /url: https://archive.org/details/rumanianfolkmusi0004blab
    - text: ; only facts and incipits are indexed.
  - paragraph:
    - text: "Map: ©"
    - link "OpenStreetMap":
      - /url: https://www.openstreetmap.org/copyright
    - text: contributors, ©
    - link "CARTO":
      - /url: https://carto.com/attributions
    - text: ". County boundaries: Natural Earth."
  - paragraph:
    - link "About and sources":
      - /url: /about
- status
```

# Test source

```ts
  1   | // Explorer journeys: E2E-01 to E2E-04 and E2E-13 (QA-PLAN section 4).
  2   | import { countyDot, expect, gotoApp, query, readCount, searchBox, test, waitForCatalog } from './fixtures'
  3   | 
  4   | test.describe('Explorer', () => {
  5   |   test('E2E-01 land, pick county on map, results narrow, sort by style, open song, back keeps filters', async ({ page, data }, testInfo) => {
  6   |     test.skip(testInfo.project.name === 'phone-chromium', 'desktop journey; the phone journey is E2E-09')
  7   |     await gotoApp(page, '/')
  8   |     // 1. count equals the Romania scope; one bubble per mapped county
  9   |     const c0 = await readCount(page)
  10  |     expect(c0.n).toBe(data.ro.length)
  11  |     expect(c0.m).toBe(data.ro.length)
  12  |     const mappedCounties = new Set<string>()
  13  |     for (const s of data.ro) {
  14  |       const id = s.location.placeId
  15  |       if (!id) continue
  16  |       const parts = id.split('/')
  17  |       if (parts.length < 3) continue
  18  |       const county = parts.slice(0, 3).join('/')
  19  |       const p = data.placeById.get(county)
  20  |       if (p && p.lat !== null && p.lng !== null) mappedCounties.add(county)
  21  |     }
  22  |     await expect(page.locator('.map-view .dot--county')).toHaveCount(mappedCounties.size)
  23  | 
  24  |     // 2. click Arad
  25  |     const arad = countyDot(page, 'Arad')
  26  |     const label = (await arad.getAttribute('aria-label')) ?? ''
  27  |     const bubbleCount = Number(/: ([\d,]+) melodies/.exec(label)?.[1].replace(/,/g, ''))
  28  |     await arad.click()
  29  |     await expect(page.getByRole('button', { name: /Remove filter: Arad/ })).toBeVisible()
  30  |     await expect.poll(() => query(page).get('county')).toBe(data.countyId('Arad'))
  31  |     const c1 = await readCount(page)
  32  |     expect(c1.n).toBe(bubbleCount)
  33  |     expect(c1.n).toBe(data.under(data.countyId('Arad')).length)
  34  |     expect(c1.n).toBeLessThan(c0.n)
  35  | 
  36  |     // 3. sort by style
  37  |     await page.getByLabel('Sort by').selectOption('style')
  38  |     await expect.poll(() => query(page).get('sort')).toBe('style')
  39  |     const firstId = await page.locator('.song-row').first().getAttribute('data-song-id')
  40  |     const first = data.songs.find((s) => s.id === firstId)
  41  |     expect(first).toBeTruthy()
  42  |     if (data.under(data.countyId('Arad')).some((s) => s.style !== null)) expect(first?.style).not.toBeNull()
  43  | 
  44  |     // remember the results scroll position, then open the first song
  45  |     const results = page.locator('.results')
  46  |     await results.evaluate((el) => el.scrollTo(0, 300))
  47  |     const scrollBefore = await results.evaluate((el) => el.scrollTop)
  48  |     await page.locator('.song-row a.song-row__main').first().click()
  49  |     await expect(page).toHaveURL(new RegExp(`/song/${firstId}\\?.*county=`))
  50  |     await expect(page.locator('h1')).toContainText(first?.title?.trim() || first?.incipit?.trim() || 'Untitled')
  51  | 
  52  |     // 5. back keeps county chip, sort, count and scroll position
  53  |     await page.goBack()
  54  |     await waitForCatalog(page)
  55  |     await expect(page.getByRole('button', { name: /Remove filter: Arad/ })).toBeVisible()
  56  |     await expect(page.getByLabel('Sort by')).toHaveValue('style')
  57  |     expect((await readCount(page)).n).toBe(c1.n)
  58  |     await expect.poll(() => results.evaluate((el) => el.scrollTop)).toBeGreaterThan(scrollBefore - 50)
  59  |   })
  60  | 
  61  |   test('E2E-02 URL paste restores state', async ({ page, data }) => {
  62  |     const bihor = data.countyId('Bihor')
  63  |     await gotoApp(page, `/?county=${bihor}&genre=colinda,joc&from=1909&to=1912&sort=year&dir=desc`)
  64  |     const expected = data.under(bihor).filter((s) => (s.genre === 'colinda' || s.genre === 'joc') && s.collected.year !== null && s.collected.year >= 1909 && s.collected.year <= 1912)
  65  |     expect((await readCount(page)).n).toBe(expected.length)
  66  |     // chips
  67  |     for (const name of [/Remove filter: Bihor/, /Remove filter: colind/, /Remove filter: joc/, /Remove filter: 1909-1912/]) {
  68  |       await expect(page.getByRole('button', { name })).toBeVisible()
  69  |     }
  70  |     await expect(page.getByLabel('Sort by')).toHaveValue('year')
  71  |     await expect(page.getByRole('button', { name: 'Toggle sort direction' })).toHaveAttribute('aria-pressed', 'true')
  72  |     // the status bar shows the canonical string
  73  |     await expect(page.locator('.statusbar__query')).toHaveText(`?county=${bihor}&genre=colinda,joc&from=1909&to=1912&sort=year&dir=desc`)
  74  |     // the filter rail (desktop) or sheet (phone) reflects every value
  75  |     const isPhone = (await page.locator('.explorer--phone').count()) > 0
  76  |     if (isPhone) await page.getByRole('button', { name: /^Filters/ }).click()
  77  |     const rail = isPhone ? page.getByRole('dialog', { name: 'Filters' }) : page.getByRole('complementary', { name: 'Filters' })
  78  |     await expect(rail.locator(`[role="treeitem"][data-id="${bihor}"]`)).toHaveAttribute('aria-selected', 'true')
  79  |     await expect(rail.getByRole('checkbox', { name: /colind/ })).toBeChecked()
  80  |     await expect(rail.getByRole('checkbox', { name: /^joc/ })).toBeChecked()
  81  |     await expect(rail.getByRole('spinbutton', { name: 'From' })).toHaveValue('1909')
  82  |     await expect(rail.getByRole('spinbutton', { name: 'To' })).toHaveValue('1912')
  83  |   })
  84  | 
  85  |   test('E2E-03 clear all', async ({ page, data }) => {
  86  |     const bihor = data.countyId('Bihor')
  87  |     await gotoApp(page, `/?county=${bihor}&genre=colinda,joc&from=1909&to=1912&sort=year&dir=desc`)
  88  |     await page.locator('.results__chips').getByRole('button', { name: 'Clear all filters' }).click()
> 89  |     await expect(page).toHaveURL(/\/$/)
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  90  |     expect(query(page).toString()).toBe('')
  91  |     expect((await readCount(page)).n).toBe(data.ro.length)
  92  |     await expect(page.locator('.results__chips .chip')).toHaveCount(0)
  93  |   })
  94  | 
  95  |   test('E2E-04 search, with diacritics, and the empty state', async ({ page, data }) => {
  96  |     await gotoApp(page, '/')
  97  |     const box = searchBox(page)
  98  |     await box.fill('sculati')
  99  |     await expect.poll(() => query(page).get('q')).toBe('sculati')
  100 |     await expect(page.locator('.song-row').first()).toBeVisible()
  101 |     const titles = await page.locator('.song-row__title').allTextContents()
  102 |     expect(titles.some((t) => /scula/i.test(t))).toBe(true)
  103 |     // diacritics: "Sculați" finds the same records (diacritic-insensitive, FRONTEND-SPEC 4)
  104 |     await box.fill('Sculați')
  105 |     await expect.poll(async () => (await readCount(page)).n).toBeGreaterThan(0)
  106 |     const withDiacritics = (await readCount(page)).n
  107 |     await box.fill('sculati')
  108 |     await expect.poll(async () => (await readCount(page)).n).toBe(withDiacritics)
  109 |     expect(data.songs.some((s) => /scula/i.test(`${s.title ?? ''} ${s.incipit ?? ''}`))).toBe(true)
  110 |     // nonsense -> empty state with "Clear search"
  111 |     await box.fill('zzzzqqqq')
  112 |     await expect(page.getByText(/No melodies match "zzzzqqqq"/)).toBeVisible()
  113 |     await expect(page.getByRole('button', { name: /Export/ }).first()).toBeDisabled()
  114 |     await page.getByRole('button', { name: 'Clear search' }).click()
  115 |     await expect.poll(async () => (await readCount(page)).n).toBe(data.ro.length)
  116 |     await expect(box).toHaveValue('')
  117 |   })
  118 | 
  119 |   test('E2E-13 map interactions: hover card, click narrows, clear, village dots, list fallback', async ({ page, data }, testInfo) => {
  120 |     test.skip(testInfo.project.name === 'phone-chromium', 'touch map interactions are covered by E2E-09')
  121 |     await gotoApp(page, '/')
  122 |     const bihor = countyDot(page, 'Bihor')
  123 |     await bihor.hover()
  124 |     const card = page.locator('#map-hover-card')
  125 |     await expect(card).toBeVisible()
  126 |     await expect(card).toContainText('Bihor')
  127 |     await expect(card).toContainText(/\d+ melodies in \d+ villages/)
  128 |     await bihor.click()
  129 |     const bihorId = data.countyId('Bihor')
  130 |     await expect.poll(() => query(page).get('county')).toBe(bihorId)
  131 |     // village mode: dots for the villages of Bihor
  132 |     await expect(page.locator('.map-view .dot--village').first()).toBeVisible()
  133 |     const villageDots = page.locator('.map-view .dot--village')
  134 |     expect(await villageDots.count()).toBeGreaterThan(1)
  135 |     const villageLabel = (await villageDots.first().getAttribute('aria-label')) ?? ''
  136 |     await villageDots.first().click()
  137 |     await expect.poll(() => query(page).get('village')).toMatch(new RegExp(`^${bihorId}/`))
  138 |     await expect(page.getByRole('button', { name: new RegExp(`Remove filter: ${villageLabel.split(',')[0].replace(/[()]/g, '\\$&').slice(0, 12)}`) })).toBeVisible()
  139 |     // clearing with the chip's x goes back to the county
  140 |     await page.getByRole('button', { name: /Remove filter: / }).first().click()
  141 |     await expect.poll(() => query(page).get('village')).toBeNull()
  142 |     await page.getByRole('button', { name: /Remove filter: Bihor/ }).click()
  143 |     await expect.poll(() => query(page).get('county')).toBeNull()
  144 |     // keyboard fallback list
  145 |     const summary = page.getByText(/List counties \(\d+\)/)
  146 |     await expect(summary).toBeVisible()
  147 |     await summary.click()
  148 |     const item = page.locator('.map-list__item').first()
  149 |     await expect(item).toBeVisible()
  150 |     await item.focus()
  151 |     await page.keyboard.press('Enter')
  152 |     await expect.poll(() => query(page).get('county')).not.toBeNull()
  153 |   })
  154 | })
  155 | 
```