#!/usr/bin/env node
'use strict';

const fs = require('node:fs/promises');
const { createClient } = require('redis');
const { parseConfig } = require('./parser');
const { buildEntries, saveEntries } = require('./exporter');

const USAGE = 'Usage: export.sh [-v] /path/to/xml';

// Reads the -v flag and the XML path from the command line.
function parseArgs(argv) {
  let verbose = false;
  const files = [];
  for (const arg of argv) {
    if (arg === '-v' || arg === '--verbose') verbose = true;
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}\n${USAGE}`);
    else files.push(arg);
  }
  if (files.length !== 1) throw new Error(`Expected exactly one XML file path\n${USAGE}`);
  return { verbose, file: files[0] };
}

// Runs the export. Redis and file reading are passed in so tests can fake them.
async function run(argv, { readFile = fs.readFile, redis, log = console.log } = {}) {
  const { verbose, file } = parseArgs(argv);
  const xml = await readFile(file, 'utf8');
  const entries = buildEntries(parseConfig(xml));
  const keys = await saveEntries(redis, entries);

  if (verbose) {
    for (const key of keys) log(`${key} = ${entries.get(key)}`);
  }
  log(`Exported ${keys.length} keys to Redis.`);
  return keys;
}

async function main() {
  const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  redis.on('error', () => {}); // connect() below reports connection errors
  try {
    await redis.connect();
    await run(process.argv.slice(2), { redis });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (redis.isOpen) await redis.quit();
  }
}

if (require.main === module) main();

module.exports = { parseArgs, run };
