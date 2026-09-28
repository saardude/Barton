# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: routes.spec.ts >> Routes >> E2E-12 loading skeleton, error state with retry
- Location: e2e/routes.spec.ts:80:3

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
- generic [ref=f1e2]:
  - link "Skip to results" [ref=f1e3] [cursor=pointer]:
    - /url: "#results"
  - banner [ref=f1e4]:
    - link "Bartok / Romania" [ref=f1e5] [cursor=pointer]:
      - /url: /?county=ro/crisana/bihor
    - navigation "Primary" [ref=f1e6]:
      - link "Explorer" [ref=f1e7] [cursor=pointer]:
        - /url: /?county=ro/crisana/bihor
      - link "Journeys" [ref=f1e8] [cursor=pointer]:
        - /url: /journeys?county=ro/crisana/bihor
      - link "About and sources" [ref=f1e9] [cursor=pointer]:
        - /url: /about?county=ro/crisana/bihor
    - searchbox "Search melodies" [ref=f1e12]
    - generic [ref=f1e13]:
      - button "Colour by genre" [ref=f1e14] [cursor=pointer]
      - generic [ref=f1e15]: Theme
      - combobox "Theme" [ref=f1e16]:
        - option "Auto" [selected]
        - option "Light"
        - option "Dark"
  - generic [ref=f1e17]:
    - complementary "Filters" [ref=f1e18]:
      - heading "Filters" [level=2] [ref=f1e20]
      - group [ref=f1e21]:
        - generic "Place Loc / Hely 1 active" [ref=f1e22] [cursor=pointer]:
          - generic [ref=f1e23]:
            - text: Place
            - generic [ref=f1e24]: Loc / Hely
          - generic [ref=f1e25]: 1 active
        - generic [ref=f1e26]:
          - generic [ref=f1e27]:
            - generic [ref=f1e28]:
              - generic [ref=f1e29]: Country
              - combobox "Country" [ref=f1e30]:
                - option "Romania" [selected]
                - option "Croatia"
                - option "Hungary"
                - option "Serbia"
                - option "Slovakia"
                - option "Ukraine"
                - option "Unknown country"
                - option "All countries"
            - tree "Places" [ref=f1e31]:
              - treeitem "Romania 4,072" [expanded] [level=1] [ref=f1e32]:
                - generic [ref=f1e33] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e34]
                  - generic "Filter to Romania" [ref=f1e35]: Romania
                  - generic [ref=f1e37]: 4,072
              - treeitem "Banat 75" [level=2] [ref=f1e38]:
                - generic [ref=f1e39] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e40]
                  - generic "Filter to Banat" [ref=f1e41]: Banat
                  - generic [ref=f1e43]: "75"
              - treeitem "Bukovina 351" [level=2] [ref=f1e44]:
                - generic [ref=f1e45] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e46]
                  - generic "Filter to Bukovina" [ref=f1e47]: Bukovina
                  - generic [ref=f1e49]: "351"
              - treeitem "Crișana 602" [expanded] [level=2] [ref=f1e50]:
                - generic [ref=f1e51] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e52]
                  - generic "Filter to Crișana" [ref=f1e53]: Crișana
                  - generic [ref=f1e55]: "602"
              - treeitem "Aradlocation uncertain 31" [level=3] [ref=f1e56]:
                - generic [ref=f1e57] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e58]
                  - generic "Filter to Arad" [ref=f1e59]: Aradlocation uncertain
                  - generic [ref=f1e61]: "31"
              - treeitem "Bihor (Bihar)location uncertain 436" [expanded] [level=3] [selected] [ref=f1e62]:
                - generic [ref=f1e63] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e64]
                  - generic "Clear county filter" [ref=f1e65]:
                    - generic [ref=f1e66]:
                      - text: Bihor
                      - generic [ref=f1e67]: (Bihar)
                      - text: location uncertain
                  - generic [ref=f1e68]: "436"
              - treeitem "Aleșd (Lelesd)location uncertain 1" [level=4] [ref=f1e69]:
                - generic [ref=f1e70] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e71]
                  - generic "Filter to Aleșd (Lelesd)" [ref=f1e72]:
                    - generic [ref=f1e73]:
                      - text: Aleșd
                      - generic [ref=f1e74]: (Lelesd)
                      - text: location uncertain
                  - generic [ref=f1e75]: "1"
              - treeitem "Beiuș (Belényes) 5" [level=4] [ref=f1e76]:
                - generic [ref=f1e77] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e78]
                  - generic "Filter to Beiuș (Belényes)" [ref=f1e79]:
                    - generic [ref=f1e80]:
                      - text: Beiuș
                      - generic [ref=f1e81]: (Belényes)
                  - generic [ref=f1e82]: "5"
              - treeitem "Budureasa (Bondoraszó) 5" [level=4] [ref=f1e83]:
                - generic [ref=f1e84] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e85]
                  - generic "Filter to Budureasa (Bondoraszó)" [ref=f1e86]:
                    - generic [ref=f1e87]:
                      - text: Budureasa
                      - generic [ref=f1e88]: (Bondoraszó)
                  - generic [ref=f1e89]: "5"
              - treeitem "Bulzlocation uncertain 4" [level=4] [ref=f1e90]:
                - generic [ref=f1e91] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e92]
                  - generic "Filter to Bulz" [ref=f1e93]: Bulzlocation uncertain
                  - generic [ref=f1e95]: "4"
              - treeitem "Căbeștilocation uncertain 1" [level=4] [ref=f1e96]:
                - generic [ref=f1e97] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e98]
                  - generic "Filter to Căbești" [ref=f1e99]: Căbeștilocation uncertain
                  - generic [ref=f1e101]: "1"
              - treeitem "Câmp (Vaskohmező) 3" [level=4] [ref=f1e102]:
                - generic [ref=f1e103] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e104]
                  - generic "Filter to Câmp (Vaskohmező)" [ref=f1e105]:
                    - generic [ref=f1e106]:
                      - text: Câmp
                      - generic [ref=f1e107]: (Vaskohmező)
                  - generic [ref=f1e108]: "3"
              - treeitem "Cociuba-Mare (Alsókocsoba) 3" [level=4] [ref=f1e109]:
                - generic [ref=f1e110] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e111]
                  - generic "Filter to Cociuba-Mare (Alsókocsoba)" [ref=f1e112]:
                    - generic [ref=f1e113]:
                      - text: Cociuba-Mare
                      - generic [ref=f1e114]: (Alsókocsoba)
                  - generic [ref=f1e115]: "3"
              - treeitem "Corbești (Corbesd)location uncertain 3" [level=4] [ref=f1e116]:
                - generic [ref=f1e117] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e118]
                  - generic "Filter to Corbești (Corbesd)" [ref=f1e119]:
                    - generic [ref=f1e120]:
                      - text: Corbești
                      - generic [ref=f1e121]: (Corbesd)
                      - text: location uncertain
                  - generic [ref=f1e122]: "3"
              - treeitem "Cotiglet (Kótliget) 16" [level=4] [ref=f1e123]:
                - generic [ref=f1e124] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e125]
                  - generic "Filter to Cotiglet (Kótliget)" [ref=f1e126]:
                    - generic [ref=f1e127]:
                      - text: Cotiglet
                      - generic [ref=f1e128]: (Kótliget)
                  - generic [ref=f1e129]: "16"
              - treeitem "Delani (Gyalány) 5" [level=4] [ref=f1e130]:
                - generic [ref=f1e131] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e132]
                  - generic "Filter to Delani (Gyalány)" [ref=f1e133]:
                    - generic [ref=f1e134]:
                      - text: Delani
                      - generic [ref=f1e135]: (Gyalány)
                  - generic [ref=f1e136]: "5"
              - treeitem "Drăgănești (Dragesti)location uncertain 7" [level=4] [ref=f1e137]:
                - generic [ref=f1e138] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e139]
                  - generic "Filter to Drăgănești (Dragesti)" [ref=f1e140]:
                    - generic [ref=f1e141]:
                      - text: Drăgănești
                      - generic [ref=f1e142]: (Dragesti)
                      - text: location uncertain
                  - generic [ref=f1e143]: "7"
              - treeitem "Dumbrăvița de Codru (Havasdombró) 7" [level=4] [ref=f1e144]:
                - generic [ref=f1e145] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e146]
                  - generic "Filter to Dumbrăvița de Codru (Havasdombró)" [ref=f1e147]:
                    - generic [ref=f1e148]:
                      - text: Dumbrăvița de Codru
                      - generic [ref=f1e149]: (Havasdombró)
                  - generic [ref=f1e150]: "7"
              - treeitem "Ginta (Gyanta)location uncertain 17" [level=4] [ref=f1e151]:
                - generic [ref=f1e152] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e153]
                  - generic "Filter to Ginta (Gyanta)" [ref=f1e154]:
                    - generic [ref=f1e155]:
                      - text: Ginta
                      - generic [ref=f1e156]: (Gyanta)
                      - text: location uncertain
                  - generic [ref=f1e157]: "17"
              - treeitem "Groşi (Tőtös) 7" [level=4] [ref=f1e158]:
                - generic [ref=f1e159] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e160]
                  - generic "Filter to Groşi (Tőtös)" [ref=f1e161]:
                    - generic [ref=f1e162]:
                      - text: Groşi
                      - generic [ref=f1e163]: (Tőtös)
                  - generic [ref=f1e164]: "7"
              - treeitem "Hotărel (Határ) 1" [level=4] [ref=f1e165]:
                - generic [ref=f1e166] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e167]
                  - generic "Filter to Hotărel (Határ)" [ref=f1e168]:
                    - generic [ref=f1e169]:
                      - text: Hotărel
                      - generic [ref=f1e170]: (Határ)
                  - generic [ref=f1e171]: "1"
              - treeitem "Lehecenilocation uncertain 1" [level=4] [ref=f1e172]:
                - generic [ref=f1e173] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e174]
                  - generic "Filter to Leheceni" [ref=f1e175]: Lehecenilocation uncertain
                  - generic [ref=f1e177]: "1"
              - treeitem "Luncșoaralocation uncertain 6" [level=4] [ref=f1e178]:
                - generic [ref=f1e179] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e180]
                  - generic "Filter to Luncșoara" [ref=f1e181]: Luncșoaralocation uncertain
                  - generic [ref=f1e183]: "6"
              - treeitem "Poiana (Biharmező) 1" [level=4] [ref=f1e184]:
                - generic [ref=f1e185] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e186]
                  - generic "Filter to Poiana (Biharmező)" [ref=f1e187]:
                    - generic [ref=f1e188]:
                      - text: Poiana
                      - generic [ref=f1e189]: (Biharmező)
                  - generic [ref=f1e190]: "1"
              - treeitem "Rogoz (Venterrogoz) 9" [level=4] [ref=f1e191]:
                - generic [ref=f1e192] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e193]
                  - generic "Filter to Rogoz (Venterrogoz)" [ref=f1e194]:
                    - generic [ref=f1e195]:
                      - text: Rogoz
                      - generic [ref=f1e196]: (Venterrogoz)
                  - generic [ref=f1e197]: "9"
              - treeitem "Salonta (Nagyszalonta)location uncertain 270" [level=4] [ref=f1e198]:
                - generic [ref=f1e199] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e200]
                  - generic "Filter to Salonta (Nagyszalonta)" [ref=f1e201]:
                    - generic [ref=f1e202]:
                      - text: Salonta
                      - generic [ref=f1e203]: (Nagyszalonta)
                      - text: location uncertain
                  - generic [ref=f1e204]: "270"
              - treeitem "Samsbleatnot mapped 1" [level=4] [ref=f1e205]:
                - generic [ref=f1e206] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e207]
                  - generic "Filter to Samsbleat" [ref=f1e208]: Samsbleatnot mapped
                  - generic [ref=f1e210]: "1"
              - treeitem "Sâmbășaglocation uncertain 1" [level=4] [ref=f1e211]:
                - generic [ref=f1e212] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e213]
                  - generic "Filter to Sâmbășag" [ref=f1e214]: Sâmbășaglocation uncertain
                  - generic [ref=f1e216]: "1"
              - treeitem "Sebișnot mapped 3" [level=4] [ref=f1e217]:
                - generic [ref=f1e218] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e219]
                  - generic "Filter to Sebiș" [ref=f1e220]: Sebișnot mapped
                  - generic [ref=f1e222]: "3"
              - treeitem "Șoimilocation uncertain 9" [level=4] [ref=f1e223]:
                - generic [ref=f1e224] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e225]
                  - generic "Filter to Șoimi" [ref=f1e226]: Șoimilocation uncertain
                  - generic [ref=f1e228]: "9"
              - treeitem "Tărcaia (Köröstárkány)location uncertain 35" [level=4] [ref=f1e229]:
                - generic [ref=f1e230] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e231]
                  - generic "Filter to Tărcaia (Köröstárkány)" [ref=f1e232]:
                    - generic [ref=f1e233]:
                      - text: Tărcaia
                      - generic [ref=f1e234]: (Köröstárkány)
                      - text: location uncertain
                  - generic [ref=f1e235]: "35"
              - treeitem "Tășad (Tdsad)location uncertain 5" [level=4] [ref=f1e236]:
                - generic [ref=f1e237] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e238]
                  - generic "Filter to Tășad (Tdsad)" [ref=f1e239]:
                    - generic [ref=f1e240]:
                      - text: Tășad
                      - generic [ref=f1e241]: (Tdsad)
                      - text: location uncertain
                  - generic [ref=f1e242]: "5"
              - treeitem "Urviș de Beiuș (Urvis)location uncertain 7" [level=4] [ref=f1e243]:
                - generic [ref=f1e244] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e245]
                  - generic "Filter to Urviș de Beiuș (Urvis)" [ref=f1e246]:
                    - generic [ref=f1e247]:
                      - text: Urviș de Beiuș
                      - generic [ref=f1e248]: (Urvis)
                      - text: location uncertain
                  - generic [ref=f1e249]: "7"
              - treeitem "Vașcăulocation uncertain 3" [level=4] [ref=f1e250]:
                - generic [ref=f1e251] [cursor=pointer]:
                  - button [disabled] [aria-hidden] [ref=f1e252]
                  - generic "Filter to Vașcău" [ref=f1e253]: Vașcăulocation uncertain
                  - generic [ref=f1e255]: "3"
              - treeitem "Satu Mare (Szatmár)location uncertain 82" [level=3] [ref=f1e256]:
                - generic [ref=f1e257] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e258]
                  - generic "Filter to Satu Mare (Szatmár)" [ref=f1e259]:
                    - generic [ref=f1e260]:
                      - text: Satu Mare
                      - generic [ref=f1e261]: (Szatmár)
                      - text: location uncertain
                  - generic [ref=f1e262]: "82"
              - treeitem "Sălaj (Szilágy)location uncertain 53" [level=3] [ref=f1e263]:
                - generic [ref=f1e264] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e265]
                  - generic "Filter to Sălaj (Szilágy)" [ref=f1e266]:
                    - generic [ref=f1e267]:
                      - text: Sălaj
                      - generic [ref=f1e268]: (Szilágy)
                      - text: location uncertain
                  - generic [ref=f1e269]: "53"
              - treeitem "Maramureș 370" [level=2] [ref=f1e270]:
                - generic [ref=f1e271] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e272]
                  - generic "Filter to Maramureș" [ref=f1e273]: Maramureș
                  - generic [ref=f1e275]: "370"
              - treeitem "Moldavia 311" [level=2] [ref=f1e276]:
                - generic [ref=f1e277] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e278]
                  - generic "Filter to Moldavia" [ref=f1e279]: Moldavia
                  - generic [ref=f1e281]: "311"
              - treeitem "Transylvania 2,360" [level=2] [ref=f1e282]:
                - generic [ref=f1e283] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e284]
                  - generic "Filter to Transylvania" [ref=f1e285]: Transylvania
                  - generic [ref=f1e287]: 2,360
              - treeitem "(county unknown)not mapped 3" [level=2] [ref=f1e288]:
                - generic [ref=f1e289] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e290]
                  - generic "Filter to (county unknown)" [ref=f1e291]: (county unknown)not mapped
                  - generic [ref=f1e293]: "3"
              - treeitem "Croatia 1" [level=1] [ref=f1e294]:
                - generic [ref=f1e295] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e296]
                  - generic "Filter to Croatia" [ref=f1e297]: Croatia
                  - generic [ref=f1e299]: "1"
              - treeitem "Hungary 6,472" [level=1] [ref=f1e300]:
                - generic [ref=f1e301] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e302]
                  - generic "Filter to Hungary" [ref=f1e303]: Hungary
                  - generic [ref=f1e305]: 6,472
              - treeitem "Serbia 2" [level=1] [ref=f1e306]:
                - generic [ref=f1e307] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e308]
                  - generic "Filter to Serbia" [ref=f1e309]: Serbia
                  - generic [ref=f1e311]: "2"
              - treeitem "Slovakia 1,210" [level=1] [ref=f1e312]:
                - generic [ref=f1e313] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e314]
                  - generic "Filter to Slovakia" [ref=f1e315]: Slovakia
                  - generic [ref=f1e317]: 1,210
              - treeitem "Ukraine 7" [level=1] [ref=f1e318]:
                - generic [ref=f1e319] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e320]
                  - generic "Filter to Ukraine" [ref=f1e321]: Ukraine
                  - generic [ref=f1e323]: "7"
              - treeitem "Unknown countrynot mapped 2,646" [level=1] [ref=f1e324]:
                - generic [ref=f1e325] [cursor=pointer]:
                  - button [aria-hidden] [ref=f1e326]
                  - generic "Filter to Unknown country" [ref=f1e327]: Unknown countrynot mapped
                  - generic [ref=f1e329]: 2,646
          - button "Clear" [ref=f1e330] [cursor=pointer]
      - group [ref=f1e331]:
        - generic "Genre Gen / Műfaj" [ref=f1e332] [cursor=pointer]:
          - generic [ref=f1e333]:
            - text: Genre
            - generic [ref=f1e334]: Gen / Műfaj
        - group "Genre" [ref=f1e336]:
          - 'generic "hu: sirató" [ref=f1e337]':
            - checkbox "bocet / lament (0)" [disabled] [ref=f1e338]
            - generic [ref=f1e340]: bocet / lament
            - generic [ref=f1e341]: (0)
          - 'generic "hu: kolinda (téli köszöntő ének)" [ref=f1e342]':
            - checkbox "colindă / winter carol 103" [ref=f1e343]
            - generic [ref=f1e345]: colindă / winter carol
            - generic [ref=f1e346]: "103"
          - 'generic "hu: doina (hora lungă)" [ref=f1e347]':
            - checkbox "doină / lyrical improvised song (hora lungă) (0)" [disabled] [ref=f1e348]
            - generic [ref=f1e350]: doină / lyrical improvised song (hora lungă)
            - generic [ref=f1e351]: (0)
          - 'generic "hu: táncdallam" [ref=f1e352]':
            - checkbox "joc / dance tune (0)" [disabled] [ref=f1e353]
            - generic [ref=f1e355]: joc / dance tune
            - generic [ref=f1e356]: (0)
          - 'generic "hu: lakodalmi dal" [ref=f1e357]':
            - checkbox "cântec de nuntă / wedding song (0)" [disabled] [ref=f1e358]
            - generic [ref=f1e360]: cântec de nuntă / wedding song
            - generic [ref=f1e361]: (0)
          - 'generic "hu: tulajdonképpeni dal" [ref=f1e362]':
            - checkbox "cântec (propriu-zis) / song proper (0)" [disabled] [ref=f1e363]
            - generic [ref=f1e365]: cântec (propriu-zis) / song proper
            - generic [ref=f1e366]: (0)
          - 'generic "hu: egyéb" [ref=f1e367]':
            - checkbox "altele / other / unclassified (0)" [disabled] [ref=f1e368]
            - generic [ref=f1e370]: altele / other / unclassified
            - generic [ref=f1e371]: (0)
      - group [ref=f1e372]:
        - generic "Style Stil / Stílus" [ref=f1e373] [cursor=pointer]:
          - generic [ref=f1e374]:
            - text: Style
            - generic [ref=f1e375]: Stil / Stílus
        - group "Style" [ref=f1e377]:
          - button "instrumental 10" [ref=f1e378] [cursor=pointer]:
            - generic [ref=f1e379]: instrumental
            - generic [ref=f1e380]: "10"
          - button "mixed style 79" [ref=f1e381] [cursor=pointer]:
            - generic [ref=f1e382]: mixed style
            - generic [ref=f1e383]: "79"
          - button "new style 116" [ref=f1e384] [cursor=pointer]:
            - generic [ref=f1e385]: new style
            - generic [ref=f1e386]: "116"
          - button "not classified 3" [ref=f1e387] [cursor=pointer]:
            - generic [ref=f1e388]: not classified
            - generic [ref=f1e389]: "3"
          - button "old style 110" [ref=f1e390] [cursor=pointer]:
            - generic [ref=f1e391]: old style
            - generic [ref=f1e392]: "110"
      - group [ref=f1e393]:
        - generic "Performance Interpretare / Előadásmód" [ref=f1e394] [cursor=pointer]:
          - generic [ref=f1e395]:
            - text: Performance
            - generic [ref=f1e396]: Interpretare / Előadásmód
        - group "Performance" [ref=f1e398]:
          - button "vocal 115" [ref=f1e399] [cursor=pointer]:
            - generic [ref=f1e400]: vocal
            - generic [ref=f1e401]: "115"
          - button "instrumental 10" [ref=f1e402] [cursor=pointer]:
            - generic [ref=f1e403]: instrumental
            - generic [ref=f1e404]: "10"
          - button "vocal and instrumental (0)" [disabled] [ref=f1e405]:
            - generic [ref=f1e406]: vocal and instrumental
            - generic [ref=f1e407]: (0)
          - button "unknown 311" [ref=f1e408] [cursor=pointer]:
            - generic [ref=f1e409]: unknown
            - generic [ref=f1e410]: "311"
      - group [ref=f1e411]:
        - generic "Instrument Instrument / Hangszer" [ref=f1e412] [cursor=pointer]:
          - generic [ref=f1e413]:
            - text: Instrument
            - generic [ref=f1e414]: Instrument / Hangszer
        - group "Instrument" [ref=f1e416]:
          - button "bagpipe 1" [ref=f1e417] [cursor=pointer]:
            - generic [ref=f1e418]: bagpipe
            - generic [ref=f1e419]: "1"
          - button "violin 2" [ref=f1e420] [cursor=pointer]:
            - generic [ref=f1e421]: violin
            - generic [ref=f1e422]: "2"
      - group [ref=f1e423]:
        - generic "Year An / Év" [ref=f1e424] [cursor=pointer]:
          - generic [ref=f1e425]:
            - text: Year
            - generic [ref=f1e426]: An / Év
        - generic [ref=f1e428]:
          - generic [ref=f1e429]:
            - generic [ref=f1e430]:
              - text: From
              - spinbutton "From" [ref=f1e431]: "1865"
            - generic [ref=f1e432]:
              - text: To
              - spinbutton "To" [ref=f1e433]: "1943"
          - img "Melodies per 5 years, 1865 to 1944; most in 1915s" [ref=f1e434]
          - generic [ref=f1e438]:
            - generic [ref=f1e439]: From
            - slider "From": "1865"
            - generic [ref=f1e440]: To
            - slider "To": "1943"
      - button "Clear all filters" [ref=f1e442] [cursor=pointer]
    - main [ref=f1e443]:
      - region "Map" [ref=f1e444]:
        - generic [ref=f1e445]:
          - application "Map of melodies; use the list after the map for keyboard access" [ref=f1e446]:
            - generic:
              - generic:
                - 'button "Aleșd (Lelesd), Bihor: 1 melodies" [ref=f1e448] [cursor=pointer]'
                - 'button "Groşi (Tőtös), Bihor: 7 melodies" [ref=f1e450] [cursor=pointer]'
                - 'button "Luncșoara, Bihor: 6 melodies" [ref=f1e452] [cursor=pointer]'
                - 'button "Tășad (Tdsad), Bihor: 5 melodies" [ref=f1e454] [cursor=pointer]'
                - 'button "Bulz, Bihor: 4 melodies" [ref=f1e456] [cursor=pointer]'
                - 'button "Cotiglet (Kótliget), Bihor: 16 melodies" [ref=f1e458] [cursor=pointer]'
                - 'button "Sâmbășag, Bihor: 1 melodies" [ref=f1e460] [cursor=pointer]'
                - 'button "Salonta (Nagyszalonta), Bihor: 270 melodies" [ref=f1e462] [cursor=pointer]'
                - 'button "Rogoz (Venterrogoz), Bihor: 9 melodies" [ref=f1e464] [cursor=pointer]'
                - 'button "Ginta (Gyanta), Bihor: 17 melodies" [ref=f1e466] [cursor=pointer]'
                - 'button "Căbești, Bihor: 1 melodies" [ref=f1e468] [cursor=pointer]'
                - 'button "Cociuba-Mare (Alsókocsoba), Bihor: 3 melodies" [ref=f1e470] [cursor=pointer]'
                - 'button "Corbești (Corbesd), Bihor: 3 melodies" [ref=f1e472] [cursor=pointer]'
                - 'button "Delani (Gyalány), Bihor: 5 melodies" [ref=f1e474] [cursor=pointer]'
                - 'button "Șoimi, Bihor: 9 melodies" [ref=f1e476] [cursor=pointer]'
                - 'button "Budureasa (Bondoraszó), Bihor: 5 melodies" [ref=f1e478] [cursor=pointer]'
                - 'button "Urviș de Beiuș (Urvis), Bihor: 7 melodies" [ref=f1e480] [cursor=pointer]'
                - 'button "Beiuș (Belényes), Bihor: 5 melodies" [ref=f1e482] [cursor=pointer]'
                - 'button "Dumbrăvița de Codru (Havasdombró), Bihor: 7 melodies" [ref=f1e484] [cursor=pointer]'
                - 'button "Tărcaia (Köröstárkány), Bihor: 35 melodies" [ref=f1e486] [cursor=pointer]'
                - 'button "Drăgănești (Dragesti), Bihor: 7 melodies" [ref=f1e488] [cursor=pointer]'
                - 'button "Hotărel (Határ), Bihor: 1 melodies" [ref=f1e490] [cursor=pointer]'
                - 'button "Vașcău, Bihor: 3 melodies" [ref=f1e492] [cursor=pointer]'
                - 'button "Câmp (Vaskohmező), Bihor: 3 melodies" [ref=f1e494] [cursor=pointer]'
                - 'button "Poiana (Biharmező), Bihor: 1 melodies" [ref=f1e496] [cursor=pointer]'
                - 'button "Leheceni, Bihor: 1 melodies" [ref=f1e498] [cursor=pointer]'
            - generic [ref=f1e499]:
              - link "Leaflet" [ref=f1e500] [cursor=pointer]:
                - /url: https://leafletjs.com
              - text: "| ©"
              - link "OpenStreetMap" [ref=f1e501] [cursor=pointer]:
                - /url: https://www.openstreetmap.org/copyright
              - text: contributors ©
              - link "CARTO" [ref=f1e502] [cursor=pointer]:
                - /url: https://carto.com/attributions
          - generic [ref=f1e503]:
            - button "Zoom in" [ref=f1e504] [cursor=pointer]: +
            - button "Zoom out" [ref=f1e505] [cursor=pointer]: −
            - button "Fit to county" [ref=f1e506] [cursor=pointer]
          - button "Colour by genre" [ref=f1e510] [cursor=pointer]
          - generic "Legend" [ref=f1e515]:
            - generic [ref=f1e516]: "Dot size: melodies"
            - generic [ref=f1e517]: "1"
            - generic [ref=f1e520]: "135"
            - generic [ref=f1e523]: "270"
          - link "4 not mapped" [ref=f1e526] [cursor=pointer]:
            - /url: /?county=ro/crisana/bihor&unmapped=1
        - group [ref=f1e527]:
          - generic "List villages (26)" [ref=f1e528] [cursor=pointer]
      - region "Results" [ref=f1e529]:
        - generic [ref=f1e530]:
          - generic [ref=f1e531]: 436 of 4,072 melodies
          - generic [ref=f1e532]:
            - generic [ref=f1e533]:
              - generic [ref=f1e534]: Sort by
              - combobox "Sort by" [ref=f1e535]:
                - option "Title" [selected]
                - option "Style"
                - option "Location"
                - option "Year"
                - option "Source number"
              - button "Toggle sort direction" [ref=f1e536] [cursor=pointer]: ↑
            - button "Export 436 melodies as JSON" [ref=f1e537] [cursor=pointer]: Export JSON
            - link "Open county page" [ref=f1e538] [cursor=pointer]:
              - /url: /county/ro/crisana/bihor?county=ro/crisana/bihor
          - generic "Active filters" [ref=f1e540]:
            - 'button "Remove filter: Bihor (Bihar)" [ref=f1e541] [cursor=pointer]':
              - generic [ref=f1e542]: Bihor (Bihar)
              - generic [aria-hidden] [ref=f1e543]: ×
            - button "Clear all filters" [ref=f1e544] [cursor=pointer]
        - list "Results" [ref=f1e545]:
          - listitem [ref=f1e546]:
            - link "1. [Ai, Frunză verde, foaie lat'] Poiana (Biharmező) / Bihor, 1909" [ref=f1e547] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L157-01?county=ro/crisana/bihor
              - generic [ref=f1e548]: 1. [Ai, Frunză verde, foaie lat']
              - generic [ref=f1e551]:
                - generic [ref=f1e552]: Poiana (Biharmező) / Bihor,
                - text: "1909"
            - generic [ref=f1e553]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=f1e554] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L157-01/
                - generic [ref=f1e555]: L 157
              - generic [ref=f1e558]:
                - generic "has recording" [ref=f1e559]
                - generic "has notation" [ref=f1e564]
          - listitem [ref=f1e570]:
            - link "1. Bagpipers (2) Câmp (Vaskohmező) / Bihor, 1910" [ref=f1e571] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L124-01-2?county=ro/crisana/bihor
              - generic [ref=f1e572]: 1. Bagpipers (2)
              - generic [ref=f1e575]:
                - generic [ref=f1e576]: Câmp (Vaskohmező) / Bihor,
                - text: "1910"
            - generic [ref=f1e577]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=f1e578] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L124-01-2/
                - generic [ref=f1e579]: L 124
              - generic [ref=f1e582]:
                - generic "has recording" [ref=f1e583]
                - generic "has notation" [ref=f1e588]
          - listitem [ref=f1e594]:
            - link "1. Nu te supăra, mireasă Delani (Gyalány) / Bihor, 1909" [ref=f1e595] [cursor=pointer]:
              - /url: /song/fmbc-BB057-L155-01?county=ro/crisana/bihor
              - generic [ref=f1e596]: 1. Nu te supăra, mireasă
              - generic [ref=f1e599]:
                - generic [ref=f1e600]: Delani (Gyalány) / Bihor,
                - text: "1909"
            - generic [ref=f1e601]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=f1e602] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB057-L155-01/
                - generic [ref=f1e603]: L 155
              - generic [ref=f1e606]:
                - generic "has recording" [ref=f1e607]
                - generic "has notation" [ref=f1e612]
          - listitem [ref=f1e618]:
            - link "2. Hei, Toată lumea vrea să moru Cociuba-Mare (Alsókocsoba) / Bihor, 1912" [ref=f1e619] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L158-02?county=ro/crisana/bihor
              - generic [ref=f1e620]: 2. Hei, Toată lumea vrea să moru
              - generic [ref=f1e623]:
                - generic [ref=f1e624]: Cociuba-Mare (Alsókocsoba) / Bihor,
                - text: "1912"
            - generic [ref=f1e625]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=f1e626] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L158-02/
                - generic [ref=f1e627]: L 158
              - generic [ref=f1e630]:
                - generic "has recording" [ref=f1e631]
                - generic "has notation" [ref=f1e636]
          - listitem [ref=f1e642]:
            - link "2. Măi bădiță, prostule Delani (Gyalány) / Bihor, 1909" [ref=f1e643] [cursor=pointer]:
              - /url: /song/fmbc-BB057-L156-02?county=ro/crisana/bihor
              - generic [ref=f1e644]: 2. Măi bădiță, prostule
              - generic [ref=f1e647]:
                - generic [ref=f1e648]: Delani (Gyalány) / Bihor,
                - text: "1909"
            - generic [ref=f1e649]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=f1e650] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB057-L156-02/
                - generic [ref=f1e651]: L 156
              - generic [ref=f1e654]:
                - generic "has recording" [ref=f1e655]
                - generic "has notation" [ref=f1e660]
          - listitem [ref=f1e666]:
            - link "3. [Vai de mine, ce să fii] Rogoz (Venterrogoz) / Bihor, 1911" [ref=f1e667] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L159-03?county=ro/crisana/bihor
              - generic [ref=f1e668]: 3. [Vai de mine, ce să fii]
              - generic [ref=f1e671]:
                - generic [ref=f1e672]: Rogoz (Venterrogoz) / Bihor,
                - text: "1911"
            - generic [ref=f1e673]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=f1e674] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L159-03/
                - generic [ref=f1e675]: L 159
              - generic [ref=f1e678]:
                - generic "has recording" [ref=f1e679]
                - generic "has notation" [ref=f1e684]
          - listitem [ref=f1e690]:
            - link "5. Romanian Polka Beiuș (Belényes) / Bihor, 1910" [ref=f1e691] [cursor=pointer]:
              - /url: /song/fmbc-BB068-L132-05?county=ro/crisana/bihor
              - generic [ref=f1e692]: 5. Romanian Polka
              - generic [ref=f1e695]:
                - generic [ref=f1e696]: Beiuș (Belényes) / Bihor,
                - text: "1910"
            - generic [ref=f1e697]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=f1e698] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L132-05/
                - generic [ref=f1e699]: L 132
              - generic [ref=f1e702]:
                - generic "has recording" [ref=f1e703]
                - generic "has notation" [ref=f1e708]
          - listitem [ref=f1e714]:
            - link "6. Până fusei la maica, măi Budureasa (Bondoraszó) / Bihor, 1909" [ref=f1e715] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L161-06?county=ro/crisana/bihor
              - generic [ref=f1e716]: 6. Până fusei la maica, măi
              - generic [ref=f1e719]:
                - generic [ref=f1e720]: Budureasa (Bondoraszó) / Bihor,
                - text: "1909"
            - generic [ref=f1e721]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=f1e722] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L161-06/
                - generic [ref=f1e723]: L 161
              - generic [ref=f1e726]:
                - generic "has recording" [ref=f1e727]
                - generic "has notation" [ref=f1e732]
          - listitem [ref=f1e738]:
            - link "6. Quick Dance (1) Beiuș (Belényes) / Bihor, 1910" [ref=f1e739] [cursor=pointer]:
              - /url: /song/fmbc-BB068-L133-06-1?county=ro/crisana/bihor
              - generic [ref=f1e740]: 6. Quick Dance (1)
              - generic [ref=f1e743]:
                - generic [ref=f1e744]: Beiuș (Belényes) / Bihor,
                - text: "1910"
            - generic [ref=f1e745]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=f1e746] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB068-L133-06-1/
                - generic [ref=f1e747]: L 133
              - generic [ref=f1e750]:
                - generic "has recording" [ref=f1e751]
                - generic "has notation" [ref=f1e756]
          - listitem [ref=f1e762]:
            - link "7. Frunză verde, foaie fragă Groşi (Tőtös) / Bihor, 1912" [ref=f1e763] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L162-07?county=ro/crisana/bihor
              - generic [ref=f1e764]: 7. Frunză verde, foaie fragă
              - generic [ref=f1e767]:
                - generic [ref=f1e768]: Groşi (Tőtös) / Bihor,
                - text: "1912"
            - generic [ref=f1e769]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=f1e770] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L162-07/
                - generic [ref=f1e771]: L 162
              - generic [ref=f1e774]:
                - generic "has recording" [ref=f1e775]
                - generic "has notation" [ref=f1e780]
          - listitem [ref=f1e786]:
            - link "8. Atâtea gânduri îmi vinu Cotiglet (Kótliget) / Bihor, 1912" [ref=f1e787] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L163-08?county=ro/crisana/bihor
              - generic [ref=f1e788]: 8. Atâtea gânduri îmi vinu
              - generic [ref=f1e791]:
                - generic [ref=f1e792]: Cotiglet (Kótliget) / Bihor,
                - text: "1912"
            - generic [ref=f1e793]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=f1e794] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L163-08/
                - generic [ref=f1e795]: L 163
              - generic [ref=f1e798]:
                - generic "has recording" [ref=f1e799]
                - generic "has notation" [ref=f1e804]
          - listitem [ref=f1e810]:
            - link "9. Cine n'are noroc n'are Hotărel (Határ) / Bihor, 1909" [ref=f1e811] [cursor=pointer]:
              - /url: /song/fmbc-BB069-L164-09?county=ro/crisana/bihor
              - generic [ref=f1e812]: 9. Cine n'are noroc n'are
              - generic [ref=f1e815]:
                - generic [ref=f1e816]: Hotărel (Határ) / Bihor,
                - text: "1909"
            - generic [ref=f1e817]:
              - link "Open original record on Folk Music in Bartók's Compositions" [ref=f1e818] [cursor=pointer]:
                - /url: https://bartok-nepzene.zti.hu/en/browse/record/BB069-L164-09/
                - generic [ref=f1e819]: L 164
              - generic [ref=f1e822]:
                - generic "has recording" [ref=f1e823]
                - generic "has notation" [ref=f1e828]
          - listitem [ref=f1e834]:
            - link "Ábécédé, hová mész, hé? Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e835] [cursor=pointer]:
              - /url: /song/bsys-10-12599?county=ro/crisana/bihor
              - generic [ref=f1e836]: Ábécédé, hová mész, hé?
              - generic [ref=f1e839]:
                - generic [ref=f1e840]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=f1e841]:
              - link "Open original record on The Bartók System" [ref=f1e842] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/10/12599
                - generic [ref=f1e843]: C 1035d
              - generic "has notation" [ref=f1e847]
          - listitem [ref=f1e853]:
            - link "A búzába a disznó, csak a farka látszik Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e854] [cursor=pointer]:
              - /url: /song/bsys-20-3641?county=ro/crisana/bihor
              - generic [ref=f1e855]: A búzába a disznó, csak a farka látszik
              - generic [ref=f1e858]:
                - generic [ref=f1e859]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=f1e860]:
              - link "Open original record on The Bartók System" [ref=f1e861] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/20/3641
                - generic [ref=f1e862]: A 1163g
              - generic [ref=f1e865]:
                - generic "has recording" [ref=f1e866]
                - generic "has notation" [ref=f1e871]
          - listitem [ref=f1e877]:
            - link "Addig megyek míg a szememmel látok Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e878] [cursor=pointer]:
              - /url: /song/bsys-34-8083?county=ro/crisana/bihor
              - generic [ref=f1e879]: Addig megyek míg a szememmel látok
              - generic [ref=f1e882]:
                - generic [ref=f1e883]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=f1e884]:
              - link "Open original record on The Bartók System" [ref=f1e885] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/34/8083
                - generic [ref=f1e886]: B 986f
              - generic "has notation" [ref=f1e890]
          - listitem [ref=f1e896]:
            - link "ae SES (5 Be ae e+ as el ee Se! Rogoz (Venterrogoz) / Bihor, 1911" [ref=f1e897] [cursor=pointer]:
              - /url: /song/rfm-4-131?county=ro/crisana/bihor
              - generic [ref=f1e898]: ae SES (5 Be ae e+ as el ee Se!
              - generic [ref=f1e901]:
                - generic [ref=f1e902]: Rogoz (Venterrogoz) / Bihor,
                - text: "1911"
            - generic [ref=f1e903]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=f1e904] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n230
                - generic [ref=f1e905]: M.F. 1904 a)
              - generic "has notation" [ref=f1e909]
          - listitem [ref=f1e915]:
            - link "aes su’dumbra cieriului, Corinde, Urviș de Beiuș (Urvis) / Bihor, 1914" [ref=f1e916] [cursor=pointer]:
              - /url: /song/rfm-4-71g?county=ro/crisana/bihor
              - generic [ref=f1e917]: aes su’dumbra cieriului, Corinde,
              - generic [ref=f1e920]:
                - generic [ref=f1e921]: Urviș de Beiuș (Urvis) / Bihor,
                - text: "1914"
            - generic [ref=f1e922]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=f1e923] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n161
                - generic [ref=f1e924]: F. 1192 c)
              - generic "has notation" [ref=f1e928]
          - listitem [ref=f1e934]:
            - link "A fekete halom alatt Tărcaia (Köröstárkány) / Bihor, 1912" [ref=f1e935] [cursor=pointer]:
              - /url: /song/bsys-15-1948?county=ro/crisana/bihor
              - generic [ref=f1e936]: A fekete halom alatt
              - generic [ref=f1e939]:
                - generic [ref=f1e940]: Tărcaia (Köröstárkány) / Bihor,
                - text: "1912"
            - generic [ref=f1e941]:
              - link "Open original record on The Bartók System" [ref=f1e942] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/15/1948
                - generic [ref=f1e943]: A 640
              - generic [ref=f1e946]:
                - generic "has recording" [ref=f1e947]
                - generic "has notation" [ref=f1e952]
          - listitem [ref=f1e958]:
            - link "A gőzösnek hat kereke Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e959] [cursor=pointer]:
              - /url: /song/bsys-15-2000?county=ro/crisana/bihor
              - generic [ref=f1e960]: A gőzösnek hat kereke
              - generic [ref=f1e963]:
                - generic [ref=f1e964]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=f1e965]:
              - link "Open original record on The Bartók System" [ref=f1e966] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/15/2000
                - generic [ref=f1e967]: A 647o
              - generic "has notation" [ref=f1e971]
          - listitem [ref=f1e977]:
            - link "A, Grdj&sjTatal Dumiezeu, Leruj; Doamie! Groşi (Tőtös) / Bihor, 1912" [ref=f1e978] [cursor=pointer]:
              - /url: /song/rfm-4-57a?county=ro/crisana/bihor
              - generic [ref=f1e979]: A, Grdj&sjTatal Dumiezeu, Leruj; Doamie!
              - generic [ref=f1e982]:
                - generic [ref=f1e983]: Groşi (Tőtös) / Bihor,
                - text: "1912"
            - generic [ref=f1e984]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=f1e985] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n137
                - generic [ref=f1e986]: M.F. 1998 c)
              - generic "has notation" [ref=f1e990]
          - listitem [ref=f1e996]:
            - link "A gúnárom fekete Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e997] [cursor=pointer]:
              - /url: /song/bsys-14-1133?county=ro/crisana/bihor
              - generic [ref=f1e998]: A gúnárom fekete
              - generic [ref=f1e1001]:
                - generic [ref=f1e1002]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=f1e1003]:
              - link "Open original record on The Bartók System" [ref=f1e1004] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/14/1133
                - generic [ref=f1e1005]: A 402j(1)
              - generic "has notation" [ref=f1e1009]
          - listitem [ref=f1e1015]:
            - link "aH Sareea eee er eta Cociuba-Mare (Alsókocsoba) / Bihor, 1912" [ref=f1e1016] [cursor=pointer]:
              - /url: /song/rfm-4-21y?county=ro/crisana/bihor
              - generic [ref=f1e1017]: aH Sareea eee er eta
              - generic [ref=f1e1020]:
                - generic [ref=f1e1021]: Cociuba-Mare (Alsókocsoba) / Bihor,
                - text: "1912"
            - generic [ref=f1e1022]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=f1e1023] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n118
                - generic [ref=f1e1024]: M.F. 1965 b)
              - generic "has notation" [ref=f1e1028]
          - listitem [ref=f1e1034]:
            - link "Aki ötöt, hatot szeret, nem szeret az igazán Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e1035] [cursor=pointer]:
              - /url: /song/bsys-37-9307?county=ro/crisana/bihor
              - generic [ref=f1e1036]: Aki ötöt, hatot szeret, nem szeret az igazán
              - generic [ref=f1e1039]:
                - generic [ref=f1e1040]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - link "Open original record on The Bartók System" [ref=f1e1042] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/37/9307
              - generic [ref=f1e1043]: B 1392m
          - listitem [ref=f1e1046]:
            - link "A kisasszony Pozsonyba, krinolinba Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e1047] [cursor=pointer]:
              - /url: /song/bsys-73-12082?county=ro/crisana/bihor
              - generic [ref=f1e1048]: A kisasszony Pozsonyba, krinolinba
              - generic [ref=f1e1051]:
                - generic [ref=f1e1052]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - link "Open original record on The Bartók System" [ref=f1e1054] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/73/12082
              - generic [ref=f1e1055]: C 835d(1)
          - listitem [ref=f1e1058]:
            - link "A közkórház körös-körül kavicsos Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e1059] [cursor=pointer]:
              - /url: /song/bsys-25-4898?county=ro/crisana/bihor
              - generic [ref=f1e1060]: A közkórház körös-körül kavicsos
              - generic [ref=f1e1063]:
                - generic [ref=f1e1064]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=f1e1065]:
              - link "Open original record on The Bartók System" [ref=f1e1066] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/25/4898
                - generic [ref=f1e1067]: A 1527b
              - generic "has notation" [ref=f1e1071]
          - listitem [ref=f1e1077]:
            - link "Által úsztam a Dunán, által furulyáztam Tărcaia (Köröstárkány) / Bihor, 1912" [ref=f1e1078] [cursor=pointer]:
              - /url: /song/bsys-20-3459?county=ro/crisana/bihor
              - generic [ref=f1e1079]: Által úsztam a Dunán, által furulyáztam
              - generic [ref=f1e1082]:
                - generic [ref=f1e1083]: Tărcaia (Köröstárkány) / Bihor,
                - text: "1912"
            - generic [ref=f1e1084]:
              - link "Open original record on The Bartók System" [ref=f1e1085] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/20/3459
                - generic [ref=f1e1086]: A 1115b
              - generic [ref=f1e1089]:
                - generic "has recording" [ref=f1e1090]
                - generic "has notation" [ref=f1e1095]
          - listitem [ref=f1e1101]:
            - link "Amoda ég egy piros tűz magában Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e1102] [cursor=pointer]:
              - /url: /song/bsys-25-4678?county=ro/crisana/bihor
              - generic [ref=f1e1103]: Amoda ég egy piros tűz magában
              - generic [ref=f1e1106]:
                - generic [ref=f1e1107]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=f1e1108]:
              - link "Open original record on The Bartók System" [ref=f1e1109] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/25/4678
                - generic [ref=f1e1110]: A 1479e
              - generic "has notation" [ref=f1e1114]
          - listitem [ref=f1e1120]:
            - link "Amoda ég egy piros tűz magában Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e1121] [cursor=pointer]:
              - /url: /song/bsys-25-4679?county=ro/crisana/bihor
              - generic [ref=f1e1122]: Amoda ég egy piros tűz magában
              - generic [ref=f1e1125]:
                - generic [ref=f1e1126]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=f1e1127]:
              - link "Open original record on The Bartók System" [ref=f1e1128] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/25/4679
                - generic [ref=f1e1129]: A 1479f
              - generic "has notation" [ref=f1e1133]
          - listitem [ref=f1e1139]:
            - link "Amoda egy bokor mellett Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e1140] [cursor=pointer]:
              - /url: /song/bsys-15-1730?county=ro/crisana/bihor
              - generic [ref=f1e1141]: Amoda egy bokor mellett
              - generic [ref=f1e1144]:
                - generic [ref=f1e1145]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=f1e1146]:
              - link "Open original record on The Bartók System" [ref=f1e1147] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/15/1730
                - generic [ref=f1e1148]: A 577d(1)
              - generic [ref=f1e1151]:
                - generic "has recording" [ref=f1e1152]
                - generic "has notation" [ref=f1e1157]
          - listitem [ref=f1e1163]:
            - link "Amoda megy egy szép leány, korót visz a karján Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e1164] [cursor=pointer]:
              - /url: /song/bsys-37-8716?county=ro/crisana/bihor
              - generic [ref=f1e1165]: Amoda megy egy szép leány, korót visz a karján
              - generic [ref=f1e1168]:
                - generic [ref=f1e1169]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - link "Open original record on The Bartók System" [ref=f1e1171] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/37/8716
              - generic [ref=f1e1172]: B 1202a
          - listitem [ref=f1e1175]:
            - link "Amoda van egy kis fehér csárda Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e1176] [cursor=pointer]:
              - /url: /song/bsys-33-6478?county=ro/crisana/bihor
              - generic [ref=f1e1177]: Amoda van egy kis fehér csárda
              - generic [ref=f1e1180]:
                - generic [ref=f1e1181]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=f1e1182]:
              - link "Open original record on The Bartók System" [ref=f1e1183] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/33/6478
                - generic [ref=f1e1184]: B 413a
              - generic "has notation" [ref=f1e1188]
          - listitem [ref=f1e1194]:
            - link "A nagy utcán véges-véges-végig Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e1195] [cursor=pointer]:
              - /url: /song/bsys-33-6200?county=ro/crisana/bihor
              - generic [ref=f1e1196]: A nagy utcán véges-véges-végig
              - generic [ref=f1e1199]:
                - generic [ref=f1e1200]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=f1e1201]:
              - link "Open original record on The Bartók System" [ref=f1e1202] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/33/6200
                - generic [ref=f1e1203]: B 335d
              - generic "has notation" [ref=f1e1207]
          - listitem [ref=f1e1213]:
            - link "a sa maf - - ca, du = Luncșoara / Bihor, 1912" [ref=f1e1214] [cursor=pointer]:
              - /url: /song/rfm-4-73p?county=ro/crisana/bihor
              - generic [ref=f1e1215]: a sa maf - - ca, du =
              - generic [ref=f1e1218]:
                - generic [ref=f1e1219]: Luncșoara / Bihor,
                - text: "1912"
            - generic [ref=f1e1220]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=f1e1221] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n167
                - generic [ref=f1e1222]: M.F. 2000 b)
              - generic "has notation" [ref=f1e1226]
          - listitem [ref=f1e1232]:
            - link "A Si Mariej faté buna, Dvimineata Bulz / Bihor, 1912" [ref=f1e1233] [cursor=pointer]:
              - /url: /song/rfm-4-95b?county=ro/crisana/bihor
              - generic [ref=f1e1234]: A Si Mariej faté buna, Dvimineata
              - generic [ref=f1e1237]:
                - generic [ref=f1e1238]: Bulz / Bihor,
                - text: "1912"
            - generic [ref=f1e1239]:
              - link "Open original record on Rumanian Folk Music (printed edition, Internet Archive scan)" [ref=f1e1240] [cursor=pointer]:
                - /url: https://archive.org/details/rumanianfolkmusi0004blab/page/n194
                - generic [ref=f1e1241]: M.F. 2013 b)
              - generic "has notation" [ref=f1e1245]
          - listitem [ref=f1e1251]:
            - link "A szebeni kapuba kiállott egy kislányka Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e1252] [cursor=pointer]:
              - /url: /song/bsys-10-12647?county=ro/crisana/bihor
              - generic [ref=f1e1253]: A szebeni kapuba kiállott egy kislányka
              - generic [ref=f1e1256]:
                - generic [ref=f1e1257]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=f1e1258]:
              - link "Open original record on The Bartók System" [ref=f1e1259] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/10/12647
                - generic [ref=f1e1260]: C 1053b
              - generic "has notation" [ref=f1e1264]
          - listitem [ref=f1e1270]:
            - link "A szegénység ütött nálam tanyát Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e1271] [cursor=pointer]:
              - /url: /song/bsys-33-6116?county=ro/crisana/bihor
              - generic [ref=f1e1272]: A szegénység ütött nálam tanyát
              - generic [ref=f1e1275]:
                - generic [ref=f1e1276]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=f1e1277]:
              - link "Open original record on The Bartók System" [ref=f1e1278] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/33/6116
                - generic [ref=f1e1279]: B 300b
              - generic "has notation" [ref=f1e1283]
          - listitem [ref=f1e1289]:
            - link "Asztalom, asztalom, szép kerek asztalom Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e1290] [cursor=pointer]:
              - /url: /song/bsys-35-8295?county=ro/crisana/bihor
              - generic [ref=f1e1291]: Asztalom, asztalom, szép kerek asztalom
              - generic [ref=f1e1294]:
                - generic [ref=f1e1295]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - link "Open original record on The Bartók System" [ref=f1e1297] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/35/8295
              - generic [ref=f1e1298]: B 1050b
          - listitem [ref=f1e1301]:
            - link "A temető kapujába Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e1302] [cursor=pointer]:
              - /url: /song/bsys-15-1183?county=ro/crisana/bihor
              - generic [ref=f1e1303]: A temető kapujába
              - generic [ref=f1e1306]:
                - generic [ref=f1e1307]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=f1e1308]:
              - link "Open original record on The Bartók System" [ref=f1e1309] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/15/1183
                - generic [ref=f1e1310]: A 418c
              - generic [ref=f1e1313]:
                - generic "has recording" [ref=f1e1314]
                - generic "has notation" [ref=f1e1319]
          - listitem [ref=f1e1325]:
            - link "A temető kapujában Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e1326] [cursor=pointer]:
              - /url: /song/bsys-15-2104?county=ro/crisana/bihor
              - generic [ref=f1e1327]: A temető kapujában
              - generic [ref=f1e1330]:
                - generic [ref=f1e1331]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=f1e1332]:
              - link "Open original record on The Bartók System" [ref=f1e1333] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/15/2104
                - generic [ref=f1e1334]: A 680c
              - generic "has notation" [ref=f1e1338]
          - listitem [ref=f1e1344]:
            - link "Atyafi, atyafi, atyafi Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e1345] [cursor=pointer]:
              - /url: /song/bsys-32-5914?county=ro/crisana/bihor
              - generic [ref=f1e1346]: Atyafi, atyafi, atyafi
              - generic [ref=f1e1349]:
                - generic [ref=f1e1350]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=f1e1351]:
              - link "Open original record on The Bartók System" [ref=f1e1352] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/32/5914
                - generic [ref=f1e1353]: B 248g
              - generic "has notation" [ref=f1e1357]
          - listitem [ref=f1e1363]:
            - link "Az a bajom, besorozott a német Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e1364] [cursor=pointer]:
              - /url: /song/bsys-25-4814?county=ro/crisana/bihor
              - generic [ref=f1e1365]: Az a bajom, besorozott a német
              - generic [ref=f1e1368]:
                - generic [ref=f1e1369]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - generic [ref=f1e1370]:
              - link "Open original record on The Bartók System" [ref=f1e1371] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/25/4814
                - generic [ref=f1e1372]: A 1490h
              - generic [ref=f1e1375]:
                - generic "has recording" [ref=f1e1376]
                - generic "has notation" [ref=f1e1381]
          - listitem [ref=f1e1387]:
            - link "Az én házam talpa Ginta (Gyanta) / Bihor, 1912" [ref=f1e1388] [cursor=pointer]:
              - /url: /song/bsys-13-175?county=ro/crisana/bihor
              - generic [ref=f1e1389]: Az én házam talpa
              - generic [ref=f1e1392]:
                - generic [ref=f1e1393]: Ginta (Gyanta) / Bihor,
                - text: "1912"
            - generic [ref=f1e1394]:
              - link "Open original record on The Bartók System" [ref=f1e1395] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/13/175
                - generic [ref=f1e1396]: A 65a
              - generic [ref=f1e1399]:
                - generic "has recording" [ref=f1e1400]
                - generic "has notation" [ref=f1e1405]
          - listitem [ref=f1e1411]:
            - link "Az én libám fekete Tărcaia (Köröstárkány) / Bihor, 1912" [ref=f1e1412] [cursor=pointer]:
              - /url: /song/bsys-14-986?county=ro/crisana/bihor
              - generic [ref=f1e1413]: Az én libám fekete
              - generic [ref=f1e1416]:
                - generic [ref=f1e1417]: Tărcaia (Köröstárkány) / Bihor,
                - text: "1912"
            - generic [ref=f1e1418]:
              - link "Open original record on The Bartók System" [ref=f1e1419] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/14/986
                - generic [ref=f1e1420]: A 335
              - generic [ref=f1e1423]:
                - generic "has recording" [ref=f1e1424]
                - generic "has notation" [ref=f1e1429]
          - listitem [ref=f1e1435]:
            - link "Az idén, az idén Ginta (Gyanta) / Bihor, 1912" [ref=f1e1436] [cursor=pointer]:
              - /url: /song/bsys-45-10353?county=ro/crisana/bihor
              - generic [ref=f1e1437]: Az idén, az idén
              - generic [ref=f1e1440]:
                - generic [ref=f1e1441]: Ginta (Gyanta) / Bihor,
                - text: "1912"
            - generic [ref=f1e1442]:
              - link "Open original record on The Bartók System" [ref=f1e1443] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/45/10353
                - generic [ref=f1e1444]: C 136b
              - generic [ref=f1e1447]:
                - generic "has recording" [ref=f1e1448]
                - generic "has notation" [ref=f1e1453]
          - listitem [ref=f1e1459]:
            - link "Az ökör a földet nem magának szántja Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e1460] [cursor=pointer]:
              - /url: /song/bsys-35-8233?county=ro/crisana/bihor
              - generic [ref=f1e1461]: Az ökör a földet nem magának szántja
              - generic [ref=f1e1464]:
                - generic [ref=f1e1465]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - link "Open original record on The Bartók System" [ref=f1e1467] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/35/8233
              - generic [ref=f1e1468]: B 1035
          - listitem [ref=f1e1471]:
            - link "„Az ökör a földet [nem magának szántja]” – tambourine Salonta (Nagyszalonta) / Bihor, 1916" [ref=f1e1472] [cursor=pointer]:
              - /url: /song/bsys-82-13131?county=ro/crisana/bihor
              - generic [ref=f1e1473]: „Az ökör a földet [nem magának szántja]” – tambourine
              - generic [ref=f1e1476]:
                - generic [ref=f1e1477]: Salonta (Nagyszalonta) / Bihor,
                - text: "1916"
            - link "Open original record on The Bartók System" [ref=f1e1479] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/82/13131
              - generic [ref=f1e1480]: F 42
          - listitem [ref=f1e1483]:
            - link "Az orosi gulyásbojtár Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e1484] [cursor=pointer]:
              - /url: /song/bsys-31-5599?county=ro/crisana/bihor
              - generic [ref=f1e1485]: Az orosi gulyásbojtár
              - generic [ref=f1e1488]:
                - generic [ref=f1e1489]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=f1e1490]:
              - link "Open original record on The Bartók System" [ref=f1e1491] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/31/5599
                - generic [ref=f1e1492]: B 145
              - generic "has notation" [ref=f1e1496]
          - listitem [ref=f1e1502]:
            - link "Az orosi halom alatt Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e1503] [cursor=pointer]:
              - /url: /song/bsys-15-1424?county=ro/crisana/bihor
              - generic [ref=f1e1504]: Az orosi halom alatt
              - generic [ref=f1e1507]:
                - generic [ref=f1e1508]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=f1e1509]:
              - link "Open original record on The Bartók System" [ref=f1e1510] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/15/1424
                - generic [ref=f1e1511]: A 499b
              - generic [ref=f1e1514]:
                - generic "has recording" [ref=f1e1515]
                - generic "has notation" [ref=f1e1520]
          - listitem [ref=f1e1526]:
            - link "Az orosi pusztáról fúj a szél Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e1527] [cursor=pointer]:
              - /url: /song/bsys-17-2915?county=ro/crisana/bihor
              - generic [ref=f1e1528]: Az orosi pusztáról fúj a szél
              - generic [ref=f1e1531]:
                - generic [ref=f1e1532]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - generic [ref=f1e1533]:
              - link "Open original record on The Bartók System" [ref=f1e1534] [cursor=pointer]:
                - /url: https://systems.zti.hu/br/en/browse/17/2915
                - generic [ref=f1e1535]: A 978b
              - generic [ref=f1e1538]:
                - generic "has recording" [ref=f1e1539]
                - generic "has notation" [ref=f1e1544]
          - listitem [ref=f1e1550]:
            - link "Azt a keserves mindenét az apádnak, mit mondtál Salonta (Nagyszalonta) / Bihor, 1917" [ref=f1e1551] [cursor=pointer]:
              - /url: /song/bsys-51-10509?county=ro/crisana/bihor
              - generic [ref=f1e1552]: Azt a keserves mindenét az apádnak, mit mondtál
              - generic [ref=f1e1555]:
                - generic [ref=f1e1556]: Salonta (Nagyszalonta) / Bihor,
                - text: "1917"
            - link "Open original record on The Bartók System" [ref=f1e1558] [cursor=pointer]:
              - /url: https://systems.zti.hu/br/en/browse/51/10509
              - generic [ref=f1e1559]: C 204c
        - navigation "Results pages" [ref=f1e1562]:
          - button "Previous page" [disabled] [ref=f1e1563]: ←
          - generic [ref=f1e1564]:
            - generic [ref=f1e1565]: Go to page
            - spinbutton "Go to page" [ref=f1e1566]: "1"
          - generic [ref=f1e1567]: Page 1 of 9
          - button "Next page" [ref=f1e1568] [cursor=pointer]: →
  - status "Query status" [ref=f1e1569]:
    - code [ref=f1e1570]: "?county=ro/crisana/bihor"
    - button "Copy link" [ref=f1e1571] [cursor=pointer]
    - generic [ref=f1e1572]: 436 of 4,072 melodies, 4 not mapped
    - button "Export 436 melodies as JSON" [ref=f1e1573] [cursor=pointer]: Export JSON
  - contentinfo [ref=f1e1574]:
    - paragraph [ref=f1e1575]:
      - text: "Data: HUN-REN BTK Institute for Musicology, Budapest (Bartok Archives):"
      - generic [ref=f1e1576]:
        - text: "\""
        - link "Folk Music in Bartók's Compositions" [ref=f1e1577] [cursor=pointer]:
          - /url: https://bartok-nepzene.zti.hu/en/
        - text: "\""
      - generic [ref=f1e1578]:
        - text: ", \""
        - link "The Bartók System" [ref=f1e1579] [cursor=pointer]:
          - /url: https://systems.zti.hu/br/en
        - text: "\""
      - generic [ref=f1e1580]:
        - text: and "
        - link "Béla Bartók, the Ethnomusicologist" [ref=f1e1581] [cursor=pointer]:
          - /url: https://bartok-gyujtesek.zti.hu/en
        - text: "\""
      - text: .
    - paragraph [ref=f1e1582]: Records, notation images and recordings remain the property of the Institute; this viewer is an independent interface and is not affiliated with it.
    - paragraph [ref=f1e1583]:
      - text: "Printed edition: Bela Bartok, Rumanian Folk Music (ed. Benjamin Suchoff, Martinus Nijhoff, 1967-1975),"
      - link "open volumes on the Internet Archive" [ref=f1e1584] [cursor=pointer]:
        - /url: https://archive.org/details/rumanianfolkmusi0004blab
      - text: ; only facts and incipits are indexed.
    - paragraph [ref=f1e1585]:
      - text: "Map: ©"
      - link "OpenStreetMap" [ref=f1e1586] [cursor=pointer]:
        - /url: https://www.openstreetmap.org/copyright
      - text: contributors, ©
      - link "CARTO" [ref=f1e1587] [cursor=pointer]:
        - /url: https://carto.com/attributions
      - text: ". County boundaries: Natural Earth."
    - paragraph [ref=f1e1588]:
      - link "About and sources" [ref=f1e1589] [cursor=pointer]:
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