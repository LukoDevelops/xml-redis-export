'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseConfig } = require('../src/parser');

test('parses subdomains and cookies', () => {
  const xml = `
    <config>
      <subdomains>
        <subdomain>http://a.example.com</subdomain>
        <subdomain> https://b.example.com </subdomain>
      </subdomains>
      <cookies>
        <!-- comment is ignored -->
        <cookie name="dlp" host="amazon">val_1</cookie>
        <cookie name="dlp" host="01net">val_2</cookie>
      </cookies>
    </config>`;

  assert.deepEqual(parseConfig(xml), {
    subdomains: ['http://a.example.com', 'https://b.example.com'],
    cookies: [
      { name: 'dlp', host: 'amazon', value: 'val_1' },
      { name: 'dlp', host: '01net', value: 'val_2' }, // stays a string, not the number 1
    ],
  });
});

test('single subdomain / cookie still produce arrays', () => {
  const xml = `<config>
      <subdomains><subdomain>http://only.one</subdomain></subdomains>
      <cookies><cookie name="n" host="h">v</cookie></cookies>
    </config>`;
  const result = parseConfig(xml);
  assert.deepEqual(result.subdomains, ['http://only.one']);
  assert.deepEqual(result.cookies, [{ name: 'n', host: 'h', value: 'v' }]);
});

test('missing sections give empty lists', () => {
  assert.deepEqual(parseConfig('<config></config>'), { subdomains: [], cookies: [] });
});

test('empty cookie value is kept as empty string', () => {
  const { cookies } = parseConfig('<config><cookies><cookie name="n" host="h"></cookie></cookies></config>');
  assert.deepEqual(cookies, [{ name: 'n', host: 'h', value: '' }]);
});

test('throws on malformed XML', () => {
  assert.throws(() => parseConfig('<config><subdomains></config>'), /Invalid XML/);
});

test('throws when root element is not <config>', () => {
  assert.throws(() => parseConfig('<other/>'), /missing <config>/);
});

test('throws on cookie without host attribute', () => {
  const xml = '<config><cookies><cookie name="n">v</cookie></cookies></config>';
  assert.throws(() => parseConfig(xml), /cookie #1 is missing/);
});

test('parses the provided config.xml', () => {
  const xml = fs.readFileSync(path.join(__dirname, '..', 'data', 'config.xml'), 'utf8');
  const { subdomains, cookies } = parseConfig(xml);

  assert.equal(subdomains.length, 38);
  assert.equal(subdomains[0], 'http://secureline.tools.avast.com');
  assert.equal(subdomains.at(-1), 'https://bits.avcdn.net');

  assert.equal(cookies.length, 46);
  assert.deepEqual(cookies[0], { name: 'dlp-avast', host: 'amazon', value: 'mmm_amz_dlp_777_ppc_m' });
});
