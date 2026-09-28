import { chromium } from 'playwright'
const out = '/tmp/claude-0/-home-user-Barton/ece056fb-e580-5d13-9138-c521b4d23aaf/scratchpad'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text().slice(0, 300)}`) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
const shots = [
  ['route', '/journeys?trip=J-1938-05-02'],
  ['route-both', '/journeys?trip=J-1938-05-02&borders=both&stop=2'],
  ['index-1910', '/journeys?trip=gyuj-50'],
  ['none', '/journeys'],
  ['date', '/journeys?date=1911-02'],
]
for (const [name, url] of shots) {
  await page.goto('http://localhost:4173' + url)
  await page.waitForSelector('.journeys', { timeout: 30000 })
  await page.waitForTimeout(3500)
  await page.screenshot({ path: `${out}/${name}.png` })
  const info = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent,
    legend: document.querySelector('.journey-legend')?.textContent?.slice(0, 300),
    attribution: document.querySelector('.leaflet-control-attribution')?.textContent?.slice(0, 400),
    stops: document.querySelectorAll('button.stop-marker').length,
    routeLines: document.querySelectorAll('path.route-line').length,
    arrows: document.querySelectorAll('.route-arrow').length,
    borderPaths: document.querySelectorAll('path.border-line').length,
    thenClip: document.querySelector('.pane-borders-then')?.style.clipPath?.slice(0, 80),
    status: document.querySelector('.statusbar__query')?.textContent,
    marks: document.querySelectorAll('.timeline__mark').length,
    toggle: document.querySelector('.border-toggle')?.textContent?.slice(0, 200),
  }))
  console.log(name, JSON.stringify(info, null, 1))
}
// keyboard: [ ] on the map, arrow on the timeline
await page.goto('http://localhost:4173/journeys?trip=J-1938-05-02')
await page.waitForSelector('button.stop-marker')
await page.focus('.journey-map__view')
await page.keyboard.press(']')
await page.waitForTimeout(300)
console.log('after ]:', await page.evaluate(() => document.querySelector('.statusbar__query')?.textContent), 'focused:', await page.evaluate(() => document.activeElement?.getAttribute('aria-label')))
await page.click('.timeline__mark.is-selected')
await page.waitForTimeout(300)
console.log('after mark click (deselect):', await page.evaluate(() => document.querySelector('.statusbar__query')?.textContent))
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none')
await browser.close()
