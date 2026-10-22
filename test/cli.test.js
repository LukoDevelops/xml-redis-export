'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, run } = require('../src/cli');
const { FakeRedis } = require('./fake-redis');

const XML = `<config>
  <subdomains><subdomain>http://a.com</subdomain></subdomains>
  <cookies><cookie name="dlp-avast" host="amazon">mmm_amz</cookie></cookies>
</config>`;

test('parseArgs: path only', () => {
  assert.deepEqual(parseArgs(['/data/config.xml']), { verbose: false, file: '/data/config.xml' });
});

test('parseArgs: -v before or after the path', () => {
  assert.deepEqual(parseArgs(['-v', 'x.xml']), { verbose: true, file: 'x.xml' });
  assert.deepEqual(parseArgs(['x.xml', '-v']), { verbose: true, file: 'x.xml' });
});

test('parseArgs: rejects missing path, extra paths and unknown flags', () => {
  assert.throws(() => parseArgs([]), /exactly one/);
  assert.throws(() => parseArgs(['-v']), /exactly one/);
  assert.throws(() => parseArgs(['a.xml', 'b.xml']), /exactly one/);
  assert.throws(() => parseArgs(['-x', 'a.xml']), /Unknown option/);
});

test('run with -v saves keys and prints each of them', async () => {
  const redis = new FakeRedis();
  const lines = [];

  await run(['-v', 'config.xml'], { readFile: async () => XML, redis, log: (l) => lines.push(l) });

  assert.equal(redis.store.get('subdomains'), '["http://a.com"]');
  assert.equal(redis.store.get('cookie:dlp-avast:amazon'), 'mmm_amz');
  assert.deepEqual(lines, [
    'subdomains = ["http://a.com"]',
    'cookie:dlp-avast:amazon = mmm_amz',
    'Exported 2 keys to Redis.',
  ]);
});

test('run without -v prints only the summary', async () => {
  const lines = [];
  await run(['config.xml'], { readFile: async () => XML, redis: new FakeRedis(), log: (l) => lines.push(l) });
  assert.deepEqual(lines, ['Exported 2 keys to Redis.']);
});

test('run does not touch Redis when the XML is invalid', async () => {
  const redis = new FakeRedis();
  await assert.rejects(
    run(['bad.xml'], { readFile: async () => '<config>', redis, log: () => {} }),
    /Invalid XML/,
  );
  assert.equal(redis.transactions, 0);
});
