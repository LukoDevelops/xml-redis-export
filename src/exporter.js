'use strict';

// Turns the parsed config into Redis key/value pairs.
function buildEntries(config) {
  const entries = new Map();
  entries.set('subdomains', JSON.stringify(config.subdomains));
  for (const { name, host, value } of config.cookies) {
    entries.set(`cookie:${name}:${host}`, value);
  }
  return entries;
}

// Saves everything in one MULTI/EXEC, so it's all or nothing.
async function saveEntries(client, entries) {
  const tx = client.multi();
  for (const [key, value] of entries) {
    tx.set(key, value);
  }
  await tx.exec();
  return [...entries.keys()];
}

module.exports = { buildEntries, saveEntries };
