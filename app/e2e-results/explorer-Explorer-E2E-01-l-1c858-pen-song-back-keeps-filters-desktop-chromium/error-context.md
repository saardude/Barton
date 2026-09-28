# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: explorer.spec.ts >> Explorer >> E2E-01 land, pick county on map, results narrow, sort by style, open song, back keeps filters
- Location: e2e/explorer.spec.ts:5:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /Remove filter: Arad/ })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: /Remove filter: Arad/ }) with timeout 15000ms
  - waiting for getByRole('button', { name: /Remove filter: Arad/ })

```

```yaml
- link "Skip to results":
  - /url: "#results"
- banner:
  - link "Bartok / Romania":
    - /url: /
  - navigation "Primary":
    - link "Explorer":
      - /url: /
    - link "Journeys":
      - /url: /journeys
    - link "About and sources":
      - /url: /about
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
      - /url: /?unmapped=1
    - 'tooltip "Aradlocation uncertain Crișana / RO 31 melodies in 12 villages Genres: 17 colindă / winter carol colindă 17 1,906-1,917 and n.d. 3 recordings, 26 notations 4 villages not mapped Click to zoom to this county"':
      - text: Aradlocation uncertain Crișana / RO 31 melodies in 12 villages
      - 'img "Genres: 17 colindă / winter carol"'
      - text: colindă 17 1,906-1,917 and n.d. 3 recordings, 26 notations 4 villages not mapped Click to zoom to this county
    - group: List counties (20)
  - region "Results":
    - text: 4,072 of 4,072 melodies Sort by
    - combobox "Sort by":
      - option "Title" [selected]
      - option "Style"
      - option "Location"
      - option "Year"
      - option "Source number"
    - button "Toggle sort direction": ↑
    - button "Export 4,072 melodies as JSON": Export JSON
    - list "Results":
      - listitem:
        - link "1. [Ai, Frunză verde, foaie lat'] Poiana (Biharmező) / Bihor, 1909":
          - /url: /song/fmbc-BB069-L157-01
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L157-01/
          - text: L 157
        - text: has recording has notation
      - listitem:
        - link "1. Bagpipers (1) Feregi (Feresd) / Hunedoara, 1913":
          - /url: /song/fmbc-BB069-L123-01-1
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L123-01-1/
          - text: L 123
        - text: has recording has notation
      - listitem:
        - link "1. Bagpipers (2) Câmp (Vaskohmező) / Bihor, 1910":
          - /url: /song/fmbc-BB069-L124-01-2
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L124-01-2/
          - text: L 124
        - text: has recording has notation
      - listitem:
        - link "1. Fekete főd, fehér az én zsebkendőm Chibed (Kibéd) / Mureș, 1906":
          - /url: /song/fmbc-BB047-L166-01
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L166-01/
          - text: L 166
        - text: has recording has notation
      - listitem:
        - link "1. Hej, de sokszor megbántottál Suseni (Gyergyóújfalu) / Harghita, 1907":
          - /url: /song/fmbc-BB106-L305-01
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L305-01/
          - text: L 305
        - text: has recording has notation
      - listitem:
        - link "1. Nu te supăra, mireasă Delani (Gyalány) / Bihor, 1909":
          - /url: /song/fmbc-BB057-L155-01
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB057-L155-01/
          - text: L 155
        - text: has recording has notation
      - listitem:
        - link "1. Rég megmondtam, bús gerlice Cârța (Csíkkarcfalva) / Harghita, 1907":
          - /url: /song/fmbc-BB060-L115-01
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB060-L115-01/
          - text: L 115
        - text: has recording has notation
      - listitem:
        - link "1. Stick Dance Voiniceni (Mezőszabad) / Mureș, 1912":
          - /url: /song/fmbc-BB068-L128-01
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L128-01/
          - text: L 128
        - text: has recording has notation
      - listitem:
        - link "1. Túl vagy, rózsám, túl vagy Suseni (Gyergyóújfalu) / Harghita, 1907":
          - /url: /song/fmbc-BB044-L020-01
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB044-L020-01/
          - text: L 305
        - text: has recording has notation
      - listitem:
        - link "2. Bear Dance Oncești (Váncsfalva) / Maramureș, 1913":
          - /url: /song/fmbc-BB069-L125-02
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L125-02/
          - text: L 125
        - text: has recording has notation
      - listitem:
        - link "2. Belt Dance Igriș (Egres) / Csongrád-Csanád, 1912":
          - /url: /song/fmbc-BB068-L129-02
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L129-02/
          - text: L 129
        - text: has recording has notation
      - listitem:
        - link "2. Édesanyám rózsafája Cârța (Csíkkarcfalva) / Harghita, 1907":
          - /url: /song/fmbc-BB044-L305-02
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB044-L305-02/
          - text: L 20
        - text: has notation
      - listitem:
        - link "2. Hei, Toată lumea vrea să moru Cociuba-Mare (Alsókocsoba) / Bihor, 1912":
          - /url: /song/fmbc-BB069-L158-02
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L158-02/
          - text: L 158
        - text: has recording has notation
      - listitem:
        - link "2. Istenem, életem Dealu (Oroszhegy) / Harghita, 1902":
          - /url: /song/fmbc-BB106-L306-02
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L306-02/
          - text: L 306
        - text: has recording has notation
      - listitem:
        - link "2. Istenem, Istenem, áraszd meg a vizet Rugănești (Rugonfalva) / Harghita, 1902":
          - /url: /song/fmbc-BB047-L167-02
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L167-02/
          - text: L 167
        - text: has recording has notation
      - listitem:
        - link "2. Jaj istenem! kire várok Cârța (Csíkkarcfalva) / Harghita, 1907":
          - /url: /song/fmbc-BB060-L116-02
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB060-L116-02/
          - text: L 116
        - text: has recording has notation
      - listitem:
        - link "2. Măi bădiță, prostule Delani (Gyalány) / Bihor, 1909":
          - /url: /song/fmbc-BB057-L156-02
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB057-L156-02/
          - text: L 156
        - text: has recording has notation
      - listitem:
        - link "2. The Wanderer Suseni (Gyergyóújfalu) / Harghita, 1907":
          - /url: /song/fmbc-BB099-L259-02
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB099-L259-02/
          - text: L 259
        - text: has recording has notation
      - listitem:
        - link "3. Asszonyok, asszonyok, had’ legyek társatok Ciumani (Gyergyócsomafalva) / Harghita, 1907":
          - /url: /song/fmbc-BB047-L168-03
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L168-03/
          - text: L 168
        - text: has recording has notation
      - listitem:
        - link "3. Finale (1) Râpa de Sus (Felsőrépa) / Mureș, 1914":
          - /url: /song/fmbc-BB069-L126-03-1
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L126-03-1/
          - text: L 126
        - text: has recording has notation
      - listitem:
        - link "3. Stamping Dance Igriș (Egres) / Csongrád-Csanád, 1912":
          - /url: /song/fmbc-BB068-L130-03
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L130-03/
          - text: L 130
        - text: has recording has notation
      - listitem:
        - link "3. [Vai de mine, ce să fii] Rogoz (Venterrogoz) / Bihor, 1911":
          - /url: /song/fmbc-BB069-L159-03
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L159-03/
          - text: L 159
        - text: has recording has notation
      - listitem:
        - link "3. Vékony cérna, kemény mag Dornești (Hadikfalva) / Suceava, 1914":
          - /url: /song/fmbc-BB106-L307-03
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L307-03/
          - text: L 307
        - text: has recording has notation
      - listitem:
        - link "4. Annyi bánat az szűvemen Suseni (Gyergyóújfalu) / Harghita, 1907":
          - /url: /song/fmbc-BB047-L169-04
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L169-04/
          - text: L 169
        - text: has recording has notation
      - listitem:
        - link "4. [Ciucuri verde de mătasă] Mănăștiur (Temesmonostor) / Arad, 1912":
          - /url: /song/fmbc-BB069-L138-04
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L138-04/
          - text: L 138
        - text: has recording has notation
      - listitem:
        - link "4. Dance of Bucium Bistra (Bisztra) / Alba, 1910":
          - /url: /song/fmbc-BB068-L131-04
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L131-04/
          - text: L 131
        - text: has recording has notation
      - listitem:
        - link "4. Kilyénfalvi közeptizbe Bezid (Bözöd) / Harghita, 1904":
          - /url: /song/fmbc-BB106-L308-04
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L308-04/
          - text: L 308
        - text: has recording has notation
      - listitem:
        - link "4. Love Song (2) Joseni (Gyergyóalfalu) / Harghita, 1911":
          - /url: /song/fmbc-BB099-L262-04-2
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB099-L262-04-2/
          - text: L 262
        - text: has recording has notation
      - listitem:
        - link "5. [Fă mă Doamne, ce mii face] Murani (Temesmurány) / Timiș, 1912":
          - /url: /song/fmbc-BB069-L160-05
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L160-05/
          - text: L 160
        - text: has recording has notation
      - listitem:
        - link "5. Ha kimegyek arr’ a magos tetőre (1) Cârța (Csíkkarcfalva) / Harghita, 1907":
          - /url: /song/fmbc-BB047-L170-05-1
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L170-05-1/
          - text: L 170
        - text: has recording has notation
      - listitem:
        - link "5. Ha kimegyek arr’ a magos tetőre (2) Valea Strâmbă (Tekerőpatak) / Harghita, 1907":
          - /url: /song/fmbc-BB047-L170-05-2
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L170-05-2/
          - text: L 170
        - text: has recording has notation
      - listitem:
        - link "5. Romanian Polka Beiuș (Belényes) / Bihor, 1910":
          - /url: /song/fmbc-BB068-L132-05
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L132-05/
          - text: L 132
        - text: has recording has notation
      - listitem:
        - link "5. Vékony cérna, kemény mag Dornești (Hadikfalva) / Suceava, 1914":
          - /url: /song/fmbc-BB106-L307-05
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L307-05/
          - text: L 307
        - text: has recording has notation
      - listitem:
        - link "6. Allegro moderato, molto capriccioso [Jaj istenem, ezt a vént] Ghimeș-Făget (Csíkgyimes) / Harghita, 1904":
          - /url: /song/fmbc-BB083-L205-06
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB083-L205-06/
          - text: L 205
        - text: has recording has notation
      - listitem:
        - link "6. Járjad pap a táncot Mănăstireni (Magyargyerőmonostor) / Cluj, 1910":
          - /url: /song/fmbc-BB106-L309-06
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L309-06/
          - text: L 309
        - text: has recording has notation
      - listitem:
        - link "6. Până fusei la maica, măi Budureasa (Bondoraszó) / Bihor, 1909":
          - /url: /song/fmbc-BB069-L161-06
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L161-06/
          - text: L 161
        - text: has recording has notation
      - listitem:
        - link "6. Quick Dance (1) Beiuș (Belényes) / Bihor, 1910":
          - /url: /song/fmbc-BB068-L133-06-1
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L133-06-1/
          - text: L 133
        - text: has recording has notation
      - listitem:
        - link "6. Quick Dance (2) Poiana Vadului (Neagra) / Alba, 1910":
          - /url: /song/fmbc-BB068-L134-06-2
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L134-06-2/
          - text: L 134
        - text: has recording has notation
      - listitem:
        - link "6. Töltik a nagy erdő útját Văcăreşti (Csíkvacsárcsi) / Harghita, 1907":
          - /url: /song/fmbc-BB047-L171-06
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L171-06/
          - text: L 171
        - text: has recording has notation
      - listitem:
        - link "7. Eddig való dolgom a tavaszi szántás Vălenii (Székelyvaja) / Mureș, 1914":
          - /url: /song/fmbc-BB047-L172-07
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L172-07/
          - text: L 172
        - text: has recording has notation
      - listitem:
        - link "7. Frunză verde, foaie fragă Groşi (Tőtös) / Bihor, 1912":
          - /url: /song/fmbc-BB069-L162-07
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L162-07/
          - text: L 162
        - text: has recording has notation
      - listitem:
        - link "7. Sostenuto, rubato [Beli fiam beli] Polonița (Lengyelfalva) / Harghita, 1903":
          - /url: /song/fmbc-BB083-L206-07
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB083-L206-07/
          - text: L 206
        - text: has recording has notation
      - listitem:
        - link "7. Száraz ágtól messze virít a rózsa Chibed (Kibéd) / Mureș, 1904":
          - /url: /song/fmbc-BB042-L010-07
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB042-L010-07/
          - text: L 10
        - text: has notation
      - listitem:
        - link "8. Allegro [Télen nem jó szántani] Dioșod (Diósad) / Sălaj, 1914":
          - /url: /song/fmbc-BB083-L207-08
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB083-L207-08/
          - text: L 207
        - text: has recording has notation
      - listitem:
        - link "8. Atâtea gânduri îmi vinu Cotiglet (Kótliget) / Bihor, 1912":
          - /url: /song/fmbc-BB069-L163-08
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L163-08/
          - text: L 163
        - text: has recording has notation
      - listitem:
        - link "8. Olvad a hó, csárdás kis angyalom Văcăreşti (Csíkvacsárcsi) / Harghita, 1907":
          - /url: /song/fmbc-BB047-L173-08
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L173-08/
          - text: L 173
        - text: has recording has notation
      - listitem:
        - link "9. Cine n'are noroc n'are Hotărel (Határ) / Bihor, 1909":
          - /url: /song/fmbc-BB069-L164-09
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L164-09/
          - text: L 164
        - text: has recording has notation
      - listitem:
        - link "9. Még azt mondják Chibed (Kibéd) / Mureș, 1904":
          - /url: /song/fmbc-BB043-L019-09
        - link "Open original record on Folk Music in Bartók's Compositions":
          - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB043-L019-09/
          - text: L 19
        - text: has recording has notation
      - listitem:
        - link "„100 liba egy sorba” – clarinet Căpâlnița (Kápolnásfalu) / Harghita, 1903":
          - /url: /song/bsys-82-13152
        - link "Open original record on The Bartók System":
          - /url: https://systems.zti.hu/br/en/browse/82/13152
          - text: F 63
      - listitem:
        - link "a 134. Ai Jos la ta - - fleasca, Curtecap (Körtekapu) / Mureș, 1914":
          - /url: /song/rfm-4-73nn
        - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)":
          - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n176
          - text: F. 1355 c)
        - text: has notation
    - navigation "Results pages":
      - button "Previous page" [disabled]: ←
      - text: Go to page
      - spinbutton "Go to page": "1"
      - text: Page 1 of 82
      - button "Next page": →
- status "Query status":
  - code: /
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
> 29  |     await expect(page.getByRole('button', { name: /Remove filter: Arad/ })).toBeVisible()
      |                                                                             ^ Error: expect(locator).toBeVisible() failed
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
  89  |     await expect(page).toHaveURL(/\/$/)
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
```