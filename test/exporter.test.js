'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildEntries, saveEntries } = require('../src/exporter');
const { FakeRedis } = require('./fake-redis');

test('buildEntries creates subdomains JSON and cookie keys', () => {
  const entries = buildEntries({
    subdomains: ['http://a.com', 'https://b.com'],
    cookies: [
      { name: 'dlp-avast', host: 'amazon', value: 'mmm_amz_dlp_777_ppc_m' },
      { name: 'dlp-avg', host: 'amazon', value: 'mmm_amz_dlp_779_ppc_m' },
    ],
  });

  assert.deepEqual([...entries], [
    ['subdomains', '["http://a.com","https://b.com"]'],
    ['cookie:dlp-avast:amazon', 'mmm_amz_dlp_777_ppc_m'],
    ['cookie:dlp-avg:amazon', 'mmm_amz_dlp_779_ppc_m'],
  ]);
});

test('buildEntries stores an empty JSON array when there are no subdomains', () => {
  const entries = buildEntries({ subdomains: [], cookies: [] });
  assert.equal(entries.get('subdomains'), '[]');
  assert.equal(entries.size, 1);
});

test('buildEntries: a later duplicate cookie overwrites the earlier one', () => {
  const entries = buildEntries({
    subdomains: [],
    cookies: [
      { name: 'n', host: 'h', value: 'first' },
      { name: 'n', host: 'h', value: 'second' },
    ],
  });
  assert.equal(entries.get('cookie:n:h'), 'second');
});

test('saveEntries writes every entry in one transaction', async () => {
  const redis = new FakeRedis();
  const entries = new Map([['subdomains', '[]'], ['cookie:a:b', 'c']]);

  const keys = await saveEntries(redis, entries);

  assert.deepEqual(keys, ['subdomains', 'cookie:a:b']);
  assert.equal(redis.store.get('cookie:a:b'), 'c');
  assert.equal(redis.transactions, 1);
});

test('saveEntries propagates Redis errors', async () => {
  const redis = new FakeRedis({ failOnExec: true });
  await assert.rejects(saveEntries(redis, new Map([['k', 'v']])), /EXEC failed/);
  assert.equal(redis.store.size, 0);
});
