import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Fetcher, parseRobots, robotsAllows, robotsCrawlDelay, cachePathFor } from '../src/fetch.js';

test('robots.txt parsing: group selection, longest match, crawl-delay', () => {
  const groups = parseRobots(`User-agent: Googlebot\nAllow: /\nDisallow: /admin/\n\nUser-agent: *\nDisallow: /\n`);
  assert.equal(groups.length, 2);
  assert.equal(robotsAllows(groups, '/br/en/browse/12/'), false);
  assert.equal(robotsAllows(groups, '/br/en/browse/12/', 'Googlebot/2.1'), true);
  assert.equal(robotsAllows(groups, '/admin/x', 'Googlebot/2.1'), false);
  const g2 = parseRobots(`User-agent: *\nDisallow: /private/\nAllow: /private/ok\nCrawl-delay: 5\n`);
  assert.equal(robotsAllows(g2, '/private/secret'), false);
  assert.equal(robotsAllows(g2, '/private/ok/page'), true);
  assert.equal(robotsAllows(g2, '/en/browse/'), true);
  assert.equal(robotsCrawlDelay(g2), 5);
  assert.equal(robotsAllows([], '/anything'), true);
});

test('cache path is host + sha1(url)', () => {
  const p = cachePathFor('https://bartok-nepzene.zti.hu/en/browse/', '/tmp/c');
  assert.match(p.html, /^\/tmp\/c\/bartok-nepzene\.zti\.hu\/[0-9a-f]{40}\.html$/);
  assert.match(p.meta, /\.json$/);
});

test('fetcher: throttles, caches to disk, retries 5xx, honours robots', async () => {
  const hits = [];
  let fail = 1;
  const server = http.createServer((req, res) => {
    hits.push({ url: req.url, ua: req.headers['user-agent'], t: Date.now() });
    if (req.url === '/robots.txt') {
      res.setHeader('content-type', 'text/plain');
      return res.end('User-agent: *\nDisallow: /secret/\n');
    }
    if (req.url === '/flaky' && fail-- > 0) {
      res.statusCode = 503;
      return res.end('busy');
    }
    res.setHeader('content-type', 'text/html');
    res.end(`<html><title>${req.url}</title></html>`);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bartok-cache-'));
  try {
    const f = new Fetcher({ cacheDir: dir, minIntervalMs: 120, retries: 2 });
    // patch backoff so the 503 retry does not wait 60 s in tests
    const t0 = Date.now();
    const a = await f.fetchText(`${base}/a`);
    const b = await f.fetchText(`${base}/b`);
    assert.equal(a.ok, true);
    assert.equal(a.fromCache, false);
    assert.equal(b.ok, true);
    assert.ok(Date.now() - t0 >= 240, 'three live requests (robots, a, b) must be spaced by minInterval');
    assert.match(hits[0].ua, /BartokRomaniaViewer/);
    const a2 = await f.fetchText(`${base}/a`);
    assert.equal(a2.fromCache, true);
    assert.equal(a2.html, a.html);
    assert.equal(hits.filter((h) => h.url === '/a').length, 1, 'second fetch served from cache');
    const meta = JSON.parse(await fs.readFile(cachePathFor(`${base}/a`, dir).meta, 'utf8'));
    assert.equal(meta.status, 200);
    assert.ok(meta.fetchedAt);
    const blocked = await f.fetchText(`${base}/secret/x`);
    assert.equal(blocked.ok, false);
    assert.match(blocked.error, /robots/);
    assert.equal(hits.filter((h) => h.url.startsWith('/secret')).length, 0);
    const off = new Fetcher({ cacheDir: dir, offline: true });
    assert.equal((await off.fetchText(`${base}/a`)).fromCache, true);
    assert.equal((await off.fetchText(`${base}/never`)).ok, false);
    const ignoring = new Fetcher({ cacheDir: dir, minIntervalMs: 10, respectRobots: false });
    assert.equal((await ignoring.fetchText(`${base}/secret/x`)).ok, true);
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('fetcher retries a 503 with a 60 s backoff (backoff stubbed)', async () => {
  let n = 0;
  const server = http.createServer((req, res) => {
    n += 1;
    if (n === 1) {
      res.statusCode = 503;
      return res.end('busy');
    }
    res.setHeader('content-type', 'text/html');
    res.end('<html>ok</html>');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bartok-cache-'));
  try {
    const f = new Fetcher({ cacheDir: dir, minIntervalMs: 10, retries: 1, respectRobots: false });
    const waits = [];
    // Intercept the sleep used for backoff by monkey-patching global setTimeout for large delays.
    const realSetTimeout = global.setTimeout;
    global.setTimeout = (fn, ms, ...rest) => {
      if (ms >= 60000) {
        waits.push(ms);
        return realSetTimeout(fn, 5, ...rest);
      }
      return realSetTimeout(fn, ms, ...rest);
    };
    try {
      const r = await f.fetchText(`http://127.0.0.1:${server.address().port}/flaky`);
      assert.equal(r.ok, true);
      assert.equal(n, 2);
      assert.deepEqual(waits, [60000]);
    } finally {
      global.setTimeout = realSetTimeout;
    }
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});
