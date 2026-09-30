// Image probe: fetch the first bytes of every record image (Range request, 1 req/s) to read its
// pixel size, so the build can tell a notation scan from a newspaper masthead banner.
// Writes raw/afs/images.json: { url: { width, height, type, bytes, status } }.
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import { PATHS, USER_AGENT, readJson, writeJson, sleep } from './util.js';

if (process.env.HTTPS_PROXY || process.env.https_proxy) {
  try {
    setGlobalDispatcher(new EnvHttpProxyAgent());
  } catch {
    // direct
  }
}

export function imageSize(buf) {
  const b = Buffer.from(buf);
  if (b.length >= 24 && b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return { type: 'png', width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.length >= 10 && b.toString('ascii', 0, 3) === 'GIF') return { type: 'gif', width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) return { type: 'jpeg', width: null, height: null };
  return { type: null, width: null, height: null };
}

export async function probeImages(log = () => {}) {
  const dir = path.join(PATHS.raw, 'afs');
  const records = await readJson(path.join(dir, 'records.json'));
  const out = await readJson(path.join(dir, 'images.json'), {});
  const urls = [...new Set(records.flatMap((r) => r.media.notation))].sort();
  let n = 0;
  for (const url of urls) {
    if (out[url] && out[url].status === 200) continue;
    let entry;
    try {
      const r = await fetch(url, { headers: { 'user-agent': USER_AGENT, range: 'bytes=0-63' } });
      const buf = await r.arrayBuffer();
      const len = r.headers.get('content-range') ? parseInt(r.headers.get('content-range').split('/')[1], 10) : parseInt(r.headers.get('content-length') || '0', 10);
      entry = { status: r.status === 206 ? 200 : r.status, bytes: Number.isFinite(len) ? len : null, ...imageSize(buf) };
    } catch (e) {
      entry = { status: 0, error: String(e.message || e), type: null, width: null, height: null, bytes: null };
    }
    out[url] = entry;
    n += 1;
    if (n % 50 === 0) {
      await writeJson(path.join(dir, 'images.json'), out);
      log(`images ${n}/${urls.length}`);
    }
    await sleep(1000);
  }
  await writeJson(path.join(dir, 'images.json'), out);
  log(`probed ${n} images (${urls.length} total)`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  probeImages((m) => console.error(`[${new Date().toISOString()}] ${m}`)).then(() => process.exit(0));
}
