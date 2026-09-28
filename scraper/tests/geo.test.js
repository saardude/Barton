import test from 'node:test';
import assert from 'node:assert/strict';
import { setBorders, countryFromPoint, pointInGeometry } from '../src/geo.js';

test('point in polygon / multipolygon with holes', () => {
  const square = { type: 'Polygon', coordinates: [[[20, 45], [30, 45], [30, 48], [20, 48], [20, 45]], [[24, 46], [26, 46], [26, 47], [24, 47], [24, 46]]] };
  assert.equal(pointInGeometry(square, 45.5, 21), true);
  assert.equal(pointInGeometry(square, 46.5, 25), false, 'inside the hole');
  assert.equal(pointInGeometry({ type: 'MultiPolygon', coordinates: [square.coordinates] }, 47.5, 29), true);
  assert.equal(pointInGeometry(square, 50, 25), false);
});

test('countryFromPoint uses injected borders and returns null when unknown', () => {
  setBorders([{ code: 'RO', geometry: { type: 'Polygon', coordinates: [[[20, 43.5], [30, 43.5], [30, 48.5], [20, 48.5], [20, 43.5]]] } }, { code: 'HU', geometry: { type: 'Polygon', coordinates: [[[16, 45.5], [20, 45.5], [20, 48.5], [16, 48.5], [16, 45.5]]] } }]);
  assert.equal(countryFromPoint(46.66, 22.35), 'RO');
  assert.equal(countryFromPoint(47.5, 19.0), 'HU');
  assert.equal(countryFromPoint(55, 10), null);
  assert.equal(countryFromPoint(null, 10), null);
  setBorders(null);
});
