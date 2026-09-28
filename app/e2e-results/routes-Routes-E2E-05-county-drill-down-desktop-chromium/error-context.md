# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: routes.spec.ts >> Routes >> E2E-05 county drill-down
- Location: e2e/routes.spec.ts:7:3

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "Aleșd (Lelesd)location uncertain"

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Skip to results" [ref=e3] [cursor=pointer]:
    - /url: "#results"
  - banner [ref=e4]:
    - link "Bartok / Romania" [ref=e5] [cursor=pointer]:
      - /url: /?county=ro/crisana/bihor
    - navigation "Primary" [ref=e6]:
      - link "Explorer" [ref=e7] [cursor=pointer]:
        - /url: /?county=ro/crisana/bihor
      - link "Journeys" [ref=e8] [cursor=pointer]:
        - /url: /journeys?county=ro/crisana/bihor
      - link "About and sources" [ref=e9] [cursor=pointer]:
        - /url: /about?county=ro/crisana/bihor
    - searchbox "Search melodies" [ref=e12]
    - generic [ref=e13]:
      - generic [ref=e14]: Theme
      - combobox "Theme" [ref=e15]:
        - option "Auto" [selected]
        - option "Light"
        - option "Dark"
  - main [ref=e16]:
    - navigation "Breadcrumb" [ref=e17]:
      - list [ref=e18]:
        - listitem [ref=e19]:
          - link "Romania" [ref=e20] [cursor=pointer]:
            - /url: /
          - generic [aria-hidden] [ref=e21]: ›
        - listitem [ref=e22]:
          - link "Crișana" [ref=e23] [cursor=pointer]:
            - /url: /?region=ro/crisana
          - generic [aria-hidden] [ref=e24]: ›
        - listitem [ref=e25]:
          - generic [ref=e26]: Bihor (Bihar)
    - generic [ref=e27]:
      - heading "Bihor (Bihar)" [level=1] [ref=e28]:
        - generic [ref=e29]:
          - text: Bihor
          - generic [ref=e30]: (Bihar)
      - paragraph [ref=e31]: Crișana / Romania
      - paragraph [ref=e32]: Bihar (then) -> Bihor, Romania (now)
      - generic [ref=e33]:
        - generic [ref=e34]:
          - definition [ref=e35]: "436"
          - term [ref=e36]: melodies
        - generic [ref=e37]:
          - definition [ref=e38]: "28"
          - term [ref=e39]: villages
        - generic [ref=e40]:
          - definition [ref=e41]: "102"
          - term [ref=e42]: performers
        - generic [ref=e43]:
          - definition [ref=e44]: 1909-1918
          - term [ref=e45]: years
        - generic [ref=e46]:
          - definition [ref=e47]: "93"
          - term [ref=e48]: with recording
        - generic [ref=e49]:
          - definition [ref=e50]: "325"
          - term [ref=e51]: with notation
      - 'img "Genres: 103 colindă / winter carol" [ref=e53]':
        - 'generic "colindă / winter carol: 103" [ref=e55]'
      - generic [ref=e56]:
        - link "View in explorer" [ref=e57] [cursor=pointer]:
          - /url: /?county=ro/crisana/bihor
        - button "Copy link" [ref=e58] [cursor=pointer]
        - button "Export 436 melodies as JSON" [ref=e59] [cursor=pointer]: Export county JSON
    - table [ref=e61]:
      - caption [ref=e62]: Villages in Bihor, 28
      - rowgroup [ref=e63]:
        - row [ref=e64]:
          - columnheader [ref=e65]:
            - button "Sort by Village" [ref=e66] [cursor=pointer]: Village
          - columnheader [ref=e67]:
            - button "Sort by Melodies" [active] [ref=e68] [cursor=pointer]: Melodies ↑
          - columnheader "Genres" [ref=e69]
          - columnheader [ref=e70]:
            - button "Sort by Years" [ref=e71] [cursor=pointer]: Years
      - rowgroup [ref=e72]:
        - row [ref=e73] [cursor=pointer]:
          - cell [ref=e74]:
            - button "Filter to Aleșd (Lelesd)" [ref=e75]:
              - generic [ref=e76]:
                - text: Aleșd
                - generic [ref=e77]: (Lelesd)
                - text: location uncertain
          - cell "1" [ref=e78]
          - cell [ref=e79]:
            - 'img "Genres: 1 colindă / winter carol" [ref=e80]':
              - 'generic "colindă / winter carol: 1" [ref=e82]'
          - cell "1909" [ref=e83]
        - row [ref=e84] [cursor=pointer]:
          - cell [ref=e85]:
            - button "Filter to Căbești" [ref=e86]:
              - generic [ref=e87]: Căbeștilocation uncertain
          - cell "1" [ref=e88]
          - cell [ref=e89]:
            - 'img "Genres: 1 colindă / winter carol" [ref=e90]':
              - 'generic "colindă / winter carol: 1" [ref=e92]'
          - cell "1914" [ref=e93]
        - row [ref=e94] [cursor=pointer]:
          - cell [ref=e95]:
            - button "Filter to Hotărel (Határ)" [ref=e96]:
              - generic [ref=e97]:
                - text: Hotărel
                - generic [ref=e98]: (Határ)
          - cell "1" [ref=e99]
          - cell [ref=e100]:
            - img "no genre" [ref=e101]
          - cell "1909" [ref=e103]
        - row [ref=e104] [cursor=pointer]:
          - cell [ref=e105]:
            - button "Filter to Leheceni" [ref=e106]:
              - generic [ref=e107]: Lehecenilocation uncertain
          - cell "1" [ref=e108]
          - cell [ref=e109]:
            - 'img "Genres: 1 colindă / winter carol" [ref=e110]':
              - 'generic "colindă / winter carol: 1" [ref=e112]'
          - cell "1909" [ref=e113]
        - row [ref=e114] [cursor=pointer]:
          - cell [ref=e115]:
            - button "Filter to Poiana (Biharmező)" [ref=e116]:
              - generic [ref=e117]:
                - text: Poiana
                - generic [ref=e118]: (Biharmező)
          - cell "1" [ref=e119]
          - cell [ref=e120]:
            - img "no genre" [ref=e121]
          - cell "1909" [ref=e123]
        - row [ref=e124] [cursor=pointer]:
          - cell [ref=e125]:
            - button "Filter to Samsbleat" [ref=e126]:
              - generic [ref=e127]: Samsbleatnot mapped
          - cell "1" [ref=e128]
          - cell [ref=e129]:
            - 'img "Genres: 1 colindă / winter carol" [ref=e130]':
              - 'generic "colindă / winter carol: 1" [ref=e132]'
          - cell "1911" [ref=e133]
        - row [ref=e134] [cursor=pointer]:
          - cell [ref=e135]:
            - button "Filter to Sâmbășag" [ref=e136]:
              - generic [ref=e137]: Sâmbășaglocation uncertain
          - cell "1" [ref=e138]
          - cell [ref=e139]:
            - 'img "Genres: 1 colindă / winter carol" [ref=e140]':
              - 'generic "colindă / winter carol: 1" [ref=e142]'
          - cell "1911" [ref=e143]
        - row [ref=e144] [cursor=pointer]:
          - cell [ref=e145]:
            - button "Filter to Câmp (Vaskohmező)" [ref=e146]:
              - generic [ref=e147]:
                - text: Câmp
                - generic [ref=e148]: (Vaskohmező)
          - cell "3" [ref=e149]
          - cell [ref=e150]:
            - 'img "Genres: 2 colindă / winter carol" [ref=e151]':
              - 'generic "colindă / winter carol: 2" [ref=e153]'
          - cell "1910" [ref=e154]
        - row [ref=e155] [cursor=pointer]:
          - cell [ref=e156]:
            - button "Filter to Cociuba-Mare (Alsókocsoba)" [ref=e157]:
              - generic [ref=e158]:
                - text: Cociuba-Mare
                - generic [ref=e159]: (Alsókocsoba)
          - cell "3" [ref=e160]
          - cell [ref=e161]:
            - 'img "Genres: 2 colindă / winter carol" [ref=e162]':
              - 'generic "colindă / winter carol: 2" [ref=e164]'
          - cell "1912" [ref=e165]
        - row [ref=e166] [cursor=pointer]:
          - cell [ref=e167]:
            - button "Filter to Corbești (Corbesd)" [ref=e168]:
              - generic [ref=e169]:
                - text: Corbești
                - generic [ref=e170]: (Corbesd)
                - text: location uncertain
          - cell "3" [ref=e171]
          - cell [ref=e172]:
            - 'img "Genres: 3 colindă / winter carol" [ref=e173]':
              - 'generic "colindă / winter carol: 3" [ref=e175]'
          - cell "1911" [ref=e176]
        - row [ref=e177] [cursor=pointer]:
          - cell [ref=e178]:
            - button "Filter to Sebiș" [ref=e179]:
              - generic [ref=e180]: Sebișnot mapped
          - cell "3" [ref=e181]
          - cell [ref=e182]:
            - 'img "Genres: 3 colindă / winter carol" [ref=e183]':
              - 'generic "colindă / winter carol: 3" [ref=e185]'
          - cell "1909" [ref=e186]
        - row [ref=e187] [cursor=pointer]:
          - cell [ref=e188]:
            - button "Filter to Vașcău" [ref=e189]:
              - generic [ref=e190]: Vașcăulocation uncertain
          - cell "3" [ref=e191]
          - cell [ref=e192]:
            - 'img "Genres: 3 colindă / winter carol" [ref=e193]':
              - 'generic "colindă / winter carol: 3" [ref=e195]'
          - cell "1910" [ref=e196]
        - row [ref=e197] [cursor=pointer]:
          - cell [ref=e198]:
            - button "Filter to Bulz" [ref=e199]:
              - generic [ref=e200]: Bulzlocation uncertain
          - cell "4" [ref=e201]
          - cell [ref=e202]:
            - 'img "Genres: 4 colindă / winter carol" [ref=e203]':
              - 'generic "colindă / winter carol: 4" [ref=e205]'
          - cell "1912" [ref=e206]
        - row [ref=e207] [cursor=pointer]:
          - cell [ref=e208]:
            - button "Filter to Beiuș (Belényes)" [ref=e209]:
              - generic [ref=e210]:
                - text: Beiuș
                - generic [ref=e211]: (Belényes)
          - cell "5" [ref=e212]
          - cell [ref=e213]:
            - 'img "Genres: 3 colindă / winter carol" [ref=e214]':
              - 'generic "colindă / winter carol: 3" [ref=e216]'
          - cell "1910" [ref=e217]
        - row [ref=e218] [cursor=pointer]:
          - cell [ref=e219]:
            - button "Filter to Budureasa (Bondoraszó)" [ref=e220]:
              - generic [ref=e221]:
                - text: Budureasa
                - generic [ref=e222]: (Bondoraszó)
          - cell "5" [ref=e223]
          - cell [ref=e224]:
            - 'img "Genres: 4 colindă / winter carol" [ref=e225]':
              - 'generic "colindă / winter carol: 4" [ref=e227]'
          - cell "1909" [ref=e228]
        - row [ref=e229] [cursor=pointer]:
          - cell [ref=e230]:
            - button "Filter to Delani (Gyalány)" [ref=e231]:
              - generic [ref=e232]:
                - text: Delani
                - generic [ref=e233]: (Gyalány)
          - cell "5" [ref=e234]
          - cell [ref=e235]:
            - 'img "Genres: 3 colindă / winter carol" [ref=e236]':
              - 'generic "colindă / winter carol: 3" [ref=e238]'
          - cell "1909" [ref=e239]
        - row [ref=e240] [cursor=pointer]:
          - cell [ref=e241]:
            - button "Filter to Tășad (Tdsad)" [ref=e242]:
              - generic [ref=e243]:
                - text: Tășad
                - generic [ref=e244]: (Tdsad)
                - text: location uncertain
          - cell "5" [ref=e245]
          - cell [ref=e246]:
            - 'img "Genres: 5 colindă / winter carol" [ref=e247]':
              - 'generic "colindă / winter carol: 5" [ref=e249]'
          - cell "1911 +n.d." [ref=e250]:
            - text: "1911"
            - generic [ref=e251]: +n.d.
        - row [ref=e252] [cursor=pointer]:
          - cell [ref=e253]:
            - button "Filter to Luncșoara" [ref=e254]:
              - generic [ref=e255]: Luncșoaralocation uncertain
          - cell "6" [ref=e256]
          - cell [ref=e257]:
            - 'img "Genres: 6 colindă / winter carol" [ref=e258]':
              - 'generic "colindă / winter carol: 6" [ref=e260]'
          - cell "1912" [ref=e261]
        - row [ref=e262] [cursor=pointer]:
          - cell [ref=e263]:
            - button "Filter to Drăgănești (Dragesti)" [ref=e264]:
              - generic [ref=e265]:
                - text: Drăgănești
                - generic [ref=e266]: (Dragesti)
                - text: location uncertain
          - cell "7" [ref=e267]
          - cell [ref=e268]:
            - 'img "Genres: 7 colindă / winter carol" [ref=e269]':
              - 'generic "colindă / winter carol: 7" [ref=e271]'
          - cell "1911 +n.d." [ref=e272]:
            - text: "1911"
            - generic [ref=e273]: +n.d.
        - row [ref=e274] [cursor=pointer]:
          - cell [ref=e275]:
            - button "Filter to Dumbrăvița de Codru (Havasdombró)" [ref=e276]:
              - generic [ref=e277]:
                - text: Dumbrăvița de Codru
                - generic [ref=e278]: (Havasdombró)
          - cell "7" [ref=e279]
          - cell [ref=e280]:
            - 'img "Genres: 6 colindă / winter carol" [ref=e281]':
              - 'generic "colindă / winter carol: 6" [ref=e283]'
          - cell "1914" [ref=e284]
        - row [ref=e285] [cursor=pointer]:
          - cell [ref=e286]:
            - button "Filter to Groşi (Tőtös)" [ref=e287]:
              - generic [ref=e288]:
                - text: Groşi
                - generic [ref=e289]: (Tőtös)
          - cell "7" [ref=e290]
          - cell [ref=e291]:
            - 'img "Genres: 6 colindă / winter carol" [ref=e292]':
              - 'generic "colindă / winter carol: 6" [ref=e294]'
          - cell "1912" [ref=e295]
        - row [ref=e296] [cursor=pointer]:
          - cell [ref=e297]:
            - button "Filter to Urviș de Beiuș (Urvis)" [ref=e298]:
              - generic [ref=e299]:
                - text: Urviș de Beiuș
                - generic [ref=e300]: (Urvis)
                - text: location uncertain
          - cell "7" [ref=e301]
          - cell [ref=e302]:
            - 'img "Genres: 7 colindă / winter carol" [ref=e303]':
              - 'generic "colindă / winter carol: 7" [ref=e305]'
          - cell "1914-1916" [ref=e306]
        - row [ref=e307] [cursor=pointer]:
          - cell [ref=e308]:
            - button "Filter to Rogoz (Venterrogoz)" [ref=e309]:
              - generic [ref=e310]:
                - text: Rogoz
                - generic [ref=e311]: (Venterrogoz)
          - cell "9" [ref=e312]
          - cell [ref=e313]:
            - 'img "Genres: 7 colindă / winter carol" [ref=e314]':
              - 'generic "colindă / winter carol: 7" [ref=e316]'
          - cell "1911 +n.d." [ref=e317]:
            - text: "1911"
            - generic [ref=e318]: +n.d.
        - row [ref=e319] [cursor=pointer]:
          - cell [ref=e320]:
            - button "Filter to Șoimi" [ref=e321]:
              - generic [ref=e322]: Șoimilocation uncertain
          - cell "9" [ref=e323]
          - cell [ref=e324]:
            - 'img "Genres: 9 colindă / winter carol" [ref=e325]':
              - 'generic "colindă / winter carol: 9" [ref=e327]'
          - cell "1914" [ref=e328]
        - row [ref=e329] [cursor=pointer]:
          - cell [ref=e330]:
            - button "Filter to Cotiglet (Kótliget)" [ref=e331]:
              - generic [ref=e332]:
                - text: Cotiglet
                - generic [ref=e333]: (Kótliget)
          - cell "16" [ref=e334]
          - cell [ref=e335]:
            - 'img "Genres: 15 colindă / winter carol" [ref=e336]':
              - 'generic "colindă / winter carol: 15" [ref=e338]'
          - cell "1911-1912 +n.d." [ref=e339]:
            - text: 1911-1912
            - generic [ref=e340]: +n.d.
        - row [ref=e341] [cursor=pointer]:
          - cell [ref=e342]:
            - button "Filter to Ginta (Gyanta)" [ref=e343]:
              - generic [ref=e344]:
                - text: Ginta
                - generic [ref=e345]: (Gyanta)
                - text: location uncertain
          - cell "17" [ref=e346]
          - cell [ref=e347]:
            - 'img "Genres: 3 colindă / winter carol" [ref=e348]':
              - 'generic "colindă / winter carol: 3" [ref=e350]'
          - cell "1912 +n.d." [ref=e351]:
            - text: "1912"
            - generic [ref=e352]: +n.d.
        - row [ref=e353] [cursor=pointer]:
          - cell [ref=e354]:
            - button "Filter to Tărcaia (Köröstárkány)" [ref=e355]:
              - generic [ref=e356]:
                - text: Tărcaia
                - generic [ref=e357]: (Köröstárkány)
                - text: location uncertain
          - cell "35" [ref=e358]
          - cell [ref=e359]:
            - img "no genre" [ref=e360]
          - cell "1912 +n.d." [ref=e362]:
            - text: "1912"
            - generic [ref=e363]: +n.d.
        - row [ref=e364] [cursor=pointer]:
          - cell [ref=e365]:
            - button "Filter to Salonta (Nagyszalonta)" [ref=e366]:
              - generic [ref=e367]:
                - text: Salonta
                - generic [ref=e368]: (Nagyszalonta)
                - text: location uncertain
          - cell "270" [ref=e369]
          - cell [ref=e370]:
            - img "no genre" [ref=e371]
          - cell "1916-1918 +n.d." [ref=e373]:
            - text: 1916-1918
            - generic [ref=e374]: +n.d.
    - generic [ref=e375]:
      - tablist "Bihor (Bihar)" [ref=e376]:
        - tab "Melodies" [selected] [ref=e377] [cursor=pointer]
        - tab "By genre" [ref=e378] [cursor=pointer]
        - tab "By performer" [ref=e379] [cursor=pointer]
        - tab "Timeline" [ref=e380] [cursor=pointer]
        - tab "Local map" [ref=e381] [cursor=pointer]
      - tabpanel "Melodies" [ref=e382]:
        - generic [ref=e383]:
          - generic [ref=e384]: 436 of 4,072 melodies
          - generic [ref=e385]:
            - generic [ref=e386]:
              - generic [ref=e387]: Sort by
              - combobox "Sort by" [ref=e388]:
                - option "Title" [selected]
                - option "Style"
                - option "Location"
                - option "Year"
                - option "Source number"
              - button "Toggle sort direction" [ref=e389] [cursor=pointer]: ↑
            - button "Export 436 melodies as JSON" [ref=e390] [cursor=pointer]: Export JSON
          - generic "Active filters" [ref=e392]:
            - 'button "Remove filter: Bihor (Bihar)" [ref=e393] [cursor=pointer]':
              - generic [ref=e394]: Bihor (Bihar)
              - generic [aria-hidden] [ref=e395]: ×
            - button "Clear all filters" [ref=e396] [cursor=pointer]
        - list "Results" [ref=e397]:
          - listitem [ref=e398]:
            - link "1. [Ai, Frunză verde, foaie lat'] Poiana (Biharmező) / Bihor, 1909" [ref=e399] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L157-01?county=ro/crisana/bihor
              - generic [ref=e400]: 1. [Ai, Frunză verde, foaie lat']
              - generic [ref=e403]:
                - generic [ref=e404]: Poiana (Biharmező) / Bihor,
                - text: "1909"
            - generic [ref=e405]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e406] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L157-01/
                - generic [ref=e407]: L 157
              - generic [ref=e410]:
                - generic "has recording" [ref=e411]
                - generic "has notation" [ref=e416]
          - listitem [ref=e422]:
            - link "1. Bagpipers (2) Câmp (Vaskohmező) / Bihor, 1910" [ref=e423] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L124-01-2?county=ro/crisana/bihor
              - generic [ref=e424]: 1. Bagpipers (2)
              - generic [ref=e427]:
                - generic [ref=e428]: Câmp (Vaskohmező) / Bihor,
                - text: "1910"
            - generic [ref=e429]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e430] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L124-01-2/
                - generic [ref=e431]: L 124
              - generic [ref=e434]:
                - generic "has recording" [ref=e435]
                - generic "has notation" [ref=e440]
          - listitem [ref=e446]:
            - link "1. Nu te supăra, mireasă Delani (Gyalány) / Bihor, 1909" [ref=e447] [cursor=pointer]:
              - /url: /song/fmbc-BB057-L155-01?county=ro/crisana/bihor
              - generic [ref=e448]: 1. Nu te supăra, mireasă
              - generic [ref=e451]:
                - generic [ref=e452]: Delani (Gyalány) / Bihor,
                - text: "1909"
            - generic [ref=e453]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e454] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB057-L155-01/
                - generic [ref=e455]: L 155
              - generic [ref=e458]:
                - generic "has recording" [ref=e459]
                - generic "has notation" [ref=e464]
          - listitem [ref=e470]:
            - link "2. Hei, Toată lumea vrea să moru Cociuba-Mare (Alsókocsoba) / Bihor, 1912" [ref=e471] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L158-02?county=ro/crisana/bihor
              - generic [ref=e472]: 2. Hei, Toată lumea vrea să moru
              - generic [ref=e475]:
                - generic [ref=e476]: Cociuba-Mare (Alsókocsoba) / Bihor,
                - text: "1912"
            - generic [ref=e477]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e478] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L158-02/
                - generic [ref=e479]: L 158
              - generic [ref=e482]:
                - generic "has recording" [ref=e483]
                - generic "has notation" [ref=e488]
          - listitem [ref=e494]:
            - link "2. Măi bădiță, prostule Delani (Gyalány) / Bihor, 1909" [ref=e495] [cursor=pointer]:
              - /url: /song/fmbc-BB057-L156-02?county=ro/crisana/bihor
              - generic [ref=e496]: 2. Măi bădiță, prostule
              - generic [ref=e499]:
                - generic [ref=e500]: Delani (Gyalány) / Bihor,
                - text: "1909"
            - generic [ref=e501]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e502] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB057-L156-02/
                - generic [ref=e503]: L 156
              - generic [ref=e506]:
                - generic "has recording" [ref=e507]
                - generic "has notation" [ref=e512]
          - listitem [ref=e518]:
            - link "3. [Vai de mine, ce să fii] Rogoz (Venterrogoz) / Bihor, 1911" [ref=e519] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L159-03?county=ro/crisana/bihor
              - generic [ref=e520]: 3. [Vai de mine, ce să fii]
              - generic [ref=e523]:
                - generic [ref=e524]: Rogoz (Venterrogoz) / Bihor,
                - text: "1911"
            - generic [ref=e525]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e526] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L159-03/
                - generic [ref=e527]: L 159
              - generic [ref=e530]:
                - generic "has recording" [ref=e531]
                - generic "has notation" [ref=e536]
          - listitem [ref=e542]:
            - link "5. Romanian Polka Beiuș (Belényes) / Bihor, 1910" [ref=e543] [cursor=pointer]:
              - /url: /song/fmbc-BB068-L132-05?county=ro/crisana/bihor
              - generic [ref=e544]: 5. Romanian Polka
              - generic [ref=e547]:
                - generic [ref=e548]: Beiuș (Belényes) / Bihor,
                - text: "1910"
            - generic [ref=e549]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e550] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L132-05/
                - generic [ref=e551]: L 132
              - generic [ref=e554]:
                - generic "has recording" [ref=e555]
                - generic "has notation" [ref=e560]
          - listitem [ref=e566]:
            - link "6. Până fusei la maica, măi Budureasa (Bondoraszó) / Bihor, 1909" [ref=e567] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L161-06?county=ro/crisana/bihor
              - generic [ref=e568]: 6. Până fusei la maica, măi
              - generic [ref=e571]:
                - generic [ref=e572]: Budureasa (Bondoraszó) / Bihor,
                - text: "1909"
            - generic [ref=e573]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e574] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L161-06/
                - generic [ref=e575]: L 161
              - generic [ref=e578]:
                - generic "has recording" [ref=e579]
                - generic "has notation" [ref=e584]
          - listitem [ref=e590]:
            - link "6. Quick Dance (1) Beiuș (Belényes) / Bihor, 1910" [ref=e591] [cursor=pointer]:
              - /url: /song/fmbc-BB068-L133-06-1?county=ro/crisana/bihor
              - generic [ref=e592]: 6. Quick Dance (1)
              - generic [ref=e595]:
                - generic [ref=e596]: Beiuș (Belényes) / Bihor,
                - text: "1910"
            - generic [ref=e597]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e598] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L133-06-1/
                - generic [ref=e599]: L 133
              - generic [ref=e602]:
                - generic "has recording" [ref=e603]
                - generic "has notation" [ref=e608]
          - listitem [ref=e614]:
            - link "7. Frunză verde, foaie fragă Groşi (Tőtös) / Bihor, 1912" [ref=e615] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L162-07?county=ro/crisana/bihor
              - generic [ref=e616]: 7. Frunză verde, foaie fragă
              - generic [ref=e619]:
                - generic [ref=e620]: Groşi (Tőtös) / Bihor,
                - text: "1912"
            - generic [ref=e621]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e622] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L162-07/
                - generic [ref=e623]: L 162
              - generic [ref=e626]:
                - generic "has recording" [ref=e627]
                - generic "has notation" [ref=e632]
          - listitem [ref=e638]:
            - link "8. Atâtea gânduri îmi vinu Cotiglet (Kótliget) / Bihor, 1912" [ref=e639] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L163-08?county=ro/crisana/bihor
              - generic [ref=e640]: 8. Atâtea gânduri îmi vinu
              - generic [ref=e643]:
                - generic [ref=e644]: Cotiglet (Kótliget) / Bihor,
                - text: "1912"
            - generic [ref=e645]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e646] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L163-08/
                - generic [ref=e647]: L 163
              - generic [ref=e650]:
                - generic "has recording" [ref=e651]
                - generic "has notation" [ref=e656]
          - listitem [ref=e662]:
            - link "9. Cine n'are noroc n'are Hotărel (Határ) / Bihor, 1909" [ref=e663] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L164-09?county=ro/crisana/bihor
              - generic [ref=e664]: 9. Cine n'are noroc n'are
              - generic [ref=e667]:
                - generic [ref=e668]: Hotărel (Határ) / Bihor,
                - text: "1909"
            - generic [ref=e669]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=e670] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L164-09/
                - generic [ref=e671]: L 164
              - generic [ref=e674]:
                - generic "has recording" [ref=e675]
                - generic "has notation" [ref=e680]
          - listitem [ref=e686]:
            - link "Ábécédé, hová mész, hé? Salonta (Nagyszalonta) / Bihor, 1916" [ref=e687] [cursor=pointer]:
              - /url: /song/bsys-10-12599?county=ro/crisana/bihor
              - generic [ref=e688]: Ábécédé, hová mész, hé?
              - generic [ref=e691]:
                - generic [ref=e692]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=e693]:
              - link "Open original record on The Bartók System" [ref=e694] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/10/12599
                - generic [ref=e695]: C 1035d
              - generic "has notation" [ref=e699]
          - listitem [ref=e705]:
            - link "A búzába a disznó, csak a farka látszik Salonta (Nagyszalonta) / Bihor, 1916" [ref=e706] [cursor=pointer]:
              - /url: /song/bsys-20-3641?county=ro/crisana/bihor
              - generic [ref=e707]: A búzába a disznó, csak a farka látszik
              - generic [ref=e710]:
                - generic [ref=e711]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=e712]:
              - link "Open original record on The Bartók System" [ref=e713] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/20/3641
                - generic [ref=e714]: A 1163g
              - generic [ref=e717]:
                - generic "has recording" [ref=e718]
                - generic "has notation" [ref=e723]
          - listitem [ref=e729]:
            - link "Addig megyek míg a szememmel látok Salonta (Nagyszalonta) / Bihor, 1916" [ref=e730] [cursor=pointer]:
              - /url: /song/bsys-34-8083?county=ro/crisana/bihor
              - generic [ref=e731]: Addig megyek míg a szememmel látok
              - generic [ref=e734]:
                - generic [ref=e735]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=e736]:
              - link "Open original record on The Bartók System" [ref=e737] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/34/8083
                - generic [ref=e738]: B 986f
              - generic "has notation" [ref=e742]
          - listitem [ref=e748]:
            - link "ae SES (5 Be ae e+ as el ee Se! Rogoz (Venterrogoz) / Bihor, 1911" [ref=e749] [cursor=pointer]:
              - /url: /song/rfm-4-131?county=ro/crisana/bihor
              - generic [ref=e750]: ae SES (5 Be ae e+ as el ee Se!
              - generic [ref=e753]:
                - generic [ref=e754]: Rogoz (Venterrogoz) / Bihor,
                - text: "1911"
            - generic [ref=e755]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=e756] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n230
                - generic [ref=e757]: M.F. 1904 a)
              - generic "has notation" [ref=e761]
          - listitem [ref=e767]:
            - link "aes su’dumbra cieriului, Corinde, Urviș de Beiuș (Urvis) / Bihor, 1914" [ref=e768] [cursor=pointer]:
              - /url: /song/rfm-4-71g?county=ro/crisana/bihor
              - generic [ref=e769]: aes su’dumbra cieriului, Corinde,
              - generic [ref=e772]:
                - generic [ref=e773]: Urviș de Beiuș (Urvis) / Bihor,
                - text: "1914"
            - generic [ref=e774]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=e775] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n161
                - generic [ref=e776]: F. 1192 c)
              - generic "has notation" [ref=e780]
          - listitem [ref=e786]:
            - link "A fekete halom alatt Tărcaia (Köröstárkány) / Bihor, 1912" [ref=e787] [cursor=pointer]:
              - /url: /song/bsys-15-1948?county=ro/crisana/bihor
              - generic [ref=e788]: A fekete halom alatt
              - generic [ref=e791]:
                - generic [ref=e792]: Tărcaia (Köröstárkány) / Bihor,
                - text: "1912"
            - generic [ref=e793]:
              - link "Open original record on The Bartók System" [ref=e794] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/15/1948
                - generic [ref=e795]: A 640
              - generic [ref=e798]:
                - generic "has recording" [ref=e799]
                - generic "has notation" [ref=e804]
          - listitem [ref=e810]:
            - link "A gőzösnek hat kereke Salonta (Nagyszalonta) / Bihor, 1916" [ref=e811] [cursor=pointer]:
              - /url: /song/bsys-15-2000?county=ro/crisana/bihor
              - generic [ref=e812]: A gőzösnek hat kereke
              - generic [ref=e815]:
                - generic [ref=e816]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=e817]:
              - link "Open original record on The Bartók System" [ref=e818] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/15/2000
                - generic [ref=e819]: A 647o
              - generic "has notation" [ref=e823]
          - listitem [ref=e829]:
            - link "A, Grdj&sjTatal Dumiezeu, Leruj; Doamie! Groşi (Tőtös) / Bihor, 1912" [ref=e830] [cursor=pointer]:
              - /url: /song/rfm-4-57a?county=ro/crisana/bihor
              - generic [ref=e831]: A, Grdj&sjTatal Dumiezeu, Leruj; Doamie!
              - generic [ref=e834]:
                - generic [ref=e835]: Groşi (Tőtös) / Bihor,
                - text: "1912"
            - generic [ref=e836]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=e837] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n137
                - generic [ref=e838]: M.F. 1998 c)
              - generic "has notation" [ref=e842]
          - listitem [ref=e848]:
            - link "A gúnárom fekete Salonta (Nagyszalonta) / Bihor, 1917" [ref=e849] [cursor=pointer]:
              - /url: /song/bsys-14-1133?county=ro/crisana/bihor
              - generic [ref=e850]: A gúnárom fekete
              - generic [ref=e853]:
                - generic [ref=e854]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=e855]:
              - link "Open original record on The Bartók System" [ref=e856] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/14/1133
                - generic [ref=e857]: A 402j(1)
              - generic "has notation" [ref=e861]
          - listitem [ref=e867]:
            - link "aH Sareea eee er eta Cociuba-Mare (Alsókocsoba) / Bihor, 1912" [ref=e868] [cursor=pointer]:
              - /url: /song/rfm-4-21y?county=ro/crisana/bihor
              - generic [ref=e869]: aH Sareea eee er eta
              - generic [ref=e872]:
                - generic [ref=e873]: Cociuba-Mare (Alsókocsoba) / Bihor,
                - text: "1912"
            - generic [ref=e874]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=e875] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n118
                - generic [ref=e876]: M.F. 1965 b)
              - generic "has notation" [ref=e880]
          - listitem [ref=e886]:
            - link "Aki ötöt, hatot szeret, nem szeret az igazán Salonta (Nagyszalonta) / Bihor, 1916" [ref=e887] [cursor=pointer]:
              - /url: /song/bsys-37-9307?county=ro/crisana/bihor
              - generic [ref=e888]: Aki ötöt, hatot szeret, nem szeret az igazán
              - generic [ref=e891]:
                - generic [ref=e892]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - link "Open original record on The Bartók System" [ref=e894] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/37/9307
              - generic [ref=e895]: B 1392m
          - listitem [ref=e898]:
            - link "A kisasszony Pozsonyba, krinolinba Salonta (Nagyszalonta) / Bihor, 1916" [ref=e899] [cursor=pointer]:
              - /url: /song/bsys-73-12082?county=ro/crisana/bihor
              - generic [ref=e900]: A kisasszony Pozsonyba, krinolinba
              - generic [ref=e903]:
                - generic [ref=e904]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - link "Open original record on The Bartók System" [ref=e906] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/73/12082
              - generic [ref=e907]: C 835d(1)
          - listitem [ref=e910]:
            - link "A közkórház körös-körül kavicsos Salonta (Nagyszalonta) / Bihor, 1917" [ref=e911] [cursor=pointer]:
              - /url: /song/bsys-25-4898?county=ro/crisana/bihor
              - generic [ref=e912]: A közkórház körös-körül kavicsos
              - generic [ref=e915]:
                - generic [ref=e916]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=e917]:
              - link "Open original record on The Bartók System" [ref=e918] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/25/4898
                - generic [ref=e919]: A 1527b
              - generic "has notation" [ref=e923]
          - listitem [ref=e929]:
            - link "Által úsztam a Dunán, által furulyáztam Tărcaia (Köröstárkány) / Bihor, 1912" [ref=e930] [cursor=pointer]:
              - /url: /song/bsys-20-3459?county=ro/crisana/bihor
              - generic [ref=e931]: Által úsztam a Dunán, által furulyáztam
              - generic [ref=e934]:
                - generic [ref=e935]: Tărcaia (Köröstárkány) / Bihor,
                - text: "1912"
            - generic [ref=e936]:
              - link "Open original record on The Bartók System" [ref=e937] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/20/3459
                - generic [ref=e938]: A 1115b
              - generic [ref=e941]:
                - generic "has recording" [ref=e942]
                - generic "has notation" [ref=e947]
          - listitem [ref=e953]:
            - link "Amoda ég egy piros tűz magában Salonta (Nagyszalonta) / Bihor, 1917" [ref=e954] [cursor=pointer]:
              - /url: /song/bsys-25-4678?county=ro/crisana/bihor
              - generic [ref=e955]: Amoda ég egy piros tűz magában
              - generic [ref=e958]:
                - generic [ref=e959]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=e960]:
              - link "Open original record on The Bartók System" [ref=e961] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/25/4678
                - generic [ref=e962]: A 1479e
              - generic "has notation" [ref=e966]
          - listitem [ref=e972]:
            - link "Amoda ég egy piros tűz magában Salonta (Nagyszalonta) / Bihor, 1917" [ref=e973] [cursor=pointer]:
              - /url: /song/bsys-25-4679?county=ro/crisana/bihor
              - generic [ref=e974]: Amoda ég egy piros tűz magában
              - generic [ref=e977]:
                - generic [ref=e978]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=e979]:
              - link "Open original record on The Bartók System" [ref=e980] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/25/4679
                - generic [ref=e981]: A 1479f
              - generic "has notation" [ref=e985]
          - listitem [ref=e991]:
            - link "Amoda egy bokor mellett Salonta (Nagyszalonta) / Bihor, 1917" [ref=e992] [cursor=pointer]:
              - /url: /song/bsys-15-1730?county=ro/crisana/bihor
              - generic [ref=e993]: Amoda egy bokor mellett
              - generic [ref=e996]:
                - generic [ref=e997]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=e998]:
              - link "Open original record on The Bartók System" [ref=e999] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/15/1730
                - generic [ref=e1000]: A 577d(1)
              - generic [ref=e1003]:
                - generic "has recording" [ref=e1004]
                - generic "has notation" [ref=e1009]
          - listitem [ref=e1015]:
            - link "Amoda megy egy szép leány, korót visz a karján Salonta (Nagyszalonta) / Bihor, 1916" [ref=e1016] [cursor=pointer]:
              - /url: /song/bsys-37-8716?county=ro/crisana/bihor
              - generic [ref=e1017]: Amoda megy egy szép leány, korót visz a karján
              - generic [ref=e1020]:
                - generic [ref=e1021]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - link "Open original record on The Bartók System" [ref=e1023] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/37/8716
              - generic [ref=e1024]: B 1202a
          - listitem [ref=e1027]:
            - link "Amoda van egy kis fehér csárda Salonta (Nagyszalonta) / Bihor, 1916" [ref=e1028] [cursor=pointer]:
              - /url: /song/bsys-33-6478?county=ro/crisana/bihor
              - generic [ref=e1029]: Amoda van egy kis fehér csárda
              - generic [ref=e1032]:
                - generic [ref=e1033]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=e1034]:
              - link "Open original record on The Bartók System" [ref=e1035] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/33/6478
                - generic [ref=e1036]: B 413a
              - generic "has notation" [ref=e1040]
          - listitem [ref=e1046]:
            - link "A nagy utcán véges-véges-végig Salonta (Nagyszalonta) / Bihor, 1916" [ref=e1047] [cursor=pointer]:
              - /url: /song/bsys-33-6200?county=ro/crisana/bihor
              - generic [ref=e1048]: A nagy utcán véges-véges-végig
              - generic [ref=e1051]:
                - generic [ref=e1052]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=e1053]:
              - link "Open original record on The Bartók System" [ref=e1054] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/33/6200
                - generic [ref=e1055]: B 335d
              - generic "has notation" [ref=e1059]
          - listitem [ref=e1065]:
            - link "a sa maf - - ca, du = Luncșoara / Bihor, 1912" [ref=e1066] [cursor=pointer]:
              - /url: /song/rfm-4-73p?county=ro/crisana/bihor
              - generic [ref=e1067]: a sa maf - - ca, du =
              - generic [ref=e1070]:
                - generic [ref=e1071]: Luncșoara / Bihor,
                - text: "1912"
            - generic [ref=e1072]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=e1073] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n167
                - generic [ref=e1074]: M.F. 2000 b)
              - generic "has notation" [ref=e1078]
          - listitem [ref=e1084]:
            - link "A Si Mariej faté buna, Dvimineata Bulz / Bihor, 1912" [ref=e1085] [cursor=pointer]:
              - /url: /song/rfm-4-95b?county=ro/crisana/bihor
              - generic [ref=e1086]: A Si Mariej faté buna, Dvimineata
              - generic [ref=e1089]:
                - generic [ref=e1090]: Bulz / Bihor,
                - text: "1912"
            - generic [ref=e1091]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=e1092] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n194
                - generic [ref=e1093]: M.F. 2013 b)
              - generic "has notation" [ref=e1097]
          - listitem [ref=e1103]:
            - link "A szebeni kapuba kiállott egy kislányka Salonta (Nagyszalonta) / Bihor, 1917" [ref=e1104] [cursor=pointer]:
              - /url: /song/bsys-10-12647?county=ro/crisana/bihor
              - generic [ref=e1105]: A szebeni kapuba kiállott egy kislányka
              - generic [ref=e1108]:
                - generic [ref=e1109]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=e1110]:
              - link "Open original record on The Bartók System" [ref=e1111] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/10/12647
                - generic [ref=e1112]: C 1053b
              - generic "has notation" [ref=e1116]
          - listitem [ref=e1122]:
            - link "A szegénység ütött nálam tanyát Salonta (Nagyszalonta) / Bihor, 1917" [ref=e1123] [cursor=pointer]:
              - /url: /song/bsys-33-6116?county=ro/crisana/bihor
              - generic [ref=e1124]: A szegénység ütött nálam tanyát
              - generic [ref=e1127]:
                - generic [ref=e1128]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=e1129]:
              - link "Open original record on The Bartók System" [ref=e1130] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/33/6116
                - generic [ref=e1131]: B 300b
              - generic "has notation" [ref=e1135]
          - listitem [ref=e1141]:
            - link "Asztalom, asztalom, szép kerek asztalom Salonta (Nagyszalonta) / Bihor, 1916" [ref=e1142] [cursor=pointer]:
              - /url: /song/bsys-35-8295?county=ro/crisana/bihor
              - generic [ref=e1143]: Asztalom, asztalom, szép kerek asztalom
              - generic [ref=e1146]:
                - generic [ref=e1147]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - link "Open original record on The Bartók System" [ref=e1149] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/35/8295
              - generic [ref=e1150]: B 1050b
          - listitem [ref=e1153]:
            - link "A temető kapujába Salonta (Nagyszalonta) / Bihor, 1917" [ref=e1154] [cursor=pointer]:
              - /url: /song/bsys-15-1183?county=ro/crisana/bihor
              - generic [ref=e1155]: A temető kapujába
              - generic [ref=e1158]:
                - generic [ref=e1159]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=e1160]:
              - link "Open original record on The Bartók System" [ref=e1161] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/15/1183
                - generic [ref=e1162]: A 418c
              - generic [ref=e1165]:
                - generic "has recording" [ref=e1166]
                - generic "has notation" [ref=e1171]
          - listitem [ref=e1177]:
            - link "A temető kapujában Salonta (Nagyszalonta) / Bihor, 1916" [ref=e1178] [cursor=pointer]:
              - /url: /song/bsys-15-2104?county=ro/crisana/bihor
              - generic [ref=e1179]: A temető kapujában
              - generic [ref=e1182]:
                - generic [ref=e1183]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=e1184]:
              - link "Open original record on The Bartók System" [ref=e1185] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/15/2104
                - generic [ref=e1186]: A 680c
              - generic "has notation" [ref=e1190]
          - listitem [ref=e1196]:
            - link "Atyafi, atyafi, atyafi Salonta (Nagyszalonta) / Bihor, 1917" [ref=e1197] [cursor=pointer]:
              - /url: /song/bsys-32-5914?county=ro/crisana/bihor
              - generic [ref=e1198]: Atyafi, atyafi, atyafi
              - generic [ref=e1201]:
                - generic [ref=e1202]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=e1203]:
              - link "Open original record on The Bartók System" [ref=e1204] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/32/5914
                - generic [ref=e1205]: B 248g
              - generic "has notation" [ref=e1209]
          - listitem [ref=e1215]:
            - link "Az a bajom, besorozott a német Salonta (Nagyszalonta) / Bihor, 1916" [ref=e1216] [cursor=pointer]:
              - /url: /song/bsys-25-4814?county=ro/crisana/bihor
              - generic [ref=e1217]: Az a bajom, besorozott a német
              - generic [ref=e1220]:
                - generic [ref=e1221]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=e1222]:
              - link "Open original record on The Bartók System" [ref=e1223] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/25/4814
                - generic [ref=e1224]: A 1490h
              - generic [ref=e1227]:
                - generic "has recording" [ref=e1228]
                - generic "has notation" [ref=e1233]
          - listitem [ref=e1239]:
            - link "Az én házam talpa Ginta (Gyanta) / Bihor, 1912" [ref=e1240] [cursor=pointer]:
              - /url: /song/bsys-13-175?county=ro/crisana/bihor
              - generic [ref=e1241]: Az én házam talpa
              - generic [ref=e1244]:
                - generic [ref=e1245]: Ginta (Gyanta) / Bihor,
                - text: "1912"
            - generic [ref=e1246]:
              - link "Open original record on The Bartók System" [ref=e1247] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/13/175
                - generic [ref=e1248]: A 65a
              - generic [ref=e1251]:
                - generic "has recording" [ref=e1252]
                - generic "has notation" [ref=e1257]
          - listitem [ref=e1263]:
            - link "Az én libám fekete Tărcaia (Köröstárkány) / Bihor, 1912" [ref=e1264] [cursor=pointer]:
              - /url: /song/bsys-14-986?county=ro/crisana/bihor
              - generic [ref=e1265]: Az én libám fekete
              - generic [ref=e1268]:
                - generic [ref=e1269]: Tărcaia (Köröstárkány) / Bihor,
                - text: "1912"
            - generic [ref=e1270]:
              - link "Open original record on The Bartók System" [ref=e1271] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/14/986
                - generic [ref=e1272]: A 335
              - generic [ref=e1275]:
                - generic "has recording" [ref=e1276]
                - generic "has notation" [ref=e1281]
          - listitem [ref=e1287]:
            - link "Az idén, az idén Ginta (Gyanta) / Bihor, 1912" [ref=e1288] [cursor=pointer]:
              - /url: /song/bsys-45-10353?county=ro/crisana/bihor
              - generic [ref=e1289]: Az idén, az idén
              - generic [ref=e1292]:
                - generic [ref=e1293]: Ginta (Gyanta) / Bihor,
                - text: "1912"
            - generic [ref=e1294]:
              - link "Open original record on The Bartók System" [ref=e1295] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/45/10353
                - generic [ref=e1296]: C 136b
              - generic [ref=e1299]:
                - generic "has recording" [ref=e1300]
                - generic "has notation" [ref=e1305]
          - listitem [ref=e1311]:
            - link "Az ökör a földet nem magának szántja Salonta (Nagyszalonta) / Bihor, 1916" [ref=e1312] [cursor=pointer]:
              - /url: /song/bsys-35-8233?county=ro/crisana/bihor
              - generic [ref=e1313]: Az ökör a földet nem magának szántja
              - generic [ref=e1316]:
                - generic [ref=e1317]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - link "Open original record on The Bartók System" [ref=e1319] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/35/8233
              - generic [ref=e1320]: B 1035
          - listitem [ref=e1323]:
            - link "„Az ökör a földet [nem magának szántja]” – tambourine Salonta (Nagyszalonta) / Bihor, 1916" [ref=e1324] [cursor=pointer]:
              - /url: /song/bsys-82-13131?county=ro/crisana/bihor
              - generic [ref=e1325]: „Az ökör a földet [nem magának szántja]” – tambourine
              - generic [ref=e1328]:
                - generic [ref=e1329]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - link "Open original record on The Bartók System" [ref=e1331] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/82/13131
              - generic [ref=e1332]: F 42
          - listitem [ref=e1335]:
            - link "Az orosi gulyásbojtár Salonta (Nagyszalonta) / Bihor, 1917" [ref=e1336] [cursor=pointer]:
              - /url: /song/bsys-31-5599?county=ro/crisana/bihor
              - generic [ref=e1337]: Az orosi gulyásbojtár
              - generic [ref=e1340]:
                - generic [ref=e1341]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=e1342]:
              - link "Open original record on The Bartók System" [ref=e1343] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/31/5599
                - generic [ref=e1344]: B 145
              - generic "has notation" [ref=e1348]
          - listitem [ref=e1354]:
            - link "Az orosi halom alatt Salonta (Nagyszalonta) / Bihor, 1917" [ref=e1355] [cursor=pointer]:
              - /url: /song/bsys-15-1424?county=ro/crisana/bihor
              - generic [ref=e1356]: Az orosi halom alatt
              - generic [ref=e1359]:
                - generic [ref=e1360]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=e1361]:
              - link "Open original record on The Bartók System" [ref=e1362] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/15/1424
                - generic [ref=e1363]: A 499b
              - generic [ref=e1366]:
                - generic "has recording" [ref=e1367]
                - generic "has notation" [ref=e1372]
          - listitem [ref=e1378]:
            - link "Az orosi pusztáról fúj a szél Salonta (Nagyszalonta) / Bihor, 1917" [ref=e1379] [cursor=pointer]:
              - /url: /song/bsys-17-2915?county=ro/crisana/bihor
              - generic [ref=e1380]: Az orosi pusztáról fúj a szél
              - generic [ref=e1383]:
                - generic [ref=e1384]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=e1385]:
              - link "Open original record on The Bartók System" [ref=e1386] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/17/2915
                - generic [ref=e1387]: A 978b
              - generic [ref=e1390]:
                - generic "has recording" [ref=e1391]
                - generic "has notation" [ref=e1396]
          - listitem [ref=e1402]:
            - link "Azt a keserves mindenét az apádnak, mit mondtál Salonta (Nagyszalonta) / Bihor, 1917" [ref=e1403] [cursor=pointer]:
              - /url: /song/bsys-51-10509?county=ro/crisana/bihor
              - generic [ref=e1404]: Azt a keserves mindenét az apádnak, mit mondtál
              - generic [ref=e1407]:
                - generic [ref=e1408]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - link "Open original record on The Bartók System" [ref=e1410] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/51/10509
              - generic [ref=e1411]: C 204c
        - navigation "Results pages" [ref=e1414]:
          - button "Previous page" [disabled] [ref=e1415]: ←
          - generic [ref=e1416]:
            - generic [ref=e1417]: Go to page
            - spinbutton "Go to page" [ref=e1418]: "1"
          - generic [ref=e1419]: Page 1 of 9
          - button "Next page" [ref=e1420] [cursor=pointer]: →
  - status "Query status" [ref=e1421]:
    - code [ref=e1422]: "?county=ro/crisana/bihor"
    - button "Copy link" [ref=e1423] [cursor=pointer]
    - generic [ref=e1424]: 436 of 4,072 melodies, 4 not mapped
    - button "Export 436 melodies as JSON" [ref=e1425] [cursor=pointer]: Export JSON
  - contentinfo [ref=e1426]:
    - paragraph [ref=e1427]:
      - text: "Data: HUN-REN BTK Institute for Musicology, Budapest (Bartok Archives):"
      - generic [ref=e1428]:
        - text: "\""
        - link "Folk Music in Bartók's Compositions" [ref=e1429] [cursor=pointer]:
          - /url: https://bartok-nepzene.zti.hu/en/
        - text: "\""
      - generic [ref=e1430]:
        - text: ", \""
        - link "The Bartók System" [ref=e1431] [cursor=pointer]:
          - /url: https://systems.zti.hu/br/en
        - text: "\""
      - generic [ref=e1432]:
        - text: and "
        - link "Béla Bartók, the Ethnomusicologist" [ref=e1433] [cursor=pointer]:
          - /url: https://bartok-gyujtesek.zti.hu/en
        - text: "\""
      - text: .
    - paragraph [ref=e1434]: Records, notation images and recordings remain the property of the Institute; this viewer is an independent interface and is not affiliated with it.
    - paragraph [ref=e1435]:
      - text: "Printed edition: Bela Bartok, Rumanian Folk Music (ed. Benjamin Suchoff, Martinus Nijhoff, 1967-1975),"
      - link "open volumes on the Internet Archive" [ref=e1436] [cursor=pointer]:
        - /url: https://archive.org/details/rumanianfolkmusi0004blab
      - text: ; only facts and incipits are indexed.
    - paragraph [ref=e1437]:
      - text: "Map: ©"
      - link "OpenStreetMap" [ref=e1438] [cursor=pointer]:
        - /url: https://www.openstreetmap.org/copyright
      - text: contributors, ©
      - link "CARTO" [ref=e1439] [cursor=pointer]:
        - /url: https://carto.com/attributions
      - text: ". County boundaries: Natural Earth."
    - paragraph [ref=e1440]:
      - link "About and sources" [ref=e1441] [cursor=pointer]:
        - /url: /about
  - status
```

# Test source

```ts
  1   | // Route-level journeys: E2E-05 county, E2E-06 song, E2E-07 prev/next, E2E-11 404s, E2E-12 loading
  2   | // and error, E2E-14 console cleanliness, E2E-15 source links, E2E-16 journeys.
  3   | // Song / county / journeys specs mark themselves fixme while the route still renders the stub.
  4   | import { expect, gotoApp, isStub, query, readCount, seededSample, test, waitForCatalog } from './fixtures'
  5   | 
  6   | test.describe('Routes', () => {
  7   |   test('E2E-05 county drill-down', async ({ page, data }) => {
  8   |     const bihor = data.countyId('Bihor')
  9   |     await gotoApp(page, `/?county=${bihor}`)
  10  |     await page.getByRole('link', { name: 'Open county page' }).first().click()
  11  |     await expect(page).toHaveURL(new RegExp(`/county/${bihor}`))
  12  |     await expect(page.locator('h1')).toContainText('Bihor')
  13  |     test.fixme(await isStub(page), '/county is still a stub: villages table, tabs and sorting not implemented yet')
  14  |     const table = page.getByRole('table').first()
  15  |     await expect(table).toBeVisible()
  16  |     const names = await table.locator('tbody tr td:first-child').allTextContents()
  17  |     expect(names.length).toBeGreaterThan(1)
  18  |     await table.getByRole('button', { name: /Sort by Melodies/ }).click()
> 19  |     await expect.poll(() => table.locator('tbody tr td:first-child').first().textContent()).not.toBe(names[0])
      |                                                                                                 ^ Error: expect(received).not.toBe(expected) // Object.is equality
  20  |     await page.getByRole('tab', { name: 'By genre' }).click()
  21  |     await expect.poll(() => query(page).get('tab')).toBe('genre')
  22  |     await page.goBack()
  23  |     await page.goBack()
  24  |     await waitForCatalog(page)
  25  |     await expect.poll(() => query(page).get('county')).toBe(bihor)
  26  |   })
  27  | 
  28  |   test('E2E-06 song record: notation, audio, raw JSON, source link, attribution', async ({ page, data }) => {
  29  |     const song = data.song((s) => s.media.notation.length > 0 && s.media.audio.length > 0 && !!s.source.url)
  30  |     await page.goto(`/song/${song.id}`)
  31  |     await expect(page.locator('h1')).toBeVisible()
  32  |     // source link and footer are already in the stub (AC-33, AC-36)
  33  |     const source = page.locator('.source-link').first()
  34  |     await expect(source).toHaveAttribute('href', song.source.url ?? '')
  35  |     await expect(source).toHaveAttribute('target', '_blank')
  36  |     await expect(source).toHaveAttribute('rel', /noopener/)
  37  |     await expect(page.getByRole('contentinfo')).toContainText('HUN-REN BTK Institute for Musicology')
  38  |     test.fixme(await isStub(page), '/song is still a stub: notation image, audio player and Raw JSON tab not implemented yet')
  39  |     const notation = page.getByRole('img', { name: /Notation/ }).first()
  40  |     await expect(notation).toBeVisible()
  41  |     await expect(page.locator('audio[controls]')).toHaveCount(song.media.audio.length)
  42  |     await page.getByRole('tab', { name: 'Raw JSON' }).click()
  43  |     await expect(page.locator('pre, code').filter({ hasText: `"id": "${song.id}"` }).first()).toBeVisible()
  44  |   })
  45  | 
  46  |   test('E2E-07 prev / next within the filtered set', async ({ page, data }) => {
  47  |     const arad = data.countyId('Arad')
  48  |     await gotoApp(page, `/?county=${arad}&sort=title`)
  49  |     const ids = await page.locator('.song-row').evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.songId))
  50  |     expect(ids.length).toBeGreaterThan(2)
  51  |     await page.locator('.song-row a.song-row__main').nth(1).click()
  52  |     await expect(page).toHaveURL(new RegExp(`/song/${ids[1]}\\?county=`))
  53  |     test.fixme(await isStub(page), '/song is still a stub: Previous / Next not implemented yet')
  54  |     const prev = page.getByRole('link', { name: 'Previous melody' })
  55  |     const next = page.getByRole('link', { name: 'Next melody' })
  56  |     await prev.click()
  57  |     await expect(page).toHaveURL(new RegExp(`/song/${ids[0]}\\?county=`))
  58  |     await next.click()
  59  |     await next.click()
  60  |     await expect(page).toHaveURL(new RegExp(`/song/${ids[2]}\\?county=`))
  61  |     expect(query(page).get('county')).toBe(arad)
  62  |   })
  63  | 
  64  |   test('E2E-11 deep-link 404: unknown song and unknown route', async ({ page }) => {
  65  |     const res = await page.goto('/song/does-not-exist')
  66  |     expect(res?.status()).toBe(200)
  67  |     await expect(page.getByText(/No record with id does-not-exist/)).toBeVisible()
  68  |     await expect(page).toHaveTitle(/not found/i)
  69  |     await expect(page.getByRole('link', { name: 'Back to explorer' })).toHaveAttribute('href', /^\/(\?.*)?$/)
  70  |     await expect(page.getByRole('contentinfo')).toBeVisible()
  71  | 
  72  |     const res2 = await page.goto('/random/path')
  73  |     expect(res2?.status()).toBe(200)
  74  |     await expect(page.getByText('Page not found')).toBeVisible()
  75  |     await expect(page).toHaveTitle(/not found/i)
  76  |     await page.getByRole('link', { name: 'Back to explorer' }).click()
  77  |     await waitForCatalog(page)
  78  |   })
  79  | 
  80  |   test('E2E-12 loading skeleton, error state with retry', async ({ page, data }) => {
  81  |     // slow songs -> the loading state is observable
  82  |     let release: () => void = () => {}
  83  |     const gate = new Promise<void>((r) => (release = r))
  84  |     await page.route('**/data/songs*.json', async (route) => {
  85  |       await gate
  86  |       await route.continue()
  87  |     })
  88  |     await page.goto('/')
  89  |     const busy = page.locator('[aria-busy="true"]').first()
  90  |     await expect(busy).toBeVisible()
  91  |     await expect(page.locator('.skeleton__row').first()).toBeVisible()
  92  |     await expect(page.getByRole('contentinfo')).toBeVisible()
  93  |     await expect(page.locator('.results__count')).not.toHaveText(/^0 of/)
  94  |     release()
  95  |     await page.unroute('**/data/songs*.json')
  96  |     await waitForCatalog(page)
  97  | 
  98  |     // failing songs -> error state; retry recovers, keeping the deep-linked filters
  99  |     await page.route('**/data/songs*.json', (route) => route.abort('failed'))
  100 |     await page.goto(`/?county=${data.countyId('Bihor')}`)
  101 |     const alert = page.getByRole('alert')
  102 |     await expect(alert).toBeVisible()
  103 |     await expect(alert).toContainText('The collection could not be loaded')
  104 |     await expect(page.getByRole('contentinfo')).toBeVisible()
  105 |     await page.unroute('**/data/songs*.json')
  106 |     await alert.getByRole('button', { name: 'Retry' }).click()
  107 |     await waitForCatalog(page)
  108 |     await expect(page.getByRole('button', { name: /Remove filter: Bihor/ })).toBeVisible()
  109 |   })
  110 | 
  111 |   test('E2E-14 no console errors on every route', async ({ page, data, consoleLog }) => {
  112 |     const song = data.song((s) => !!s.source.url)
  113 |     for (const path of ['/', `/county/${data.countyId('Bihor')}`, `/song/${song.id}`, '/journeys', '/about', '/nope']) {
  114 |       await page.goto(path)
  115 |       await page.waitForLoadState('networkidle')
  116 |       await expect(page.getByRole('contentinfo')).toBeVisible()
  117 |     }
  118 |     expect(consoleLog.errors).toEqual([])
  119 |     expect(consoleLog.pageErrors).toEqual([])
```