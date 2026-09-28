# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: explorer.spec.ts >> Explorer >> E2E-13 map interactions: hover card, click narrows, clear, village dots, list fallback
- Location: e2e/explorer.spec.ts:119:3

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.hover: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('.map-view .dot--county[aria-label^="Bihor:"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Skip to results" [ref=e3] [cursor=pointer]:
    - /url: "#results"
  - banner [ref=e4]:
    - link "Bartok / Romania" [ref=e5] [cursor=pointer]:
      - /url: /
    - navigation "Primary" [ref=e6]:
      - link "Explorer" [ref=e7] [cursor=pointer]:
        - /url: /
      - link "Journeys" [ref=e8] [cursor=pointer]:
        - /url: /journeys
      - link "About and sources" [ref=e9] [cursor=pointer]:
        - /url: /about
    - searchbox "Search melodies" [ref=e12]
    - generic [ref=e13]:
      - button "Colour by genre" [ref=e14] [cursor=pointer]
      - generic [ref=e15]: Theme
      - combobox "Theme" [ref=e16]:
        - option "Auto" [selected]
        - option "Light"
        - option "Dark"
  - generic [ref=e17]:
    - complementary "Filters" [ref=e18]:
      - heading "Filters" [level=2] [ref=e20]
      - group [ref=e21]:
        - generic "Place Loc / Hely" [ref=e22] [cursor=pointer]:
          - generic [ref=e23]:
            - text: Place
            - generic [ref=e24]: Loc / Hely
        - generic [ref=e26]:
          - generic [ref=e27]:
            - generic [ref=e28]: Country
            - combobox "Country" [ref=e29]:
              - option "Romania" [selected]
              - option "Croatia"
              - option "Hungary"
              - option "Serbia"
              - option "Slovakia"
              - option "Ukraine"
              - option "Unknown country"
              - option "All countries"
          - tree "Places" [ref=e30]:
            - treeitem "Romania 4,072" [expanded] [level=1] [selected] [ref=e31]:
              - generic [ref=e32] [cursor=pointer]:
                - button [aria-hidden] [ref=e33]
                - generic "Clear country filter" [ref=e34]: Romania
                - generic [ref=e36]: 4,072
            - treeitem "Banat 75" [level=2] [ref=e37]:
              - generic [ref=e38] [cursor=pointer]:
                - button [aria-hidden] [ref=e39]
                - generic "Filter to Banat" [ref=e40]: Banat
                - generic [ref=e42]: "75"
            - treeitem "Bukovina 351" [level=2] [ref=e43]:
              - generic [ref=e44] [cursor=pointer]:
                - button [aria-hidden] [ref=e45]
                - generic "Filter to Bukovina" [ref=e46]: Bukovina
                - generic [ref=e48]: "351"
            - treeitem "Crișana 602" [level=2] [ref=e49]:
              - generic [ref=e50] [cursor=pointer]:
                - button [aria-hidden] [ref=e51]
                - generic "Filter to Crișana" [ref=e52]: Crișana
                - generic [ref=e54]: "602"
            - treeitem "Maramureș 370" [level=2] [ref=e55]:
              - generic [ref=e56] [cursor=pointer]:
                - button [aria-hidden] [ref=e57]
                - generic "Filter to Maramureș" [ref=e58]: Maramureș
                - generic [ref=e60]: "370"
            - treeitem "Moldavia 311" [level=2] [ref=e61]:
              - generic [ref=e62] [cursor=pointer]:
                - button [aria-hidden] [ref=e63]
                - generic "Filter to Moldavia" [ref=e64]: Moldavia
                - generic [ref=e66]: "311"
            - treeitem "Transylvania 2,360" [level=2] [ref=e67]:
              - generic [ref=e68] [cursor=pointer]:
                - button [aria-hidden] [ref=e69]
                - generic "Filter to Transylvania" [ref=e70]: Transylvania
                - generic [ref=e72]: 2,360
            - treeitem "(county unknown)not mapped 3" [level=2] [ref=e73]:
              - generic [ref=e74] [cursor=pointer]:
                - button [aria-hidden] [ref=e75]
                - generic "Filter to (county unknown)" [ref=e76]: (county unknown)not mapped
                - generic [ref=e78]: "3"
            - treeitem "Croatia 1" [level=1] [ref=e79]:
              - generic [ref=e80] [cursor=pointer]:
                - button [aria-hidden] [ref=e81]
                - generic "Filter to Croatia" [ref=e82]: Croatia
                - generic [ref=e84]: "1"
            - treeitem "Hungary 6,472" [level=1] [ref=e85]:
              - generic [ref=e86] [cursor=pointer]:
                - button [aria-hidden] [ref=e87]
                - generic "Filter to Hungary" [ref=e88]: Hungary
                - generic [ref=e90]: 6,472
            - treeitem "Serbia 2" [level=1] [ref=e91]:
              - generic [ref=e92] [cursor=pointer]:
                - button [aria-hidden] [ref=e93]
                - generic "Filter to Serbia" [ref=e94]: Serbia
                - generic [ref=e96]: "2"
            - treeitem "Slovakia 1,210" [level=1] [ref=e97]:
              - generic [ref=e98] [cursor=pointer]:
                - button [aria-hidden] [ref=e99]
                - generic "Filter to Slovakia" [ref=e100]: Slovakia
                - generic [ref=e102]: 1,210
            - treeitem "Ukraine 7" [level=1] [ref=e103]:
              - generic [ref=e104] [cursor=pointer]:
                - button [aria-hidden] [ref=e105]
                - generic "Filter to Ukraine" [ref=e106]: Ukraine
                - generic [ref=e108]: "7"
            - treeitem "Unknown countrynot mapped 2,646" [level=1] [ref=e109]:
              - generic [ref=e110] [cursor=pointer]:
                - button [aria-hidden] [ref=e111]
                - generic "Filter to Unknown country" [ref=e112]: Unknown countrynot mapped
                - generic [ref=e114]: 2,646
      - group [ref=e115]:
        - generic "Genre Gen / Műfaj" [ref=e116] [cursor=pointer]:
          - generic [ref=e117]:
            - text: Genre
            - generic [ref=e118]: Gen / Műfaj
        - group "Genre" [ref=e120]:
          - 'generic "hu: sirató" [ref=e121]':
            - checkbox "bocet / lament 21" [ref=e122]
            - generic [ref=e124]: bocet / lament
            - generic [ref=e125]: "21"
          - 'generic "hu: kolinda (téli köszöntő ének)" [ref=e126]':
            - checkbox "colindă / winter carol 497" [ref=e127]
            - generic [ref=e129]: colindă / winter carol
            - generic [ref=e130]: "497"
          - 'generic "hu: doina (hora lungă)" [ref=e131]':
            - checkbox "doină / lyrical improvised song (hora lungă) 9" [ref=e132]
            - generic [ref=e134]: doină / lyrical improvised song (hora lungă)
            - generic [ref=e135]: "9"
          - 'generic "hu: táncdallam" [ref=e136]':
            - checkbox "joc / dance tune 113" [ref=e137]
            - generic [ref=e139]: joc / dance tune
            - generic [ref=e140]: "113"
          - 'generic "hu: lakodalmi dal" [ref=e141]':
            - checkbox "cântec de nuntă / wedding song (0)" [disabled] [ref=e142]
            - generic [ref=e144]: cântec de nuntă / wedding song
            - generic [ref=e145]: (0)
          - 'generic "hu: tulajdonképpeni dal" [ref=e146]':
            - checkbox "cântec (propriu-zis) / song proper 173" [ref=e147]
            - generic [ref=e149]: cântec (propriu-zis) / song proper
            - generic [ref=e150]: "173"
          - 'generic "hu: egyéb" [ref=e151]':
            - checkbox "altele / other / unclassified 17" [ref=e152]
            - generic [ref=e154]: altele / other / unclassified
            - generic [ref=e155]: "17"
      - group [ref=e156]:
        - generic "Style Stil / Stílus" [ref=e157] [cursor=pointer]:
          - generic [ref=e158]:
            - text: Style
            - generic [ref=e159]: Stil / Stílus
        - group "Style" [ref=e161]:
          - button "instrumental 204" [ref=e162] [cursor=pointer]:
            - generic [ref=e163]: instrumental
            - generic [ref=e164]: "204"
          - button "mixed style 702" [ref=e165] [cursor=pointer]:
            - generic [ref=e166]: mixed style
            - generic [ref=e167]: "702"
          - button "new style 656" [ref=e168] [cursor=pointer]:
            - generic [ref=e169]: new style
            - generic [ref=e170]: "656"
          - button "not classified 113" [ref=e171] [cursor=pointer]:
            - generic [ref=e172]: not classified
            - generic [ref=e173]: "113"
          - button "old style 1,480" [ref=e174] [cursor=pointer]:
            - generic [ref=e175]: old style
            - generic [ref=e176]: 1,480
      - group [ref=e177]:
        - generic "Performance Interpretare / Előadásmód" [ref=e178] [cursor=pointer]:
          - generic [ref=e179]:
            - text: Performance
            - generic [ref=e180]: Interpretare / Előadásmód
        - group "Performance" [ref=e182]:
          - button "vocal 775" [ref=e183] [cursor=pointer]:
            - generic [ref=e184]: vocal
            - generic [ref=e185]: "775"
          - button "instrumental 288" [ref=e186] [cursor=pointer]:
            - generic [ref=e187]: instrumental
            - generic [ref=e188]: "288"
          - button "vocal and instrumental (0)" [disabled] [ref=e189]:
            - generic [ref=e190]: vocal and instrumental
            - generic [ref=e191]: (0)
          - button "unknown 3,009" [ref=e192] [cursor=pointer]:
            - generic [ref=e193]: unknown
            - generic [ref=e194]: 3,009
      - group [ref=e195]:
        - generic "Instrument Instrument / Hangszer" [ref=e196] [cursor=pointer]:
          - generic [ref=e197]:
            - text: Instrument
            - generic [ref=e198]: Instrument / Hangszer
        - group "Instrument" [ref=e200]:
          - button "alphorn (bucium) 12" [ref=e201] [cursor=pointer]:
            - generic [ref=e202]: alphorn (bucium)
            - generic [ref=e203]: "12"
          - button "bagpipe 2" [ref=e204] [cursor=pointer]:
            - generic [ref=e205]: bagpipe
            - generic [ref=e206]: "2"
          - button "shepherd's flute (fluier) 6" [ref=e207] [cursor=pointer]:
            - generic [ref=e208]: shepherd's flute (fluier)
            - generic [ref=e209]: "6"
          - button "guitar 1" [ref=e210] [cursor=pointer]:
            - generic [ref=e211]: guitar
            - generic [ref=e212]: "1"
          - button "violin 8" [ref=e213] [cursor=pointer]:
            - generic [ref=e214]: violin
            - generic [ref=e215]: "8"
      - group [ref=e216]:
        - generic "Year An / Év" [ref=e217] [cursor=pointer]:
          - generic [ref=e218]:
            - text: Year
            - generic [ref=e219]: An / Év
        - generic [ref=e221]:
          - generic [ref=e222]:
            - generic [ref=e223]:
              - text: From
              - spinbutton "From" [ref=e224]: "1865"
            - generic [ref=e225]:
              - text: To
              - spinbutton "To" [ref=e226]: "1943"
          - img "Melodies per 5 years, 1865 to 1944; most in 1910s" [ref=e227]
          - generic [ref=e238]:
            - generic [ref=e239]: From
            - slider "From": "1865"
            - generic [ref=e240]: To
            - slider "To": "1943"
      - button "Clear all filters" [disabled] [ref=e242]
    - main [ref=e243]:
      - region "Map" [ref=e244]:
        - generic [ref=e245]:
          - application "Map of melodies; use the list after the map for keyboard access" [ref=e246]:
            - generic:
              - generic:
                - 'button "Satu Mare (Szatmár): 82 melodies in 5 villages" [ref=e248] [cursor=pointer]':
                  - generic [aria-hidden]: "82"
                - 'button "Maramureș (Máramaros): 370 melodies in 14 villages" [ref=e250] [cursor=pointer]':
                  - generic [aria-hidden]: "370"
                - 'button "Suceava (Bukovina): 351 melodies in 5 villages" [ref=e252] [cursor=pointer]':
                  - generic [aria-hidden]: "351"
                - 'button "Bistrița-Năsăud (Szolnok-Doboka): 1 melodies in 1 villages" [ref=e254] [cursor=pointer]':
                  - generic [aria-hidden]: "1"
                - 'button "Iași (Moldva): 5 melodies in 1 villages" [ref=e256] [cursor=pointer]':
                  - generic [aria-hidden]: "5"
                - 'button "Sălaj (Szilágy): 53 melodies in 5 villages" [ref=e258] [cursor=pointer]':
                  - generic [aria-hidden]: "53"
                - 'button "Neamț (Moldva): 2 melodies in 1 villages" [ref=e260] [cursor=pointer]':
                  - generic [aria-hidden]: "2"
                - 'button "Bihor (Bihar): 436 melodies in 28 villages" [ref=e262] [cursor=pointer]':
                  - generic [aria-hidden]: "436"
                - 'button "Cluj (Kolozs): 284 melodies in 15 villages" [ref=e264] [cursor=pointer]':
                  - generic [aria-hidden]: "284"
                - 'button "Bacău (Moldva): 304 melodies in 14 villages" [ref=e266] [cursor=pointer]':
                  - generic [aria-hidden]: "304"
                - 'button "Mureș (Maros-Torda): 459 melodies in 38 villages" [ref=e268] [cursor=pointer]':
                  - generic [aria-hidden]: "459"
                - 'button "Csongrád-Csanád (Torontál): 4 melodies in 2 villages" [ref=e270] [cursor=pointer]':
                  - generic [aria-hidden]: "4"
                - 'button "Harghita (Udvarhely): 1,359 melodies in 79 villages" [ref=e272] [cursor=pointer]':
                  - generic [aria-hidden]: "1359"
                - 'button "Arad: 31 melodies in 12 villages" [ref=e274] [cursor=pointer]':
                  - generic [aria-hidden]: "31"
                - 'button "Alba (Torda-Aranyos): 70 melodies in 9 villages" [ref=e276] [cursor=pointer]':
                  - generic [aria-hidden]: "70"
                - 'button "Covasna (Háromszék): 50 melodies in 9 villages" [ref=e278] [cursor=pointer]':
                  - generic [aria-hidden]: "50"
                - 'button "Timiș (Torontál): 70 melodies in 13 villages" [ref=e280] [cursor=pointer]':
                  - generic [aria-hidden]: "70"
                - 'button "Hunedoara (Hunyad): 105 melodies in 9 villages" [ref=e282] [cursor=pointer]':
                  - generic [aria-hidden]: "105"
                - 'button "Brașov (Brassó): 32 melodies in 4 villages" [ref=e284] [cursor=pointer]':
                  - generic [aria-hidden]: "32"
                - 'button "Caraș-Severin (Krassó-Szörény): 1 melodies in 1 villages" [ref=e286] [cursor=pointer]':
                  - generic [aria-hidden]: "1"
            - generic [ref=e287]:
              - link "Leaflet" [ref=e288] [cursor=pointer]:
                - /url: https://leafletjs.com
              - text: "| ©"
              - link "OpenStreetMap" [ref=e289] [cursor=pointer]:
                - /url: https://www.openstreetmap.org/copyright
              - text: contributors ©
              - link "CARTO" [ref=e290] [cursor=pointer]:
                - /url: https://carto.com/attributions
          - generic [ref=e291]:
            - button "Zoom in" [ref=e292] [cursor=pointer]: +
            - button "Zoom out" [ref=e293] [cursor=pointer]: −
            - button "Fit to Romania" [ref=e294] [cursor=pointer]
          - button "Colour by genre" [ref=e298] [cursor=pointer]
          - generic "Legend" [ref=e303]:
            - generic [ref=e304]: "Dot size: melodies"
            - generic [ref=e305]: "1"
            - generic [ref=e308]: "680"
            - generic [ref=e311]: 1,359
          - link "3 not mapped" [ref=e314] [cursor=pointer]:
            - /url: /?unmapped=1
        - group [ref=e315]:
          - generic "List counties (20)" [ref=e316] [cursor=pointer]
      - region "Results" [ref=e317]:
        - generic [ref=e318]:
          - generic [ref=e319]: 4,072 of 4,072 melodies
          - generic [ref=e320]:
            - generic [ref=e321]:
              - generic [ref=e322]: Sort by
              - combobox "Sort by" [ref=e323]:
                - option "Title" [selected]
                - option "Style"
                - option "Location"
                - option "Year"
                - option "Source number"
              - button "Toggle sort direction" [ref=e324] [cursor=pointer]: ↑
            - button "Export 4,072 melodies as JSON" [ref=e325] [cursor=pointer]: Export JSON
        - list "Results" [ref=e326]:
          - listitem [ref=e327]:
            - link "1. [Ai, Frunză verde, foaie lat'] Poiana (Biharmező) / Bihor, 1909" [ref=e328] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L157-01
              - generic [ref=e329]: 1. [Ai, Frunză verde, foaie lat']
              - generic [ref=e332]:
                - generic [ref=e333]: Poiana (Biharmező) / Bihor,
                - text: "1909"
            - generic [ref=e334]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e335] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L157-01/
                - generic [ref=e336]: L 157
              - generic [ref=e339]:
                - generic "has recording" [ref=e340]
                - generic "has notation" [ref=e345]
          - listitem [ref=e351]:
            - link "1. Bagpipers (1) Feregi (Feresd) / Hunedoara, 1913" [ref=e352] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L123-01-1
              - generic [ref=e353]: 1. Bagpipers (1)
              - generic [ref=e356]:
                - generic [ref=e357]: Feregi (Feresd) / Hunedoara,
                - text: "1913"
            - generic [ref=e358]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e359] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L123-01-1/
                - generic [ref=e360]: L 123
              - generic [ref=e363]:
                - generic "has recording" [ref=e364]
                - generic "has notation" [ref=e369]
          - listitem [ref=e375]:
            - link "1. Bagpipers (2) Câmp (Vaskohmező) / Bihor, 1910" [ref=e376] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L124-01-2
              - generic [ref=e377]: 1. Bagpipers (2)
              - generic [ref=e380]:
                - generic [ref=e381]: Câmp (Vaskohmező) / Bihor,
                - text: "1910"
            - generic [ref=e382]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e383] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L124-01-2/
                - generic [ref=e384]: L 124
              - generic [ref=e387]:
                - generic "has recording" [ref=e388]
                - generic "has notation" [ref=e393]
          - listitem [ref=e399]:
            - link "1. Fekete főd, fehér az én zsebkendőm Chibed (Kibéd) / Mureș, 1906" [ref=e400] [cursor=pointer]:
              - /url: /song/fmbc-BB047-L166-01
              - generic [ref=e401]: 1. Fekete főd, fehér az én zsebkendőm
              - generic [ref=e404]:
                - generic [ref=e405]: Chibed (Kibéd) / Mureș,
                - text: "1906"
            - generic [ref=e406]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e407] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L166-01/
                - generic [ref=e408]: L 166
              - generic [ref=e411]:
                - generic "has recording" [ref=e412]
                - generic "has notation" [ref=e417]
          - listitem [ref=e423]:
            - link "1. Hej, de sokszor megbántottál Suseni (Gyergyóújfalu) / Harghita, 1907" [ref=e424] [cursor=pointer]:
              - /url: /song/fmbc-BB106-L305-01
              - generic [ref=e425]: 1. Hej, de sokszor megbántottál
              - generic [ref=e428]:
                - generic [ref=e429]: Suseni (Gyergyóújfalu) / Harghita,
                - text: "1907"
            - generic [ref=e430]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e431] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L305-01/
                - generic [ref=e432]: L 305
              - generic [ref=e435]:
                - generic "has recording" [ref=e436]
                - generic "has notation" [ref=e441]
          - listitem [ref=e447]:
            - link "1. Nu te supăra, mireasă Delani (Gyalány) / Bihor, 1909" [ref=e448] [cursor=pointer]:
              - /url: /song/fmbc-BB057-L155-01
              - generic [ref=e449]: 1. Nu te supăra, mireasă
              - generic [ref=e452]:
                - generic [ref=e453]: Delani (Gyalány) / Bihor,
                - text: "1909"
            - generic [ref=e454]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e455] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB057-L155-01/
                - generic [ref=e456]: L 155
              - generic [ref=e459]:
                - generic "has recording" [ref=e460]
                - generic "has notation" [ref=e465]
          - listitem [ref=e471]:
            - link "1. Rég megmondtam, bús gerlice Cârța (Csíkkarcfalva) / Harghita, 1907" [ref=e472] [cursor=pointer]:
              - /url: /song/fmbc-BB060-L115-01
              - generic [ref=e473]: 1. Rég megmondtam, bús gerlice
              - generic [ref=e476]:
                - generic [ref=e477]: Cârța (Csíkkarcfalva) / Harghita,
                - text: "1907"
            - generic [ref=e478]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e479] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB060-L115-01/
                - generic [ref=e480]: L 115
              - generic [ref=e483]:
                - generic "has recording" [ref=e484]
                - generic "has notation" [ref=e489]
          - listitem [ref=e495]:
            - link "1. Stick Dance Voiniceni (Mezőszabad) / Mureș, 1912" [ref=e496] [cursor=pointer]:
              - /url: /song/fmbc-BB068-L128-01
              - generic [ref=e497]: 1. Stick Dance
              - generic [ref=e500]:
                - generic [ref=e501]: Voiniceni (Mezőszabad) / Mureș,
                - text: "1912"
            - generic [ref=e502]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e503] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L128-01/
                - generic [ref=e504]: L 128
              - generic [ref=e507]:
                - generic "has recording" [ref=e508]
                - generic "has notation" [ref=e513]
          - listitem [ref=e519]:
            - link "1. Túl vagy, rózsám, túl vagy Suseni (Gyergyóújfalu) / Harghita, 1907" [ref=e520] [cursor=pointer]:
              - /url: /song/fmbc-BB044-L020-01
              - generic [ref=e521]: 1. Túl vagy, rózsám, túl vagy
              - generic [ref=e524]:
                - generic [ref=e525]: Suseni (Gyergyóújfalu) / Harghita,
                - text: "1907"
            - generic [ref=e526]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e527] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB044-L020-01/
                - generic [ref=e528]: L 305
              - generic [ref=e531]:
                - generic "has recording" [ref=e532]
                - generic "has notation" [ref=e537]
          - listitem [ref=e543]:
            - link "2. Bear Dance Oncești (Váncsfalva) / Maramureș, 1913" [ref=e544] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L125-02
              - generic [ref=e545]: 2. Bear Dance
              - generic [ref=e548]:
                - generic [ref=e549]: Oncești (Váncsfalva) / Maramureș,
                - text: "1913"
            - generic [ref=e550]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e551] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L125-02/
                - generic [ref=e552]: L 125
              - generic [ref=e555]:
                - generic "has recording" [ref=e556]
                - generic "has notation" [ref=e561]
          - listitem [ref=e567]:
            - link "2. Belt Dance Igriș (Egres) / Csongrád-Csanád, 1912" [ref=e568] [cursor=pointer]:
              - /url: /song/fmbc-BB068-L129-02
              - generic [ref=e569]: 2. Belt Dance
              - generic [ref=e572]:
                - generic [ref=e573]: Igriș (Egres) / Csongrád-Csanád,
                - text: "1912"
            - generic [ref=e574]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e575] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L129-02/
                - generic [ref=e576]: L 129
              - generic [ref=e579]:
                - generic "has recording" [ref=e580]
                - generic "has notation" [ref=e585]
          - listitem [ref=e591]:
            - link "2. Édesanyám rózsafája Cârța (Csíkkarcfalva) / Harghita, 1907" [ref=e592] [cursor=pointer]:
              - /url: /song/fmbc-BB044-L305-02
              - generic [ref=e593]: 2. Édesanyám rózsafája
              - generic [ref=e596]:
                - generic [ref=e597]: Cârța (Csíkkarcfalva) / Harghita,
                - text: "1907"
            - generic [ref=e598]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e599] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB044-L305-02/
                - generic [ref=e600]: L 20
              - generic "has notation" [ref=e604]
          - listitem [ref=e610]:
            - link "2. Hei, Toată lumea vrea să moru Cociuba-Mare (Alsókocsoba) / Bihor, 1912" [ref=e611] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L158-02
              - generic [ref=e612]: 2. Hei, Toată lumea vrea să moru
              - generic [ref=e615]:
                - generic [ref=e616]: Cociuba-Mare (Alsókocsoba) / Bihor,
                - text: "1912"
            - generic [ref=e617]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e618] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L158-02/
                - generic [ref=e619]: L 158
              - generic [ref=e622]:
                - generic "has recording" [ref=e623]
                - generic "has notation" [ref=e628]
          - listitem [ref=e634]:
            - link "2. Istenem, életem Dealu (Oroszhegy) / Harghita, 1902" [ref=e635] [cursor=pointer]:
              - /url: /song/fmbc-BB106-L306-02
              - generic [ref=e636]: 2. Istenem, életem
              - generic [ref=e639]:
                - generic [ref=e640]: Dealu (Oroszhegy) / Harghita,
                - text: "1902"
            - generic [ref=e641]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e642] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L306-02/
                - generic [ref=e643]: L 306
              - generic [ref=e646]:
                - generic "has recording" [ref=e647]
                - generic "has notation" [ref=e652]
          - listitem [ref=e658]:
            - link "2. Istenem, Istenem, áraszd meg a vizet Rugănești (Rugonfalva) / Harghita, 1902" [ref=e659] [cursor=pointer]:
              - /url: /song/fmbc-BB047-L167-02
              - generic [ref=e660]: 2. Istenem, Istenem, áraszd meg a vizet
              - generic [ref=e663]:
                - generic [ref=e664]: Rugănești (Rugonfalva) / Harghita,
                - text: "1902"
            - generic [ref=e665]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e666] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L167-02/
                - generic [ref=e667]: L 167
              - generic [ref=e670]:
                - generic "has recording" [ref=e671]
                - generic "has notation" [ref=e676]
          - listitem [ref=e682]:
            - link "2. Jaj istenem! kire várok Cârța (Csíkkarcfalva) / Harghita, 1907" [ref=e683] [cursor=pointer]:
              - /url: /song/fmbc-BB060-L116-02
              - generic [ref=e684]: 2. Jaj istenem! kire várok
              - generic [ref=e687]:
                - generic [ref=e688]: Cârța (Csíkkarcfalva) / Harghita,
                - text: "1907"
            - generic [ref=e689]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e690] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB060-L116-02/
                - generic [ref=e691]: L 116
              - generic [ref=e694]:
                - generic "has recording" [ref=e695]
                - generic "has notation" [ref=e700]
          - listitem [ref=e706]:
            - link "2. Măi bădiță, prostule Delani (Gyalány) / Bihor, 1909" [ref=e707] [cursor=pointer]:
              - /url: /song/fmbc-BB057-L156-02
              - generic [ref=e708]: 2. Măi bădiță, prostule
              - generic [ref=e711]:
                - generic [ref=e712]: Delani (Gyalány) / Bihor,
                - text: "1909"
            - generic [ref=e713]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e714] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB057-L156-02/
                - generic [ref=e715]: L 156
              - generic [ref=e718]:
                - generic "has recording" [ref=e719]
                - generic "has notation" [ref=e724]
          - listitem [ref=e730]:
            - link "2. The Wanderer Suseni (Gyergyóújfalu) / Harghita, 1907" [ref=e731] [cursor=pointer]:
              - /url: /song/fmbc-BB099-L259-02
              - generic [ref=e732]: 2. The Wanderer
              - generic [ref=e735]:
                - generic [ref=e736]: Suseni (Gyergyóújfalu) / Harghita,
                - text: "1907"
            - generic [ref=e737]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e738] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB099-L259-02/
                - generic [ref=e739]: L 259
              - generic [ref=e742]:
                - generic "has recording" [ref=e743]
                - generic "has notation" [ref=e748]
          - listitem [ref=e754]:
            - link "3. Asszonyok, asszonyok, had’ legyek társatok Ciumani (Gyergyócsomafalva) / Harghita, 1907" [ref=e755] [cursor=pointer]:
              - /url: /song/fmbc-BB047-L168-03
              - generic [ref=e756]: 3. Asszonyok, asszonyok, had’ legyek társatok
              - generic [ref=e759]:
                - generic [ref=e760]: Ciumani (Gyergyócsomafalva) / Harghita,
                - text: "1907"
            - generic [ref=e761]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e762] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L168-03/
                - generic [ref=e763]: L 168
              - generic [ref=e766]:
                - generic "has recording" [ref=e767]
                - generic "has notation" [ref=e772]
          - listitem [ref=e778]:
            - link "3. Finale (1) Râpa de Sus (Felsőrépa) / Mureș, 1914" [ref=e779] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L126-03-1
              - generic [ref=e780]: 3. Finale (1)
              - generic [ref=e783]:
                - generic [ref=e784]: Râpa de Sus (Felsőrépa) / Mureș,
                - text: "1914"
            - generic [ref=e785]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e786] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L126-03-1/
                - generic [ref=e787]: L 126
              - generic [ref=e790]:
                - generic "has recording" [ref=e791]
                - generic "has notation" [ref=e796]
          - listitem [ref=e802]:
            - link "3. Stamping Dance Igriș (Egres) / Csongrád-Csanád, 1912" [ref=e803] [cursor=pointer]:
              - /url: /song/fmbc-BB068-L130-03
              - generic [ref=e804]: 3. Stamping Dance
              - generic [ref=e807]:
                - generic [ref=e808]: Igriș (Egres) / Csongrád-Csanád,
                - text: "1912"
            - generic [ref=e809]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e810] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L130-03/
                - generic [ref=e811]: L 130
              - generic [ref=e814]:
                - generic "has recording" [ref=e815]
                - generic "has notation" [ref=e820]
          - listitem [ref=e826]:
            - link "3. [Vai de mine, ce să fii] Rogoz (Venterrogoz) / Bihor, 1911" [ref=e827] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L159-03
              - generic [ref=e828]: 3. [Vai de mine, ce să fii]
              - generic [ref=e831]:
                - generic [ref=e832]: Rogoz (Venterrogoz) / Bihor,
                - text: "1911"
            - generic [ref=e833]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e834] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L159-03/
                - generic [ref=e835]: L 159
              - generic [ref=e838]:
                - generic "has recording" [ref=e839]
                - generic "has notation" [ref=e844]
          - listitem [ref=e850]:
            - link "3. Vékony cérna, kemény mag Dornești (Hadikfalva) / Suceava, 1914" [ref=e851] [cursor=pointer]:
              - /url: /song/fmbc-BB106-L307-03
              - generic [ref=e852]: 3. Vékony cérna, kemény mag
              - generic [ref=e855]:
                - generic [ref=e856]: Dornești (Hadikfalva) / Suceava,
                - text: "1914"
            - generic [ref=e857]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e858] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L307-03/
                - generic [ref=e859]: L 307
              - generic [ref=e862]:
                - generic "has recording" [ref=e863]
                - generic "has notation" [ref=e868]
          - listitem [ref=e874]:
            - link "4. Annyi bánat az szűvemen Suseni (Gyergyóújfalu) / Harghita, 1907" [ref=e875] [cursor=pointer]:
              - /url: /song/fmbc-BB047-L169-04
              - generic [ref=e876]: 4. Annyi bánat az szűvemen
              - generic [ref=e879]:
                - generic [ref=e880]: Suseni (Gyergyóújfalu) / Harghita,
                - text: "1907"
            - generic [ref=e881]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e882] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L169-04/
                - generic [ref=e883]: L 169
              - generic [ref=e886]:
                - generic "has recording" [ref=e887]
                - generic "has notation" [ref=e892]
          - listitem [ref=e898]:
            - link "4. [Ciucuri verde de mătasă] Mănăștiur (Temesmonostor) / Arad, 1912" [ref=e899] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L138-04
              - generic [ref=e900]: 4. [Ciucuri verde de mătasă]
              - generic [ref=e903]:
                - generic [ref=e904]: Mănăștiur (Temesmonostor) / Arad,
                - text: "1912"
            - generic [ref=e905]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e906] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L138-04/
                - generic [ref=e907]: L 138
              - generic [ref=e910]:
                - generic "has recording" [ref=e911]
                - generic "has notation" [ref=e916]
          - listitem [ref=e922]:
            - link "4. Dance of Bucium Bistra (Bisztra) / Alba, 1910" [ref=e923] [cursor=pointer]:
              - /url: /song/fmbc-BB068-L131-04
              - generic [ref=e924]: 4. Dance of Bucium
              - generic [ref=e927]:
                - generic [ref=e928]: Bistra (Bisztra) / Alba,
                - text: "1910"
            - generic [ref=e929]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e930] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L131-04/
                - generic [ref=e931]: L 131
              - generic [ref=e934]:
                - generic "has recording" [ref=e935]
                - generic "has notation" [ref=e940]
          - listitem [ref=e946]:
            - link "4. Kilyénfalvi közeptizbe Bezid (Bözöd) / Harghita, 1904" [ref=e947] [cursor=pointer]:
              - /url: /song/fmbc-BB106-L308-04
              - generic [ref=e948]: 4. Kilyénfalvi közeptizbe
              - generic [ref=e951]:
                - generic [ref=e952]: Bezid (Bözöd) / Harghita,
                - text: "1904"
            - generic [ref=e953]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e954] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L308-04/
                - generic [ref=e955]: L 308
              - generic [ref=e958]:
                - generic "has recording" [ref=e959]
                - generic "has notation" [ref=e964]
          - listitem [ref=e970]:
            - link "4. Love Song (2) Joseni (Gyergyóalfalu) / Harghita, 1911" [ref=e971] [cursor=pointer]:
              - /url: /song/fmbc-BB099-L262-04-2
              - generic [ref=e972]: 4. Love Song (2)
              - generic [ref=e975]:
                - generic [ref=e976]: Joseni (Gyergyóalfalu) / Harghita,
                - text: "1911"
            - generic [ref=e977]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e978] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB099-L262-04-2/
                - generic [ref=e979]: L 262
              - generic [ref=e982]:
                - generic "has recording" [ref=e983]
                - generic "has notation" [ref=e988]
          - listitem [ref=e994]:
            - link "5. [Fă mă Doamne, ce mii face] Murani (Temesmurány) / Timiș, 1912" [ref=e995] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L160-05
              - generic [ref=e996]: 5. [Fă mă Doamne, ce mii face]
              - generic [ref=e999]:
                - generic [ref=e1000]: Murani (Temesmurány) / Timiș,
                - text: "1912"
            - generic [ref=e1001]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1002] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L160-05/
                - generic [ref=e1003]: L 160
              - generic [ref=e1006]:
                - generic "has recording" [ref=e1007]
                - generic "has notation" [ref=e1012]
          - listitem [ref=e1018]:
            - link "5. Ha kimegyek arr’ a magos tetőre (1) Cârța (Csíkkarcfalva) / Harghita, 1907" [ref=e1019] [cursor=pointer]:
              - /url: /song/fmbc-BB047-L170-05-1
              - generic [ref=e1020]: 5. Ha kimegyek arr’ a magos tetőre (1)
              - generic [ref=e1023]:
                - generic [ref=e1024]: Cârța (Csíkkarcfalva) / Harghita,
                - text: "1907"
            - generic [ref=e1025]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1026] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L170-05-1/
                - generic [ref=e1027]: L 170
              - generic [ref=e1030]:
                - generic "has recording" [ref=e1031]
                - generic "has notation" [ref=e1036]
          - listitem [ref=e1042]:
            - link "5. Ha kimegyek arr’ a magos tetőre (2) Valea Strâmbă (Tekerőpatak) / Harghita, 1907" [ref=e1043] [cursor=pointer]:
              - /url: /song/fmbc-BB047-L170-05-2
              - generic [ref=e1044]: 5. Ha kimegyek arr’ a magos tetőre (2)
              - generic [ref=e1047]:
                - generic [ref=e1048]: Valea Strâmbă (Tekerőpatak) / Harghita,
                - text: "1907"
            - generic [ref=e1049]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1050] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L170-05-2/
                - generic [ref=e1051]: L 170
              - generic [ref=e1054]:
                - generic "has recording" [ref=e1055]
                - generic "has notation" [ref=e1060]
          - listitem [ref=e1066]:
            - link "5. Romanian Polka Beiuș (Belényes) / Bihor, 1910" [ref=e1067] [cursor=pointer]:
              - /url: /song/fmbc-BB068-L132-05
              - generic [ref=e1068]: 5. Romanian Polka
              - generic [ref=e1071]:
                - generic [ref=e1072]: Beiuș (Belényes) / Bihor,
                - text: "1910"
            - generic [ref=e1073]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1074] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L132-05/
                - generic [ref=e1075]: L 132
              - generic [ref=e1078]:
                - generic "has recording" [ref=e1079]
                - generic "has notation" [ref=e1084]
          - listitem [ref=e1090]:
            - link "5. Vékony cérna, kemény mag Dornești (Hadikfalva) / Suceava, 1914" [ref=e1091] [cursor=pointer]:
              - /url: /song/fmbc-BB106-L307-05
              - generic [ref=e1092]: 5. Vékony cérna, kemény mag
              - generic [ref=e1095]:
                - generic [ref=e1096]: Dornești (Hadikfalva) / Suceava,
                - text: "1914"
            - generic [ref=e1097]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1098] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L307-05/
                - generic [ref=e1099]: L 307
              - generic [ref=e1102]:
                - generic "has recording" [ref=e1103]
                - generic "has notation" [ref=e1108]
          - listitem [ref=e1114]:
            - link "6. Allegro moderato, molto capriccioso [Jaj istenem, ezt a vént] Ghimeș-Făget (Csíkgyimes) / Harghita, 1904" [ref=e1115] [cursor=pointer]:
              - /url: /song/fmbc-BB083-L205-06
              - generic [ref=e1116]: 6. Allegro moderato, molto capriccioso [Jaj istenem, ezt a vént]
              - generic [ref=e1119]:
                - generic [ref=e1120]: Ghimeș-Făget (Csíkgyimes) / Harghita,
                - text: "1904"
            - generic [ref=e1121]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1122] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB083-L205-06/
                - generic [ref=e1123]: L 205
              - generic [ref=e1126]:
                - generic "has recording" [ref=e1127]
                - generic "has notation" [ref=e1132]
          - listitem [ref=e1138]:
            - link "6. Járjad pap a táncot Mănăstireni (Magyargyerőmonostor) / Cluj, 1910" [ref=e1139] [cursor=pointer]:
              - /url: /song/fmbc-BB106-L309-06
              - generic [ref=e1140]: 6. Járjad pap a táncot
              - generic [ref=e1143]:
                - generic [ref=e1144]: Mănăstireni (Magyargyerőmonostor) / Cluj,
                - text: "1910"
            - generic [ref=e1145]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1146] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB106-L309-06/
                - generic [ref=e1147]: L 309
              - generic [ref=e1150]:
                - generic "has recording" [ref=e1151]
                - generic "has notation" [ref=e1156]
          - listitem [ref=e1162]:
            - link "6. Până fusei la maica, măi Budureasa (Bondoraszó) / Bihor, 1909" [ref=e1163] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L161-06
              - generic [ref=e1164]: 6. Până fusei la maica, măi
              - generic [ref=e1167]:
                - generic [ref=e1168]: Budureasa (Bondoraszó) / Bihor,
                - text: "1909"
            - generic [ref=e1169]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1170] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L161-06/
                - generic [ref=e1171]: L 161
              - generic [ref=e1174]:
                - generic "has recording" [ref=e1175]
                - generic "has notation" [ref=e1180]
          - listitem [ref=e1186]:
            - link "6. Quick Dance (1) Beiuș (Belényes) / Bihor, 1910" [ref=e1187] [cursor=pointer]:
              - /url: /song/fmbc-BB068-L133-06-1
              - generic [ref=e1188]: 6. Quick Dance (1)
              - generic [ref=e1191]:
                - generic [ref=e1192]: Beiuș (Belényes) / Bihor,
                - text: "1910"
            - generic [ref=e1193]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1194] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L133-06-1/
                - generic [ref=e1195]: L 133
              - generic [ref=e1198]:
                - generic "has recording" [ref=e1199]
                - generic "has notation" [ref=e1204]
          - listitem [ref=e1210]:
            - link "6. Quick Dance (2) Poiana Vadului (Neagra) / Alba, 1910" [ref=e1211] [cursor=pointer]:
              - /url: /song/fmbc-BB068-L134-06-2
              - generic [ref=e1212]: 6. Quick Dance (2)
              - generic [ref=e1215]:
                - generic [ref=e1216]: Poiana Vadului (Neagra) / Alba,
                - text: "1910"
            - generic [ref=e1217]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1218] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L134-06-2/
                - generic [ref=e1219]: L 134
              - generic [ref=e1222]:
                - generic "has recording" [ref=e1223]
                - generic "has notation" [ref=e1228]
          - listitem [ref=e1234]:
            - link "6. Töltik a nagy erdő útját Văcăreşti (Csíkvacsárcsi) / Harghita, 1907" [ref=e1235] [cursor=pointer]:
              - /url: /song/fmbc-BB047-L171-06
              - generic [ref=e1236]: 6. Töltik a nagy erdő útját
              - generic [ref=e1239]:
                - generic [ref=e1240]: Văcăreşti (Csíkvacsárcsi) / Harghita,
                - text: "1907"
            - generic [ref=e1241]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1242] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L171-06/
                - generic [ref=e1243]: L 171
              - generic [ref=e1246]:
                - generic "has recording" [ref=e1247]
                - generic "has notation" [ref=e1252]
          - listitem [ref=e1258]:
            - link "7. Eddig való dolgom a tavaszi szántás Vălenii (Székelyvaja) / Mureș, 1914" [ref=e1259] [cursor=pointer]:
              - /url: /song/fmbc-BB047-L172-07
              - generic [ref=e1260]: 7. Eddig való dolgom a tavaszi szántás
              - generic [ref=e1263]:
                - generic [ref=e1264]: Vălenii (Székelyvaja) / Mureș,
                - text: "1914"
            - generic [ref=e1265]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1266] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L172-07/
                - generic [ref=e1267]: L 172
              - generic [ref=e1270]:
                - generic "has recording" [ref=e1271]
                - generic "has notation" [ref=e1276]
          - listitem [ref=e1282]:
            - link "7. Frunză verde, foaie fragă Groşi (Tőtös) / Bihor, 1912" [ref=e1283] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L162-07
              - generic [ref=e1284]: 7. Frunză verde, foaie fragă
              - generic [ref=e1287]:
                - generic [ref=e1288]: Groşi (Tőtös) / Bihor,
                - text: "1912"
            - generic [ref=e1289]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1290] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L162-07/
                - generic [ref=e1291]: L 162
              - generic [ref=e1294]:
                - generic "has recording" [ref=e1295]
                - generic "has notation" [ref=e1300]
          - listitem [ref=e1306]:
            - link "7. Sostenuto, rubato [Beli fiam beli] Polonița (Lengyelfalva) / Harghita, 1903" [ref=e1307] [cursor=pointer]:
              - /url: /song/fmbc-BB083-L206-07
              - generic [ref=e1308]: 7. Sostenuto, rubato [Beli fiam beli]
              - generic [ref=e1311]:
                - generic [ref=e1312]: Polonița (Lengyelfalva) / Harghita,
                - text: "1903"
            - generic [ref=e1313]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1314] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB083-L206-07/
                - generic [ref=e1315]: L 206
              - generic [ref=e1318]:
                - generic "has recording" [ref=e1319]
                - generic "has notation" [ref=e1324]
          - listitem [ref=e1330]:
            - link "7. Száraz ágtól messze virít a rózsa Chibed (Kibéd) / Mureș, 1904" [ref=e1331] [cursor=pointer]:
              - /url: /song/fmbc-BB042-L010-07
              - generic [ref=e1332]: 7. Száraz ágtól messze virít a rózsa
              - generic [ref=e1335]:
                - generic [ref=e1336]: Chibed (Kibéd) / Mureș,
                - text: "1904"
            - generic [ref=e1337]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1338] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB042-L010-07/
                - generic [ref=e1339]: L 10
              - generic "has notation" [ref=e1343]
          - listitem [ref=e1349]:
            - link "8. Allegro [Télen nem jó szántani] Dioșod (Diósad) / Sălaj, 1914" [ref=e1350] [cursor=pointer]:
              - /url: /song/fmbc-BB083-L207-08
              - generic [ref=e1351]: 8. Allegro [Télen nem jó szántani]
              - generic [ref=e1354]:
                - generic [ref=e1355]: Dioșod (Diósad) / Sălaj,
                - text: "1914"
            - generic [ref=e1356]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1357] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB083-L207-08/
                - generic [ref=e1358]: L 207
              - generic [ref=e1361]:
                - generic "has recording" [ref=e1362]
                - generic "has notation" [ref=e1367]
          - listitem [ref=e1373]:
            - link "8. Atâtea gânduri îmi vinu Cotiglet (Kótliget) / Bihor, 1912" [ref=e1374] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L163-08
              - generic [ref=e1375]: 8. Atâtea gânduri îmi vinu
              - generic [ref=e1378]:
                - generic [ref=e1379]: Cotiglet (Kótliget) / Bihor,
                - text: "1912"
            - generic [ref=e1380]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1381] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L163-08/
                - generic [ref=e1382]: L 163
              - generic [ref=e1385]:
                - generic "has recording" [ref=e1386]
                - generic "has notation" [ref=e1391]
          - listitem [ref=e1397]:
            - link "8. Olvad a hó, csárdás kis angyalom Văcăreşti (Csíkvacsárcsi) / Harghita, 1907" [ref=e1398] [cursor=pointer]:
              - /url: /song/fmbc-BB047-L173-08
              - generic [ref=e1399]: 8. Olvad a hó, csárdás kis angyalom
              - generic [ref=e1402]:
                - generic [ref=e1403]: Văcăreşti (Csíkvacsárcsi) / Harghita,
                - text: "1907"
            - generic [ref=e1404]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1405] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB047-L173-08/
                - generic [ref=e1406]: L 173
              - generic [ref=e1409]:
                - generic "has recording" [ref=e1410]
                - generic "has notation" [ref=e1415]
          - listitem [ref=e1421]:
            - link "9. Cine n'are noroc n'are Hotărel (Határ) / Bihor, 1909" [ref=e1422] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L164-09
              - generic [ref=e1423]: 9. Cine n'are noroc n'are
              - generic [ref=e1426]:
                - generic [ref=e1427]: Hotărel (Határ) / Bihor,
                - text: "1909"
            - generic [ref=e1428]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1429] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L164-09/
                - generic [ref=e1430]: L 164
              - generic [ref=e1433]:
                - generic "has recording" [ref=e1434]
                - generic "has notation" [ref=e1439]
          - listitem [ref=e1445]:
            - link "9. Még azt mondják Chibed (Kibéd) / Mureș, 1904" [ref=e1446] [cursor=pointer]:
              - /url: /song/fmbc-BB043-L019-09
              - generic [ref=e1447]: 9. Még azt mondják
              - generic [ref=e1450]:
                - generic [ref=e1451]: Chibed (Kibéd) / Mureș,
                - text: "1904"
            - generic [ref=e1452]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e1453] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB043-L019-09/
                - generic [ref=e1454]: L 19
              - generic [ref=e1457]:
                - generic "has recording" [ref=e1458]
                - generic "has notation" [ref=e1463]
          - listitem [ref=e1469]:
            - link "„100 liba egy sorba” – clarinet Căpâlnița (Kápolnásfalu) / Harghita, 1903" [ref=e1470] [cursor=pointer]:
              - /url: /song/bsys-82-13152
              - generic [ref=e1471]: „100 liba egy sorba” – clarinet
              - generic [ref=e1474]:
                - generic [ref=e1475]: Căpâlnița (Kápolnásfalu) / Harghita,
                - text: "1903"
            - link "Open original record on The Bartók System" [ref=e1477] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/82/13152
              - generic [ref=e1478]: F 63
          - listitem [ref=e1481]:
            - link "a 134. Ai Jos la ta - - fleasca, Curtecap (Körtekapu) / Mureș, 1914" [ref=e1482] [cursor=pointer]:
              - /url: /song/rfm-4-73nn
              - generic [ref=e1483]: a 134. Ai Jos la ta - - fleasca,
              - generic [ref=e1486]:
                - generic [ref=e1487]: Curtecap (Körtekapu) / Mureș,
                - text: "1914"
            - generic [ref=e1488]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=e1489] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n176
                - generic [ref=e1490]: F. 1355 c)
              - generic "has notation" [ref=e1494]
        - navigation "Results pages" [ref=e1500]:
          - button "Previous page" [disabled] [ref=e1501]: ←
          - generic [ref=e1502]:
            - generic [ref=e1503]: Go to page
            - spinbutton "Go to page" [ref=e1504]: "1"
          - generic [ref=e1505]: Page 1 of 82
          - button "Next page" [ref=e1506] [cursor=pointer]: →
  - status "Query status" [ref=e1507]:
    - code [ref=e1508]: /
    - button "Copy link" [ref=e1509] [cursor=pointer]
    - generic [ref=e1510]: 4,072 of 4,072 melodies, 3 not mapped
    - button "Export 4,072 melodies as JSON" [ref=e1511] [cursor=pointer]: Export JSON
  - contentinfo [ref=e1512]:
    - paragraph [ref=e1513]:
      - text: "Data: HUN-REN BTK Institute for Musicology, Budapest (Bartok Archives):"
      - generic [ref=e1514]:
        - text: "\""
        - link "Folk Music in Bartók's Compositions" [ref=e1515] [cursor=pointer]:
          - /url: https://bartok-nepzene.zti.hu/en/
        - text: "\""
      - generic [ref=e1516]:
        - text: ", \""
        - link "The Bartók System" [ref=e1517] [cursor=pointer]:
          - /url: https://systems.zti.hu/br/en
        - text: "\""
      - generic [ref=e1518]:
        - text: and "
        - link "Béla Bartók, the Ethnomusicologist" [ref=e1519] [cursor=pointer]:
          - /url: https://bartok-gyujtesek.zti.hu/en
        - text: "\""
      - text: .
    - paragraph [ref=e1520]: Records, notation images and recordings remain the property of the Institute; this viewer is an independent interface and is not affiliated with it.
    - paragraph [ref=e1521]:
      - text: "Printed edition: Bela Bartok, Rumanian Folk Music (ed. Benjamin Suchoff, Martinus Nijhoff, 1967-1975),"
      - link "open volumes on the Internet Archive" [ref=e1522] [cursor=pointer]:
        - /url: https://archive.org/details/rumanianfolkmusi0004blab
      - text: ; only facts and incipits are indexed.
    - paragraph [ref=e1523]:
      - text: "Map: ©"
      - link "OpenStreetMap" [ref=e1524] [cursor=pointer]:
        - /url: https://www.openstreetmap.org/copyright
      - text: contributors, ©
      - link "CARTO" [ref=e1525] [cursor=pointer]:
        - /url: https://carto.com/attributions
      - text: ". County boundaries: Natural Earth."
    - paragraph [ref=e1526]:
      - link "About and sources" [ref=e1527] [cursor=pointer]:
        - /url: /about
  - status
```

# Test source

```ts
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
> 123 |     await bihor.hover()
      |                 ^ Error: locator.hover: Test timeout of 90000ms exceeded.
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