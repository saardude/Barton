// Polite fetcher (adapted from ../../scraper/src/fetch.js): 1 request per second per host, retries with exponential backoff,
// on-disk HTML cache (cache/<host>/<sha1(url)>.html + .json sidecar), robots.txt.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import { PATHS, USER_AGENT, sha1, sleep } from './util.js';

// Node's built-in fetch ignores HTTPS_PROXY/NO_PROXY; route it through the env proxy when one is set
// (the container's egress works only through it). Equivalent to NODE_USE_ENV_PROXY=1.
if (process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy) {
  try {
    setGlobalDispatcher(new EnvHttpProxyAgent());
  } catch {
    // older undici without EnvHttpProxyAgent: fall back to direct connections
  }
}

const UA_TOKEN = 'CulegeriAustralia';

/**
 * Decode a response body honouring the declared charset. folkstream.com pages are
 * iso-8859-1 (declared in a meta tag, not always in the header); decoding them as UTF-8
 * would mangle pound signs and curly quotes. windows-1252 is a superset of iso-8859-1.
 */
export function decodeBody(buf, contentType = '') {
  const bytes = new Uint8Array(buf);
  const headerCs = /charset=["']?([\w-]+)/i.exec(contentType || '');
  let charset = headerCs ? headerCs[1].toLowerCase() : null;
  if (!charset) {
    const head = new TextDecoder('latin1').decode(bytes.subarray(0, 4096));
    const metaCs = /charset=["']?([\w-]+)/i.exec(head);
    if (metaCs) charset = metaCs[1].toLowerCase();
  }
  if (charset && /^(iso-?8859-?1|latin-?1|windows-?1252|cp1252|us-?ascii)$/.test(charset)) {
    return new TextDecoder('windows-1252').decode(bytes);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

/** Minimal robots.txt parser: returns groups of {agents[], allow[], disallow[], crawlDelay}. */
export function parseRobots(text) {
  const groups = [];
  let cur = null;
  let lastWasAgent = false;
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === 'user-agent') {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], allow: [], disallow: [], crawlDelay: null };
        groups.push(cur);
      }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!cur) continue;
    if (key === 'disallow') {
      if (val) cur.disallow.push(val);
    } else if (key === 'allow') {
      if (val) cur.allow.push(val);
    } else if (key === 'crawl-delay') {
      const n = parseFloat(val);
      if (!Number.isNaN(n)) cur.crawlDelay = n;
    }
  }
  return groups;
}

function pickGroup(groups, uaToken) {
  const token = uaToken.toLowerCase();
  const specific = groups.find((g) => g.agents.some((a) => a !== '*' && token.includes(a)));
  if (specific) return specific;
  return groups.find((g) => g.agents.includes('*')) || null;
}

function ruleMatches(rule, pathname) {
  // Support trailing $ and * wildcards, as in Google's robots spec.
  let re = rule.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  if (re.endsWith('\\$')) re = re.slice(0, -2) + '$';
  return new RegExp('^' + re).test(pathname);
}

/** True when robots.txt (parsed groups) permits fetching pathname for our UA. */
export function robotsAllows(groups, pathname, uaToken = UA_TOKEN) {
  const g = pickGroup(groups, uaToken);
  if (!g) return true;
  let best = null;
  for (const r of g.allow) if (ruleMatches(r, pathname) && (!best || r.length > best.rule.length)) best = { rule: r, allow: true };
  for (const r of g.disallow) if (ruleMatches(r, pathname) && (!best || r.length > best.rule.length)) best = { rule: r, allow: false };
  return best ? best.allow : true;
}

export function robotsCrawlDelay(groups, uaToken = UA_TOKEN) {
  const g = pickGroup(groups, uaToken);
  return g && g.crawlDelay ? g.crawlDelay : null;
}

export function cachePathFor(url, cacheDir = PATHS.cache) {
  const u = new URL(url);
  const base = path.join(cacheDir, u.host, sha1(url));
  return { html: base + '.html', meta: base + '.json' };
}

export class Fetcher {
  /**
   * @param {object} opts
   * @param {string} [opts.cacheDir]
   * @param {number} [opts.minIntervalMs=1000] minimum spacing between live requests per host
   * @param {number} [opts.retries=4]
   * @param {number} [opts.timeoutMs=30000]
   * @param {boolean} [opts.offline=false] never hit the network; cache misses return ok:false
   * @param {boolean} [opts.respectRobots=true]
   * @param {(msg:string)=>void} [opts.log]
   */
  constructor(opts = {}) {
    this.cacheDir = opts.cacheDir || PATHS.cache;
    this.minIntervalMs = opts.minIntervalMs ?? 1000;
    this.retries = opts.retries ?? 4;
    this.timeoutMs = opts.timeoutMs ?? 30000;
    this.offline = !!opts.offline;
    this.respectRobots = opts.respectRobots ?? true;
    this.userAgent = opts.userAgent || USER_AGENT;
    this.log = opts.log || (() => {});
    this.lastRequestAt = new Map(); // host -> timestamp
    this.robots = new Map(); // host -> groups | null
    this.stats = { live: 0, cached: 0, failed: 0, blocked: 0 };
  }

  async readCache(url) {
    const p = cachePathFor(url, this.cacheDir);
    try {
      const [html, metaText] = await Promise.all([fs.readFile(p.html, 'utf8'), fs.readFile(p.meta, 'utf8').catch(() => null)]);
      const meta = metaText ? JSON.parse(metaText) : {};
      return { ok: true, status: meta.status ?? 200, html, url, finalUrl: meta.finalUrl || url, fetchedAt: meta.fetchedAt || null, fromCache: true };
    } catch {
      return null;
    }
  }

  async writeCache(url, res) {
    const p = cachePathFor(url, this.cacheDir);
    await fs.mkdir(path.dirname(p.html), { recursive: true });
    await fs.writeFile(p.html, res.html, 'utf8');
    await fs.writeFile(p.meta, JSON.stringify({ url, finalUrl: res.finalUrl, status: res.status, fetchedAt: res.fetchedAt, contentType: res.contentType }, null, 2), 'utf8');
  }

  async throttle(host, extraDelayMs = 0) {
    const last = this.lastRequestAt.get(host) || 0;
    const wait = Math.max(this.minIntervalMs, extraDelayMs) - (Date.now() - last);
    if (wait > 0) await sleep(wait);
    this.lastRequestAt.set(host, Date.now());
  }

  async robotsFor(url) {
    const u = new URL(url);
    if (this.robots.has(u.host)) return this.robots.get(u.host);
    this.robots.set(u.host, null); // avoid recursion while loading
    const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
    const res = await this.fetchRaw(robotsUrl, { isRobots: true });
    let groups = null;
    if (res.ok && /text\/plain/i.test(res.contentType || '')) groups = parseRobots(res.html);
    else if (res.ok && res.html && !/<html/i.test(res.html.slice(0, 500))) groups = parseRobots(res.html);
    this.robots.set(u.host, groups);
    return groups;
  }

  /** Low-level fetch with retries; no robots, no cache. */
  async fetchRaw(url, { isRobots = false } = {}) {
    const host = new URL(url).host;
    let attempt = 0;
    let lastErr = null;
    while (attempt <= this.retries) {
      await this.throttle(host);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      try {
        const r = await fetch(url, { headers: { 'user-agent': this.userAgent, accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5' }, redirect: 'follow', signal: ctrl.signal });
        clearTimeout(timer);
        const contentType = r.headers.get('content-type') || '';
        const html = decodeBody(await r.arrayBuffer(), contentType);
        const out = { ok: r.ok, status: r.status, html, url, finalUrl: r.url || url, fetchedAt: new Date().toISOString(), contentType, fromCache: false };
        if (r.status === 429 || (r.status >= 500 && r.status < 600)) {
          lastErr = new Error(`HTTP ${r.status}`);
          lastErr.status = r.status;
        } else {
          return out;
        }
      } catch (e) {
        clearTimeout(timer);
        lastErr = e;
      }
      attempt += 1;
      if (attempt > this.retries) break;
      // 429 / 503 mean "slow down": back off a full 60 s. Other failures: exponential, capped at 60 s.
      const overloaded = lastErr && (lastErr.status === 429 || lastErr.status === 503);
      const backoff = overloaded ? 60000 : Math.min(60000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 500);
      this.log(`retry ${attempt}/${this.retries} for ${url} after ${backoff}ms (${lastErr && lastErr.message})`);
      await sleep(backoff);
    }
    return { ok: false, status: 0, html: null, url, finalUrl: url, fetchedAt: new Date().toISOString(), error: lastErr ? String(lastErr.message || lastErr) : 'unknown', fromCache: false, isRobots };
  }

  /**
   * Fetch a page through cache + robots + throttle.
   * @returns {Promise<{ok:boolean,status:number,html:string|null,url:string,finalUrl:string,fetchedAt:string|null,fromCache:boolean,error?:string}>}
   */
  async fetchText(url, { force = false } = {}) {
    if (!force) {
      const cached = await this.readCache(url);
      if (cached) {
        this.stats.cached += 1;
        return cached;
      }
    }
    if (this.offline) {
      this.stats.failed += 1;
      return { ok: false, status: 0, html: null, url, finalUrl: url, fetchedAt: null, fromCache: false, error: 'offline: not in cache' };
    }
    const u = new URL(url);
    let extraDelay = 0;
    if (this.respectRobots) {
      const groups = await this.robotsFor(url);
      if (groups && !robotsAllows(groups, u.pathname + u.search, this.userAgent)) {
        this.stats.blocked += 1;
        this.log(`robots.txt disallows ${url}`);
        return { ok: false, status: 0, html: null, url, finalUrl: url, fetchedAt: null, fromCache: false, error: 'blocked by robots.txt' };
      }
      const delay = groups ? robotsCrawlDelay(groups, this.userAgent) : null;
      if (delay) extraDelay = delay * 1000;
    }
    if (extraDelay) await this.throttle(u.host, extraDelay);
    const res = await this.fetchRaw(url);
    if (res.ok && typeof res.html === 'string') {
      this.stats.live += 1;
      await this.writeCache(url, res);
    } else {
      this.stats.failed += 1;
      this.log(`fetch failed ${res.status} ${url} ${res.error || ''}`);
    }
    return res;
  }
}

export default Fetcher;
