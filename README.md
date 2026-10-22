# XML to Redis export

Reads `config.xml` and saves it to Redis:

- `subdomains` → JSON list of all subdomains
- `cookie:NAME:HOST` → the cookie value, e.g. `cookie:dlp-avast:amazon` → `mmm_amz_dlp_777_ppc_m`

Try it out here: [web version](https://lukodevelops.github.io/xml-redis-export/)

## Run

Needs Docker. On Windows, use Git Bash.

```bash
./export.sh -v data/config.xml
```

`-v` prints every key that was saved. If you get "permission denied", run `chmod +x export.sh` first.

To check a value:

```bash
docker compose exec redis redis-cli get cookie:dlp-avast:amazon
```

## Tests

```bash
npm install
npm test
```

The tests use a fake Redis, so nothing else needs to be running.

## Notes

- `src/parser.js` reads the XML, `src/exporter.js` writes to Redis, `src/cli.js` ties them together.
- All keys are saved in one transaction, so a failed run doesn't leave half the data behind.
- Bad XML stops the run with a clear error before anything is written.
