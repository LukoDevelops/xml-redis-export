'use strict';

const { XMLParser, XMLValidator } = require('fast-xml-parser');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false, // keep "01net" as a string, not the number 1
  parseAttributeValue: false,
  trimValues: true,
  isArray: (name) => name === 'subdomain' || name === 'cookie', // arrays even for a single item
});

// Parses the config XML into { subdomains, cookies }.
function parseConfig(xml) {
  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    const { msg, line } = validation.err;
    throw new Error(`Invalid XML (line ${line}): ${msg}`);
  }

  const doc = parser.parse(xml);
  if (!doc || !('config' in doc)) {
    throw new Error('Invalid config: missing <config> root element');
  }
  const config = typeof doc.config === 'object' ? doc.config : {}; // empty <config/> parses as ''

  const subdomains = (config.subdomains?.subdomain ?? [])
    .map(textOf)
    .filter((s) => s !== '');

  const cookies = (config.cookies?.cookie ?? []).map((c, i) => {
    const name = c?.['@_name'];
    const host = c?.['@_host'];
    if (!name || !host) {
      throw new Error(`Invalid config: cookie #${i + 1} is missing "name" or "host" attribute`);
    }
    return { name, host, value: textOf(c) };
  });

  return { subdomains, cookies };
}

// Elements with attributes come back as objects, the rest as plain strings.
function textOf(node) {
  if (node == null) return '';
  if (typeof node === 'object') return String(node['#text'] ?? '').trim();
  return String(node).trim();
}

module.exports = { parseConfig };
