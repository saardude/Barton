# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> Accessibility (axe) >> error state
- Location: e2e/a11y.spec.ts:74:3

# Error details

```
Error: console.error entries

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "catalog: load failed {message: Failed to fetch, attempt: 0} @ http://localhost:4173/assets/index-HoZ-czke.js",
+ ]
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Skip to results" [ref=e3] [cursor=pointer]:
    - /url: "#results"
  - banner [ref=e4]:
    - link "Bartok / Romania" [ref=e5] [cursor=pointer]:
      - /url: /
    - searchbox "Search melodies" [ref=e8]
    - generic [ref=e9]:
      - generic [ref=e10]: Theme
      - combobox "Theme" [ref=e11]:
        - option "Auto" [selected]
        - option "Light"
        - option "Dark"
  - generic [ref=e12]:
    - generic [ref=e13]:
      - button "Filters (0)" [ref=e14] [cursor=pointer]
      - generic [aria-hidden] [ref=e15]: 4,072 melodies
    - main [ref=e16]:
      - tabpanel "Songs" [ref=e17]:
        - region "Map" [ref=e18]:
          - generic [ref=e19]:
            - application "Map of melodies; use the list after the map for keyboard access" [ref=e20]:
              - generic:
                - generic:
                  - 'button "Satu Mare (Szatmár): 82 melodies in 5 villages" [ref=e22] [cursor=pointer]':
                    - generic [aria-hidden]: "82"
                  - 'button "Maramureș (Máramaros): 370 melodies in 14 villages" [ref=e24] [cursor=pointer]':
                    - generic [aria-hidden]: "370"
                  - 'button "Suceava (Bukovina): 351 melodies in 5 villages" [ref=e26] [cursor=pointer]':
                    - generic [aria-hidden]: "351"
                  - 'button "Bistrița-Năsăud (Szolnok-Doboka): 1 melodies in 1 villages" [ref=e28] [cursor=pointer]':
                    - generic [aria-hidden]: "1"
                  - 'button "Iași (Moldva): 5 melodies in 1 villages" [ref=e30] [cursor=pointer]':
                    - generic [aria-hidden]: "5"
                  - 'button "Sălaj (Szilágy): 53 melodies in 5 villages" [ref=e32] [cursor=pointer]':
                    - generic [aria-hidden]: "53"
                  - 'button "Neamț (Moldva): 2 melodies in 1 villages" [ref=e34] [cursor=pointer]':
                    - generic [aria-hidden]: "2"
                  - 'button "Bihor (Bihar): 436 melodies in 28 villages" [ref=e36] [cursor=pointer]':
                    - generic [aria-hidden]: "436"
                  - 'button "Cluj (Kolozs): 284 melodies in 15 villages" [ref=e38] [cursor=pointer]':
                    - generic [aria-hidden]: "284"
                  - 'button "Bacău (Moldva): 304 melodies in 14 villages" [ref=e40] [cursor=pointer]':
                    - generic [aria-hidden]: "304"
                  - 'button "Mureș (Maros-Torda): 459 melodies in 38 villages" [ref=e42] [cursor=pointer]':
                    - generic [aria-hidden]: "459"
                  - 'button "Csongrád-Csanád (Torontál): 4 melodies in 2 villages" [ref=e44] [cursor=pointer]':
                    - generic [aria-hidden]: "4"
                  - 'button "Harghita (Udvarhely): 1,359 melodies in 79 villages" [ref=e46] [cursor=pointer]':
                    - generic [aria-hidden]: "1359"
                  - 'button "Arad: 31 melodies in 12 villages" [ref=e48] [cursor=pointer]':
                    - generic [aria-hidden]: "31"
                  - 'button "Alba (Torda-Aranyos): 70 melodies in 9 villages" [ref=e50] [cursor=pointer]':
                    - generic [aria-hidden]: "70"
                  - 'button "Covasna (Háromszék): 50 melodies in 9 villages" [ref=e52] [cursor=pointer]':
                    - generic [aria-hidden]: "50"
                  - 'button "Timiș (Torontál): 70 melodies in 13 villages" [ref=e54] [cursor=pointer]':
                    - generic [aria-hidden]: "70"
                  - 'button "Hunedoara (Hunyad): 105 melodies in 9 villages" [ref=e56] [cursor=pointer]':
                    - generic [aria-hidden]: "105"
                  - 'button "Brașov (Brassó): 32 melodies in 4 villages" [ref=e58] [cursor=pointer]':
                    - generic [aria-hidden]: "32"
                  - 'button "Caraș-Severin (Krassó-Szörény): 1 melodies in 1 villages" [ref=e60] [cursor=pointer]':
                    - generic [aria-hidden]: "1"
              - generic [ref=e61]:
                - link "Leaflet" [ref=e62] [cursor=pointer]:
                  - /url: https://leafletjs.com
                - text: "| ©"
                - link "OpenStreetMap" [ref=e63] [cursor=pointer]:
                  - /url: https://www.openstreetmap.org/copyright
                - text: contributors ©
                - link "CARTO" [ref=e64] [cursor=pointer]:
                  - /url: https://carto.com/attributions
            - generic [ref=e65]:
              - button "Zoom in" [ref=e66] [cursor=pointer]: +
              - button "Zoom out" [ref=e67] [cursor=pointer]: −
              - button "Fit to Romania" [ref=e68] [cursor=pointer]
        - region "Results" [ref=e71]:
          - generic [ref=e72]:
            - generic [ref=e73]: 4,072 of 4,072 melodies
            - generic [ref=e74]:
              - generic [ref=e75]:
                - generic [ref=e76]: Sort by
                - combobox "Sort by" [ref=e77]:
                  - option "Title" [selected]
                  - option "Style"
                  - option "Location"
                  - option "Year"
                  - option "Source number"
                - button "Toggle sort direction" [ref=e78] [cursor=pointer]: ↑
              - button "Export 4,072 melodies as JSON" [ref=e79] [cursor=pointer]: Export JSON
          - list "Results" [ref=e80]:
            - listitem [ref=e81]:
              - link "1. [Ai, Frunză verde, foaie lat'] Poiana (Biharmező) / Bihor, 1909" [ref=e82] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L157-01
                - generic [ref=e83]: 1. [Ai, Frunză verde, foaie lat']
                - generic [ref=e86]:
                  - generic [ref=e87]: Poiana (Biharmező) / Bihor,
                  - text: "1909"
              - generic [ref=e88]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e89] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L157-01/
                  - generic [ref=e90]: L 157
                - generic [ref=e93]:
                  - generic "has recording" [ref=e94]
                  - generic "has notation" [ref=e99]
            - listitem [ref=e105]:
              - link "1. Bagpipers (1) Feregi (Feresd) / Hunedoara, 1913" [ref=e106] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L123-01-1
                - generic [ref=e107]: 1. Bagpipers (1)
                - generic [ref=e110]:
                  - generic [ref=e111]: Feregi (Feresd) / Hunedoara,
                  - text: "1913"
              - generic [ref=e112]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e113] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L123-01-1/
                  - generic [ref=e114]: L 123
                - generic [ref=e117]:
                  - generic "has recording" [ref=e118]
                  - generic "has notation" [ref=e123]
            - listitem [ref=e129]:
              - link "1. Bagpipers (2) Câmp (Vaskohmező) / Bihor, 1910" [ref=e130] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L124-01-2
                - generic [ref=e131]: 1. Bagpipers (2)
                - generic [ref=e134]:
                  - generic [ref=e135]: Câmp (Vaskohmező) / Bihor,
                  - text: "1910"
              - generic [ref=e136]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e137] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L124-01-2/
                  - generic [ref=e138]: L 124
                - generic [ref=e141]:
                  - generic "has recording" [ref=e142]
                  - generic "has notation" [ref=e147]
            - listitem [ref=e153]:
              - link "1. Fekete főd, fehér az én zsebkendőm Chibed (Kibéd) / Mureș, 1906" [ref=e154] [cursor=pointer]:
                - /url: /song/fmbc-BB047-L166-01
                - generic [ref=e155]: 1. Fekete főd, fehér az én zsebkendőm
                - generic [ref=e158]:
                  - generic [ref=e159]: Chibed (Kibéd) / Mureș,
                  - text: "1906"
              - generic [ref=e160]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e161] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L166-01/
                  - generic [ref=e162]: L 166
                - generic [ref=e165]:
                  - generic "has recording" [ref=e166]
                  - generic "has notation" [ref=e171]
            - listitem [ref=e177]:
              - link "1. Hej, de sokszor megbántottál Suseni (Gyergyóújfalu) / Harghita, 1907" [ref=e178] [cursor=pointer]:
                - /url: /song/fmbc-BB106-L305-01
                - generic [ref=e179]: 1. Hej, de sokszor megbántottál
                - generic [ref=e182]:
                  - generic [ref=e183]: Suseni (Gyergyóújfalu) / Harghita,
                  - text: "1907"
              - generic [ref=e184]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e185] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L305-01/
                  - generic [ref=e186]: L 305
                - generic [ref=e189]:
                  - generic "has recording" [ref=e190]
                  - generic "has notation" [ref=e195]
            - listitem [ref=e201]:
              - link "1. Nu te supăra, mireasă Delani (Gyalány) / Bihor, 1909" [ref=e202] [cursor=pointer]:
                - /url: /song/fmbc-BB057-L155-01
                - generic [ref=e203]: 1. Nu te supăra, mireasă
                - generic [ref=e206]:
                  - generic [ref=e207]: Delani (Gyalány) / Bihor,
                  - text: "1909"
              - generic [ref=e208]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e209] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB057-L155-01/
                  - generic [ref=e210]: L 155
                - generic [ref=e213]:
                  - generic "has recording" [ref=e214]
                  - generic "has notation" [ref=e219]
            - listitem [ref=e225]:
              - link "1. Rég megmondtam, bús gerlice Cârța (Csíkkarcfalva) / Harghita, 1907" [ref=e226] [cursor=pointer]:
                - /url: /song/fmbc-BB060-L115-01
                - generic [ref=e227]: 1. Rég megmondtam, bús gerlice
                - generic [ref=e230]:
                  - generic [ref=e231]: Cârța (Csíkkarcfalva) / Harghita,
                  - text: "1907"
              - generic [ref=e232]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e233] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB060-L115-01/
                  - generic [ref=e234]: L 115
                - generic [ref=e237]:
                  - generic "has recording" [ref=e238]
                  - generic "has notation" [ref=e243]
            - listitem [ref=e249]:
              - link "1. Stick Dance Voiniceni (Mezőszabad) / Mureș, 1912" [ref=e250] [cursor=pointer]:
                - /url: /song/fmbc-BB068-L128-01
                - generic [ref=e251]: 1. Stick Dance
                - generic [ref=e254]:
                  - generic [ref=e255]: Voiniceni (Mezőszabad) / Mureș,
                  - text: "1912"
              - generic [ref=e256]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e257] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L128-01/
                  - generic [ref=e258]: L 128
                - generic [ref=e261]:
                  - generic "has recording" [ref=e262]
                  - generic "has notation" [ref=e267]
            - listitem [ref=e273]:
              - link "1. Túl vagy, rózsám, túl vagy Suseni (Gyergyóújfalu) / Harghita, 1907" [ref=e274] [cursor=pointer]:
                - /url: /song/fmbc-BB044-L020-01
                - generic [ref=e275]: 1. Túl vagy, rózsám, túl vagy
                - generic [ref=e278]:
                  - generic [ref=e279]: Suseni (Gyergyóújfalu) / Harghita,
                  - text: "1907"
              - generic [ref=e280]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e281] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB044-L020-01/
                  - generic [ref=e282]: L 305
                - generic [ref=e285]:
                  - generic "has recording" [ref=e286]
                  - generic "has notation" [ref=e291]
            - listitem [ref=e297]:
              - link "2. Bear Dance Oncești (Váncsfalva) / Maramureș, 1913" [ref=e298] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L125-02
                - generic [ref=e299]: 2. Bear Dance
                - generic [ref=e302]:
                  - generic [ref=e303]: Oncești (Váncsfalva) / Maramureș,
                  - text: "1913"
              - generic [ref=e304]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e305] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L125-02/
                  - generic [ref=e306]: L 125
                - generic [ref=e309]:
                  - generic "has recording" [ref=e310]
                  - generic "has notation" [ref=e315]
            - listitem [ref=e321]:
              - link "2. Belt Dance Igriș (Egres) / Csongrád-Csanád, 1912" [ref=e322] [cursor=pointer]:
                - /url: /song/fmbc-BB068-L129-02
                - generic [ref=e323]: 2. Belt Dance
                - generic [ref=e326]:
                  - generic [ref=e327]: Igriș (Egres) / Csongrád-Csanád,
                  - text: "1912"
              - generic [ref=e328]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e329] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L129-02/
                  - generic [ref=e330]: L 129
                - generic [ref=e333]:
                  - generic "has recording" [ref=e334]
                  - generic "has notation" [ref=e339]
            - listitem [ref=e345]:
              - link "2. Édesanyám rózsafája Cârța (Csíkkarcfalva) / Harghita, 1907" [ref=e346] [cursor=pointer]:
                - /url: /song/fmbc-BB044-L305-02
                - generic [ref=e347]: 2. Édesanyám rózsafája
                - generic [ref=e350]:
                  - generic [ref=e351]: Cârța (Csíkkarcfalva) / Harghita,
                  - text: "1907"
              - generic [ref=e352]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e353] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB044-L305-02/
                  - generic [ref=e354]: L 20
                - generic "has notation" [ref=e358]
            - listitem [ref=e364]:
              - link "2. Hei, Toată lumea vrea să moru Cociuba-Mare (Alsókocsoba) / Bihor, 1912" [ref=e365] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L158-02
                - generic [ref=e366]: 2. Hei, Toată lumea vrea să moru
                - generic [ref=e369]:
                  - generic [ref=e370]: Cociuba-Mare (Alsókocsoba) / Bihor,
                  - text: "1912"
              - generic [ref=e371]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e372] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L158-02/
                  - generic [ref=e373]: L 158
                - generic [ref=e376]:
                  - generic "has recording" [ref=e377]
                  - generic "has notation" [ref=e382]
            - listitem [ref=e388]:
              - link "2. Istenem, életem Dealu (Oroszhegy) / Harghita, 1902" [ref=e389] [cursor=pointer]:
                - /url: /song/fmbc-BB106-L306-02
                - generic [ref=e390]: 2. Istenem, életem
                - generic [ref=e393]:
                  - generic [ref=e394]: Dealu (Oroszhegy) / Harghita,
                  - text: "1902"
              - generic [ref=e395]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e396] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L306-02/
                  - generic [ref=e397]: L 306
                - generic [ref=e400]:
                  - generic "has recording" [ref=e401]
                  - generic "has notation" [ref=e406]
            - listitem [ref=e412]:
              - link "2. Istenem, Istenem, áraszd meg a vizet Rugănești (Rugonfalva) / Harghita, 1902" [ref=e413] [cursor=pointer]:
                - /url: /song/fmbc-BB047-L167-02
                - generic [ref=e414]: 2. Istenem, Istenem, áraszd meg a vizet
                - generic [ref=e417]:
                  - generic [ref=e418]: Rugănești (Rugonfalva) / Harghita,
                  - text: "1902"
              - generic [ref=e419]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e420] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L167-02/
                  - generic [ref=e421]: L 167
                - generic [ref=e424]:
                  - generic "has recording" [ref=e425]
                  - generic "has notation" [ref=e430]
            - listitem [ref=e436]:
              - link "2. Jaj istenem! kire várok Cârța (Csíkkarcfalva) / Harghita, 1907" [ref=e437] [cursor=pointer]:
                - /url: /song/fmbc-BB060-L116-02
                - generic [ref=e438]: 2. Jaj istenem! kire várok
                - generic [ref=e441]:
                  - generic [ref=e442]: Cârța (Csíkkarcfalva) / Harghita,
                  - text: "1907"
              - generic [ref=e443]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e444] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB060-L116-02/
                  - generic [ref=e445]: L 116
                - generic [ref=e448]:
                  - generic "has recording" [ref=e449]
                  - generic "has notation" [ref=e454]
            - listitem [ref=e460]:
              - link "2. Măi bădiță, prostule Delani (Gyalány) / Bihor, 1909" [ref=e461] [cursor=pointer]:
                - /url: /song/fmbc-BB057-L156-02
                - generic [ref=e462]: 2. Măi bădiță, prostule
                - generic [ref=e465]:
                  - generic [ref=e466]: Delani (Gyalány) / Bihor,
                  - text: "1909"
              - generic [ref=e467]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e468] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB057-L156-02/
                  - generic [ref=e469]: L 156
                - generic [ref=e472]:
                  - generic "has recording" [ref=e473]
                  - generic "has notation" [ref=e478]
            - listitem [ref=e484]:
              - link "2. The Wanderer Suseni (Gyergyóújfalu) / Harghita, 1907" [ref=e485] [cursor=pointer]:
                - /url: /song/fmbc-BB099-L259-02
                - generic [ref=e486]: 2. The Wanderer
                - generic [ref=e489]:
                  - generic [ref=e490]: Suseni (Gyergyóújfalu) / Harghita,
                  - text: "1907"
              - generic [ref=e491]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e492] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB099-L259-02/
                  - generic [ref=e493]: L 259
                - generic [ref=e496]:
                  - generic "has recording" [ref=e497]
                  - generic "has notation" [ref=e502]
            - listitem [ref=e508]:
              - link "3. Asszonyok, asszonyok, had’ legyek társatok Ciumani (Gyergyócsomafalva) / Harghita, 1907" [ref=e509] [cursor=pointer]:
                - /url: /song/fmbc-BB047-L168-03
                - generic [ref=e510]: 3. Asszonyok, asszonyok, had’ legyek társatok
                - generic [ref=e513]:
                  - generic [ref=e514]: Ciumani (Gyergyócsomafalva) / Harghita,
                  - text: "1907"
              - generic [ref=e515]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e516] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L168-03/
                  - generic [ref=e517]: L 168
                - generic [ref=e520]:
                  - generic "has recording" [ref=e521]
                  - generic "has notation" [ref=e526]
            - listitem [ref=e532]:
              - link "3. Finale (1) Râpa de Sus (Felsőrépa) / Mureș, 1914" [ref=e533] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L126-03-1
                - generic [ref=e534]: 3. Finale (1)
                - generic [ref=e537]:
                  - generic [ref=e538]: Râpa de Sus (Felsőrépa) / Mureș,
                  - text: "1914"
              - generic [ref=e539]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e540] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L126-03-1/
                  - generic [ref=e541]: L 126
                - generic [ref=e544]:
                  - generic "has recording" [ref=e545]
                  - generic "has notation" [ref=e550]
            - listitem [ref=e556]:
              - link "3. Stamping Dance Igriș (Egres) / Csongrád-Csanád, 1912" [ref=e557] [cursor=pointer]:
                - /url: /song/fmbc-BB068-L130-03
                - generic [ref=e558]: 3. Stamping Dance
                - generic [ref=e561]:
                  - generic [ref=e562]: Igriș (Egres) / Csongrád-Csanád,
                  - text: "1912"
              - generic [ref=e563]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e564] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L130-03/
                  - generic [ref=e565]: L 130
                - generic [ref=e568]:
                  - generic "has recording" [ref=e569]
                  - generic "has notation" [ref=e574]
            - listitem [ref=e580]:
              - link "3. [Vai de mine, ce să fii] Rogoz (Venterrogoz) / Bihor, 1911" [ref=e581] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L159-03
                - generic [ref=e582]: 3. [Vai de mine, ce să fii]
                - generic [ref=e585]:
                  - generic [ref=e586]: Rogoz (Venterrogoz) / Bihor,
                  - text: "1911"
              - generic [ref=e587]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e588] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L159-03/
                  - generic [ref=e589]: L 159
                - generic [ref=e592]:
                  - generic "has recording" [ref=e593]
                  - generic "has notation" [ref=e598]
            - listitem [ref=e604]:
              - link "3. Vékony cérna, kemény mag Dornești (Hadikfalva) / Suceava, 1914" [ref=e605] [cursor=pointer]:
                - /url: /song/fmbc-BB106-L307-03
                - generic [ref=e606]: 3. Vékony cérna, kemény mag
                - generic [ref=e609]:
                  - generic [ref=e610]: Dornești (Hadikfalva) / Suceava,
                  - text: "1914"
              - generic [ref=e611]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e612] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L307-03/
                  - generic [ref=e613]: L 307
                - generic [ref=e616]:
                  - generic "has recording" [ref=e617]
                  - generic "has notation" [ref=e622]
            - listitem [ref=e628]:
              - link "4. Annyi bánat az szűvemen Suseni (Gyergyóújfalu) / Harghita, 1907" [ref=e629] [cursor=pointer]:
                - /url: /song/fmbc-BB047-L169-04
                - generic [ref=e630]: 4. Annyi bánat az szűvemen
                - generic [ref=e633]:
                  - generic [ref=e634]: Suseni (Gyergyóújfalu) / Harghita,
                  - text: "1907"
              - generic [ref=e635]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e636] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L169-04/
                  - generic [ref=e637]: L 169
                - generic [ref=e640]:
                  - generic "has recording" [ref=e641]
                  - generic "has notation" [ref=e646]
            - listitem [ref=e652]:
              - link "4. [Ciucuri verde de mătasă] Mănăștiur (Temesmonostor) / Arad, 1912" [ref=e653] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L138-04
                - generic [ref=e654]: 4. [Ciucuri verde de mătasă]
                - generic [ref=e657]:
                  - generic [ref=e658]: Mănăștiur (Temesmonostor) / Arad,
                  - text: "1912"
              - generic [ref=e659]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e660] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L138-04/
                  - generic [ref=e661]: L 138
                - generic [ref=e664]:
                  - generic "has recording" [ref=e665]
                  - generic "has notation" [ref=e670]
            - listitem [ref=e676]:
              - link "4. Dance of Bucium Bistra (Bisztra) / Alba, 1910" [ref=e677] [cursor=pointer]:
                - /url: /song/fmbc-BB068-L131-04
                - generic [ref=e678]: 4. Dance of Bucium
                - generic [ref=e681]:
                  - generic [ref=e682]: Bistra (Bisztra) / Alba,
                  - text: "1910"
              - generic [ref=e683]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e684] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L131-04/
                  - generic [ref=e685]: L 131
                - generic [ref=e688]:
                  - generic "has recording" [ref=e689]
                  - generic "has notation" [ref=e694]
            - listitem [ref=e700]:
              - link "4. Kilyénfalvi közeptizbe Bezid (Bözöd) / Harghita, 1904" [ref=e701] [cursor=pointer]:
                - /url: /song/fmbc-BB106-L308-04
                - generic [ref=e702]: 4. Kilyénfalvi közeptizbe
                - generic [ref=e705]:
                  - generic [ref=e706]: Bezid (Bözöd) / Harghita,
                  - text: "1904"
              - generic [ref=e707]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e708] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L308-04/
                  - generic [ref=e709]: L 308
                - generic [ref=e712]:
                  - generic "has recording" [ref=e713]
                  - generic "has notation" [ref=e718]
            - listitem [ref=e724]:
              - link "4. Love Song (2) Joseni (Gyergyóalfalu) / Harghita, 1911" [ref=e725] [cursor=pointer]:
                - /url: /song/fmbc-BB099-L262-04-2
                - generic [ref=e726]: 4. Love Song (2)
                - generic [ref=e729]:
                  - generic [ref=e730]: Joseni (Gyergyóalfalu) / Harghita,
                  - text: "1911"
              - generic [ref=e731]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e732] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB099-L262-04-2/
                  - generic [ref=e733]: L 262
                - generic [ref=e736]:
                  - generic "has recording" [ref=e737]
                  - generic "has notation" [ref=e742]
            - listitem [ref=e748]:
              - link "5. [Fă mă Doamne, ce mii face] Murani (Temesmurány) / Timiș, 1912" [ref=e749] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L160-05
                - generic [ref=e750]: 5. [Fă mă Doamne, ce mii face]
                - generic [ref=e753]:
                  - generic [ref=e754]: Murani (Temesmurány) / Timiș,
                  - text: "1912"
              - generic [ref=e755]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e756] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L160-05/
                  - generic [ref=e757]: L 160
                - generic [ref=e760]:
                  - generic "has recording" [ref=e761]
                  - generic "has notation" [ref=e766]
            - listitem [ref=e772]:
              - link "5. Ha kimegyek arr’ a magos tetőre (1) Cârța (Csíkkarcfalva) / Harghita, 1907" [ref=e773] [cursor=pointer]:
                - /url: /song/fmbc-BB047-L170-05-1
                - generic [ref=e774]: 5. Ha kimegyek arr’ a magos tetőre (1)
                - generic [ref=e777]:
                  - generic [ref=e778]: Cârța (Csíkkarcfalva) / Harghita,
                  - text: "1907"
              - generic [ref=e779]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e780] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L170-05-1/
                  - generic [ref=e781]: L 170
                - generic [ref=e784]:
                  - generic "has recording" [ref=e785]
                  - generic "has notation" [ref=e790]
            - listitem [ref=e796]:
              - link "5. Ha kimegyek arr’ a magos tetőre (2) Valea Strâmbă (Tekerőpatak) / Harghita, 1907" [ref=e797] [cursor=pointer]:
                - /url: /song/fmbc-BB047-L170-05-2
                - generic [ref=e798]: 5. Ha kimegyek arr’ a magos tetőre (2)
                - generic [ref=e801]:
                  - generic [ref=e802]: Valea Strâmbă (Tekerőpatak) / Harghita,
                  - text: "1907"
              - generic [ref=e803]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e804] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L170-05-2/
                  - generic [ref=e805]: L 170
                - generic [ref=e808]:
                  - generic "has recording" [ref=e809]
                  - generic "has notation" [ref=e814]
            - listitem [ref=e820]:
              - link "5. Romanian Polka Beiuș (Belényes) / Bihor, 1910" [ref=e821] [cursor=pointer]:
                - /url: /song/fmbc-BB068-L132-05
                - generic [ref=e822]: 5. Romanian Polka
                - generic [ref=e825]:
                  - generic [ref=e826]: Beiuș (Belényes) / Bihor,
                  - text: "1910"
              - generic [ref=e827]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e828] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L132-05/
                  - generic [ref=e829]: L 132
                - generic [ref=e832]:
                  - generic "has recording" [ref=e833]
                  - generic "has notation" [ref=e838]
            - listitem [ref=e844]:
              - link "5. Vékony cérna, kemény mag Dornești (Hadikfalva) / Suceava, 1914" [ref=e845] [cursor=pointer]:
                - /url: /song/fmbc-BB106-L307-05
                - generic [ref=e846]: 5. Vékony cérna, kemény mag
                - generic [ref=e849]:
                  - generic [ref=e850]: Dornești (Hadikfalva) / Suceava,
                  - text: "1914"
              - generic [ref=e851]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e852] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L307-05/
                  - generic [ref=e853]: L 307
                - generic [ref=e856]:
                  - generic "has recording" [ref=e857]
                  - generic "has notation" [ref=e862]
            - listitem [ref=e868]:
              - link "6. Allegro moderato, molto capriccioso [Jaj istenem, ezt a vént] Ghimeș-Făget (Csíkgyimes) / Harghita, 1904" [ref=e869] [cursor=pointer]:
                - /url: /song/fmbc-BB083-L205-06
                - generic [ref=e870]: 6. Allegro moderato, molto capriccioso [Jaj istenem, ezt a vént]
                - generic [ref=e873]:
                  - generic [ref=e874]: Ghimeș-Făget (Csíkgyimes) / Harghita,
                  - text: "1904"
              - generic [ref=e875]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e876] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB083-L205-06/
                  - generic [ref=e877]: L 205
                - generic [ref=e880]:
                  - generic "has recording" [ref=e881]
                  - generic "has notation" [ref=e886]
            - listitem [ref=e892]:
              - link "6. Járjad pap a táncot Mănăstireni (Magyargyerőmonostor) / Cluj, 1910" [ref=e893] [cursor=pointer]:
                - /url: /song/fmbc-BB106-L309-06
                - generic [ref=e894]: 6. Járjad pap a táncot
                - generic [ref=e897]:
                  - generic [ref=e898]: Mănăstireni (Magyargyerőmonostor) / Cluj,
                  - text: "1910"
              - generic [ref=e899]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e900] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L309-06/
                  - generic [ref=e901]: L 309
                - generic [ref=e904]:
                  - generic "has recording" [ref=e905]
                  - generic "has notation" [ref=e910]
            - listitem [ref=e916]:
              - link "6. Până fusei la maica, măi Budureasa (Bondoraszó) / Bihor, 1909" [ref=e917] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L161-06
                - generic [ref=e918]: 6. Până fusei la maica, măi
                - generic [ref=e921]:
                  - generic [ref=e922]: Budureasa (Bondoraszó) / Bihor,
                  - text: "1909"
              - generic [ref=e923]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e924] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L161-06/
                  - generic [ref=e925]: L 161
                - generic [ref=e928]:
                  - generic "has recording" [ref=e929]
                  - generic "has notation" [ref=e934]
            - listitem [ref=e940]:
              - link "6. Quick Dance (1) Beiuș (Belényes) / Bihor, 1910" [ref=e941] [cursor=pointer]:
                - /url: /song/fmbc-BB068-L133-06-1
                - generic [ref=e942]: 6. Quick Dance (1)
                - generic [ref=e945]:
                  - generic [ref=e946]: Beiuș (Belényes) / Bihor,
                  - text: "1910"
              - generic [ref=e947]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e948] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L133-06-1/
                  - generic [ref=e949]: L 133
                - generic [ref=e952]:
                  - generic "has recording" [ref=e953]
                  - generic "has notation" [ref=e958]
            - listitem [ref=e964]:
              - link "6. Quick Dance (2) Poiana Vadului (Neagra) / Alba, 1910" [ref=e965] [cursor=pointer]:
                - /url: /song/fmbc-BB068-L134-06-2
                - generic [ref=e966]: 6. Quick Dance (2)
                - generic [ref=e969]:
                  - generic [ref=e970]: Poiana Vadului (Neagra) / Alba,
                  - text: "1910"
              - generic [ref=e971]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e972] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L134-06-2/
                  - generic [ref=e973]: L 134
                - generic [ref=e976]:
                  - generic "has recording" [ref=e977]
                  - generic "has notation" [ref=e982]
            - listitem [ref=e988]:
              - link "6. Töltik a nagy erdő útját Văcăreşti (Csíkvacsárcsi) / Harghita, 1907" [ref=e989] [cursor=pointer]:
                - /url: /song/fmbc-BB047-L171-06
                - generic [ref=e990]: 6. Töltik a nagy erdő útját
                - generic [ref=e993]:
                  - generic [ref=e994]: Văcăreşti (Csíkvacsárcsi) / Harghita,
                  - text: "1907"
              - generic [ref=e995]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e996] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L171-06/
                  - generic [ref=e997]: L 171
                - generic [ref=e1000]:
                  - generic "has recording" [ref=e1001]
                  - generic "has notation" [ref=e1006]
            - listitem [ref=e1012]:
              - link "7. Eddig való dolgom a tavaszi szántás Vălenii (Székelyvaja) / Mureș, 1914" [ref=e1013] [cursor=pointer]:
                - /url: /song/fmbc-BB047-L172-07
                - generic [ref=e1014]: 7. Eddig való dolgom a tavaszi szántás
                - generic [ref=e1017]:
                  - generic [ref=e1018]: Vălenii (Székelyvaja) / Mureș,
                  - text: "1914"
              - generic [ref=e1019]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1020] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L172-07/
                  - generic [ref=e1021]: L 172
                - generic [ref=e1024]:
                  - generic "has recording" [ref=e1025]
                  - generic "has notation" [ref=e1030]
            - listitem [ref=e1036]:
              - link "7. Frunză verde, foaie fragă Groşi (Tőtös) / Bihor, 1912" [ref=e1037] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L162-07
                - generic [ref=e1038]: 7. Frunză verde, foaie fragă
                - generic [ref=e1041]:
                  - generic [ref=e1042]: Groşi (Tőtös) / Bihor,
                  - text: "1912"
              - generic [ref=e1043]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1044] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L162-07/
                  - generic [ref=e1045]: L 162
                - generic [ref=e1048]:
                  - generic "has recording" [ref=e1049]
                  - generic "has notation" [ref=e1054]
            - listitem [ref=e1060]:
              - link "7. Sostenuto, rubato [Beli fiam beli] Polonița (Lengyelfalva) / Harghita, 1903" [ref=e1061] [cursor=pointer]:
                - /url: /song/fmbc-BB083-L206-07
                - generic [ref=e1062]: 7. Sostenuto, rubato [Beli fiam beli]
                - generic [ref=e1065]:
                  - generic [ref=e1066]: Polonița (Lengyelfalva) / Harghita,
                  - text: "1903"
              - generic [ref=e1067]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1068] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB083-L206-07/
                  - generic [ref=e1069]: L 206
                - generic [ref=e1072]:
                  - generic "has recording" [ref=e1073]
                  - generic "has notation" [ref=e1078]
            - listitem [ref=e1084]:
              - link "7. Száraz ágtól messze virít a rózsa Chibed (Kibéd) / Mureș, 1904" [ref=e1085] [cursor=pointer]:
                - /url: /song/fmbc-BB042-L010-07
                - generic [ref=e1086]: 7. Száraz ágtól messze virít a rózsa
                - generic [ref=e1089]:
                  - generic [ref=e1090]: Chibed (Kibéd) / Mureș,
                  - text: "1904"
              - generic [ref=e1091]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1092] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB042-L010-07/
                  - generic [ref=e1093]: L 10
                - generic "has notation" [ref=e1097]
            - listitem [ref=e1103]:
              - link "8. Allegro [Télen nem jó szántani] Dioșod (Diósad) / Sălaj, 1914" [ref=e1104] [cursor=pointer]:
                - /url: /song/fmbc-BB083-L207-08
                - generic [ref=e1105]: 8. Allegro [Télen nem jó szántani]
                - generic [ref=e1108]:
                  - generic [ref=e1109]: Dioșod (Diósad) / Sălaj,
                  - text: "1914"
              - generic [ref=e1110]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1111] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB083-L207-08/
                  - generic [ref=e1112]: L 207
                - generic [ref=e1115]:
                  - generic "has recording" [ref=e1116]
                  - generic "has notation" [ref=e1121]
            - listitem [ref=e1127]:
              - link "8. Atâtea gânduri îmi vinu Cotiglet (Kótliget) / Bihor, 1912" [ref=e1128] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L163-08
                - generic [ref=e1129]: 8. Atâtea gânduri îmi vinu
                - generic [ref=e1132]:
                  - generic [ref=e1133]: Cotiglet (Kótliget) / Bihor,
                  - text: "1912"
              - generic [ref=e1134]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1135] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L163-08/
                  - generic [ref=e1136]: L 163
                - generic [ref=e1139]:
                  - generic "has recording" [ref=e1140]
                  - generic "has notation" [ref=e1145]
            - listitem [ref=e1151]:
              - link "8. Olvad a hó, csárdás kis angyalom Văcăreşti (Csíkvacsárcsi) / Harghita, 1907" [ref=e1152] [cursor=pointer]:
                - /url: /song/fmbc-BB047-L173-08
                - generic [ref=e1153]: 8. Olvad a hó, csárdás kis angyalom
                - generic [ref=e1156]:
                  - generic [ref=e1157]: Văcăreşti (Csíkvacsárcsi) / Harghita,
                  - text: "1907"
              - generic [ref=e1158]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1159] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L173-08/
                  - generic [ref=e1160]: L 173
                - generic [ref=e1163]:
                  - generic "has recording" [ref=e1164]
                  - generic "has notation" [ref=e1169]
            - listitem [ref=e1175]:
              - link "9. Cine n'are noroc n'are Hotărel (Határ) / Bihor, 1909" [ref=e1176] [cursor=pointer]:
                - /url: /song/fmbc-BB069-L164-09
                - generic [ref=e1177]: 9. Cine n'are noroc n'are
                - generic [ref=e1180]:
                  - generic [ref=e1181]: Hotărel (Határ) / Bihor,
                  - text: "1909"
              - generic [ref=e1182]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1183] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L164-09/
                  - generic [ref=e1184]: L 164
                - generic [ref=e1187]:
                  - generic "has recording" [ref=e1188]
                  - generic "has notation" [ref=e1193]
            - listitem [ref=e1199]:
              - link "9. Még azt mondják Chibed (Kibéd) / Mureș, 1904" [ref=e1200] [cursor=pointer]:
                - /url: /song/fmbc-BB043-L019-09
                - generic [ref=e1201]: 9. Még azt mondják
                - generic [ref=e1204]:
                  - generic [ref=e1205]: Chibed (Kibéd) / Mureș,
                  - text: "1904"
              - generic [ref=e1206]:
                - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1207] [cursor=pointer]:
                  - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB043-L019-09/
                  - generic [ref=e1208]: L 19
                - generic [ref=e1211]:
                  - generic "has recording" [ref=e1212]
                  - generic "has notation" [ref=e1217]
            - listitem [ref=e1223]:
              - link "„100 liba egy sorba” – clarinet Căpâlnița (Kápolnásfalu) / Harghita, 1903" [ref=e1224] [cursor=pointer]:
                - /url: /song/bsys-82-13152
                - generic [ref=e1225]: „100 liba egy sorba” – clarinet
                - generic [ref=e1228]:
                  - generic [ref=e1229]: Căpâlnița (Kápolnásfalu) / Harghita,
                  - text: "1903"
              - link "Open original record on The Bartók System" [ref=e1231] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/82/13152
                - generic [ref=e1232]: F 63
            - listitem [ref=e1235]:
              - link "a 134. Ai Jos la ta - - fleasca, Curtecap (Körtekapu) / Mureș, 1914" [ref=e1236] [cursor=pointer]:
                - /url: /song/rfm-4-73nn
                - generic [ref=e1237]: a 134. Ai Jos la ta - - fleasca,
                - generic [ref=e1240]:
                  - generic [ref=e1241]: Curtecap (Körtekapu) / Mureș,
                  - text: "1914"
              - generic [ref=e1242]:
                - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=e1243] [cursor=pointer]:
                  - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n176
                  - generic [ref=e1244]: F. 1355 c)
                - generic "has notation" [ref=e1248]
          - navigation "Results pages" [ref=e1254]:
            - button "Previous page" [disabled] [ref=e1255]: ←
            - generic [ref=e1256]:
              - generic [ref=e1257]: Go to page
              - spinbutton "Go to page" [ref=e1258]: "1"
            - generic [ref=e1259]: Page 1 of 82
            - button "Next page" [ref=e1260] [cursor=pointer]: →
    - navigation "Views" [ref=e1261]:
      - tablist "Views" [ref=e1262]:
        - tab "Map" [ref=e1263] [cursor=pointer]
        - tab [selected] [ref=e1267] [cursor=pointer]:
          - generic [ref=e1270]:
            - text: Songs
            - generic [aria-hidden] [ref=e1271]: 4,072
        - tab "Places" [ref=e1272] [cursor=pointer]
      - link "Journeys" [ref=e1276] [cursor=pointer]:
        - /url: /journeys
  - contentinfo [ref=e1281]:
    - paragraph [ref=e1282]:
      - text: "Data: HUN-REN BTK Institute for Musicology, Budapest (Bartok Archives):"
      - generic [ref=e1283]:
        - text: "\""
        - link "Folk Music in Bartók's Compositions" [ref=e1284] [cursor=pointer]:
          - /url: https://bartok-nepzene.zti.hu/en/
        - text: "\""
      - generic [ref=e1285]:
        - text: ", \""
        - link "The Bartók System" [ref=e1286] [cursor=pointer]:
          - /url: https://systems.zti.hu/br/en
        - text: "\""
      - generic [ref=e1287]:
        - text: and "
        - link "Béla Bartók, the Ethnomusicologist" [ref=e1288] [cursor=pointer]:
          - /url: https://bartok-gyujtesek.zti.hu/en
        - text: "\""
      - text: .
    - paragraph [ref=e1289]: Records, notation images and recordings remain the property of the Institute; this viewer is an independent interface and is not affiliated with it.
    - paragraph [ref=e1290]:
      - text: "Printed edition: Bela Bartok, Rumanian Folk Music (ed. Benjamin Suchoff, Martinus Nijhoff, 1967-1975),"
      - link "open volumes on the Internet Archive" [ref=e1291] [cursor=pointer]:
        - /url: https://archive.org/details/rumanianfolkmusi0004blab
      - text: ; only facts and incipits are indexed.
    - paragraph [ref=e1292]:
      - text: "Map: ©"
      - link "OpenStreetMap" [ref=e1293] [cursor=pointer]:
        - /url: https://www.openstreetmap.org/copyright
      - text: contributors, ©
      - link "CARTO" [ref=e1294] [cursor=pointer]:
        - /url: https://carto.com/attributions
      - text: ". County boundaries: Natural Earth."
    - paragraph [ref=e1295]:
      - link "About and sources" [ref=e1296] [cursor=pointer]:
        - /url: /about
  - status
```

# Test source

```ts
  1   | // Shared Playwright fixtures (QA-PLAN section 4, AC-35): every test fails on console.error /
  2   | // pageerror; external hosts (map tiles, zti.hu media) are stubbed so runs are hermetic; `data`
  3   | // exposes the built dataset for computing expected counts.
  4   | import { readdirSync, readFileSync } from 'node:fs'
  5   | import { dirname, join } from 'node:path'
  6   | import { fileURLToPath } from 'node:url'
  7   | import { expect, test as base, type Locator, type Page } from '@playwright/test'
  8   | import { hydrateSongs } from '../src/data/hydrate'
  9   | import type { Place } from '../src/types/place'
  10  | import type { Song } from '../src/types/song'
  11  | 
  12  | export { expect }
  13  | 
  14  | const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
  15  | const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
  16  | const TILE_HOSTS = /cartocdn\.com|openstreetmap\.org|tile\./i
  17  | /** Console errors that come from the sandbox, not the app (the proxy blocks external hosts). */
  18  | const IGNORED_CONSOLE = [/ERR_CERT_AUTHORITY_INVALID/, TILE_HOSTS, /ERR_TUNNEL_CONNECTION_FAILED/, /ERR_PROXY/, /net::ERR_/]
  19  | 
  20  | /** The app's own record shape: the built songs file is the slim format, hydrated exactly as the app does. */
  21  | export type SongLite = Song
  22  | export type PlaceLite = Place
  23  | 
  24  | export interface DataFixture {
  25  |   songs: SongLite[]
  26  |   places: PlaceLite[]
  27  |   placeById: Map<string, PlaceLite>
  28  |   /** Records under Romania (the default `country=ro` scope, FRONTEND-SPEC 4). */
  29  |   ro: SongLite[]
  30  |   under(placeId: string): SongLite[]
  31  |   countyId(name: string): string
  32  |   song(pred: (s: SongLite) => boolean): SongLite
  33  | }
  34  | 
  35  | function loadData(): DataFixture {
  36  |   const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'data')
  37  |   const files = readdirSync(dir)
  38  |   const read = <T>(prefix: string): T => {
  39  |     const f = files.find((x) => x.startsWith(prefix + '.') && x.endsWith('.json'))
  40  |     if (!f) throw new Error(`dist/data/${prefix}.*.json not found; run npm run build`)
  41  |     return JSON.parse(readFileSync(join(dir, f), 'utf8')) as T
  42  |   }
  43  |   const places = read<Place[]>('places')
  44  |   const songs = hydrateSongs(read<unknown>('songs'), places)
  45  |   const placeById = new Map(places.map((p) => [p.id, p]))
  46  |   const ro = songs.filter((s) => (s.location.placeId ? s.location.placeId === 'ro' || s.location.placeId.startsWith('ro/') : s.location.country === 'RO'))
  47  |   return {
  48  |     songs,
  49  |     places,
  50  |     placeById,
  51  |     ro,
  52  |     under: (placeId) => songs.filter((s) => s.location.placeId === placeId || (s.location.placeId?.startsWith(placeId + '/') ?? false)),
  53  |     countyId: (name) => {
  54  |       const p = places.find((x) => x.type === 'county' && x.name === name)
  55  |       if (!p) throw new Error(`county ${name} not in places`)
  56  |       return p.id
  57  |     },
  58  |     song: (pred) => {
  59  |       const s = songs.find(pred)
  60  |       if (!s) throw new Error('no song matches the predicate')
  61  |       return s
  62  |     },
  63  |   }
  64  | }
  65  | 
  66  | export interface ConsoleLog {
  67  |   errors: string[]
  68  |   pageErrors: string[]
  69  | }
  70  | 
  71  | export const test = base.extend<{ consoleLog: ConsoleLog; allowConsoleErrors: boolean }, { data: DataFixture }>({
  72  |   data: [
  73  |     // eslint-disable-next-line no-empty-pattern
  74  |     async ({}, use) => {
  75  |       await use(loadData())
  76  |     },
  77  |     { scope: 'worker' },
  78  |   ],
  79  |   allowConsoleErrors: [false, { option: true }],
  80  |   consoleLog: [
  81  |     async ({ page, allowConsoleErrors }, use) => {
  82  |       const log: ConsoleLog = { errors: [], pageErrors: [] }
  83  |       page.on('console', (msg) => {
  84  |         if (msg.type() !== 'error') return
  85  |         const text = `${msg.text()} @ ${msg.location().url}`
  86  |         if (IGNORED_CONSOLE.some((re) => re.test(text))) return
  87  |         log.errors.push(text)
  88  |       })
  89  |       page.on('pageerror', (err) => log.pageErrors.push(String(err)))
  90  |       await use(log)
  91  |       if (!allowConsoleErrors) {
  92  |         expect.soft(log.pageErrors, 'uncaught page errors').toEqual([])
> 93  |         expect.soft(log.errors, 'console.error entries').toEqual([])
      |                                                          ^ Error: console.error entries
  94  |       }
  95  |     },
  96  |     { auto: true },
  97  |   ],
  98  |   page: async ({ page }, use) => {
  99  |     // Hermetic network: everything off localhost is answered locally (tiles -> blank PNG).
  100 |     await page.route(
  101 |       (url) => !LOCAL_HOSTS.has(url.hostname),
  102 |       (route) => {
  103 |         const url = route.request().url()
  104 |         if (/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url) || TILE_HOSTS.test(url) || route.request().resourceType() === 'image') {
  105 |           return route.fulfill({ status: 200, contentType: 'image/png', body: BLANK_PNG })
  106 |         }
  107 |         return route.fulfill({ status: 204, body: '' })
  108 |       },
  109 |     )
  110 |     await use(page)
  111 |   },
  112 | })
  113 | 
  114 | const COUNT_RE = /([\d,]+) of ([\d,]+) melodies/
  115 | 
  116 | /** Waits until the catalogue is loaded and the results header shows "N of M melodies". */
  117 | export async function waitForCatalog(page: Page): Promise<void> {
  118 |   await expect(page.locator('.results__count').first()).toHaveText(COUNT_RE, { timeout: 60_000 })
  119 | }
  120 | 
  121 | /** Parses "1,204 of 13,212 melodies" from the results header. */
  122 | export async function readCount(page: Page): Promise<{ n: number; m: number }> {
  123 |   const el = page.locator('.results__count').first()
  124 |   await expect(el).toHaveText(COUNT_RE)
  125 |   const m = COUNT_RE.exec((await el.textContent()) ?? '')
  126 |   if (!m) throw new Error('count not found')
  127 |   return { n: Number(m[1].replace(/,/g, '')), m: Number(m[2].replace(/,/g, '')) }
  128 | }
  129 | 
  130 | export async function gotoApp(page: Page, path: string): Promise<void> {
  131 |   await page.goto(path)
  132 |   await waitForCatalog(page)
  133 | }
  134 | 
  135 | export function countyDot(page: Page, name: string): Locator {
  136 |   return page.locator(`.map-view .dot--county[aria-label^="${name}:"]`)
  137 | }
  138 | 
  139 | export function searchBox(page: Page): Locator {
  140 |   return page.getByRole('searchbox', { name: 'Search melodies' })
  141 | }
  142 | 
  143 | /** True when the route still renders the "being built" placeholder (StubPages). */
  144 | export async function isStub(page: Page): Promise<boolean> {
  145 |   return (await page.getByText('This screen is being built').count()) > 0
  146 | }
  147 | 
  148 | export function query(page: Page): URLSearchParams {
  149 |   return new URL(page.url()).searchParams
  150 | }
  151 | 
  152 | export async function hasVisibleFocusRing(page: Page): Promise<boolean> {
  153 |   return page.evaluate(() => {
  154 |     const el = document.activeElement as HTMLElement | null
  155 |     if (!el || el === document.body) return false
  156 |     const cs = getComputedStyle(el)
  157 |     const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
  158 |     const shadow = cs.boxShadow !== 'none'
  159 |     return outline || shadow
  160 |   })
  161 | }
  162 | 
  163 | /** Seeded PRNG so the 20-record sample (E2E-15) is stable. */
  164 | export function seededSample<T>(items: T[], n: number, seed = 42): T[] {
  165 |   let s = seed
  166 |   const rand = () => {
  167 |     s = (s * 1664525 + 1013904223) % 4294967296
  168 |     return s / 4294967296
  169 |   }
  170 |   const pool = [...items]
  171 |   const out: T[] = []
  172 |   while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0])
  173 |   return out
  174 | }
  175 | 
```