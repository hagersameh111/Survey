# Form version backfill

The Form schema uses Mongoose's `__v` key for optimistic concurrency. Existing Forms created while version tracking was disabled may not contain that field. The backfill sets `__v` to `0` only on documents where the field is absent; existing version values are preserved.

Run commands from the `backend/` directory. The script loads the normal backend `.env` at invocation time, requires `MONGO_URI`, and never prints the URI.

```sh
node scripts/backfill-form-version.js
node scripts/backfill-form-version.js --apply
```

The first command is a dry run and is the default. It reports how many documents currently lack `__v` and performs no writes. The second command applies the update and reports matched and updated counts. The script is not called by server startup, npm test scripts, or test imports.

## Deployment precautions

1. Back up the target database and confirm the selected environment before running either command.
2. Run the dry run and review its counts.
3. Stop or drain every backend instance that can write Forms before applying the backfill. Old application versions do not increment `__v`.
4. Apply the backfill once, deploy the optimistic-concurrency version to every backend instance while writes remain paused, then resume traffic.
5. Do not run `--apply` against a production database without the normal release approval and backup process.
