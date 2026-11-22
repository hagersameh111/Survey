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

# Private survey counter backfill

The Free plan limits each user to two published Private surveys. Existing User documents may not have `activePrivateSurveyCount`; this script recalculates the counter from published Private Forms for every user, setting it to zero when they have none. Draft, closed, and Shared Forms are excluded. The default is a dry run; `--apply` writes the recalculated counters.

Run from `backend/`:

```sh
node scripts/backfill-private-survey-count.js
node scripts/backfill-private-survey-count.js --apply
```

The script is idempotent and does not print the database URI. Before applying, back up the database, confirm the target environment, run the dry run, and pause/drain all Form-writing backend instances until the apply completes. Do not run `--apply` against production without the normal release approval and backup process.
# Form workspace-fields backfill

The team-workspace feature adds `visibility`, `workspace`, and `shortCode` to the Form schema. Existing Forms created before this feature lack all three. The backfill does two things in one pass: it sets `visibility: "private"` and `workspace: null` on any document missing `visibility`, and it assigns a unique, Free-tier-length `shortCode` to any document missing one. Both parts are additive and idempotent; existing values are never overwritten.

Run commands from the `backend/` directory. The script loads the normal backend `.env` at invocation time, requires `MONGO_URI`, and never prints the URI.

```sh
node scripts/backfill-form-workspace-fields.js
node scripts/backfill-form-workspace-fields.js --apply
```

The first command is a dry run and is the default. It reports how many documents currently lack `visibility` and how many lack `shortCode`, and performs no writes. The second command applies both updates and reports matched and updated counts for each. `shortCode` is a unique field, so it cannot be set with a single bulk update; the script assigns one document at a time with a bounded retry-on-collision loop. The script is not called by server startup, npm test scripts, or test imports.

## Deployment precautions

1. Back up the target database and confirm the selected environment before running either command.
2. Run the dry run and review its counts.
3. Stop or drain every backend instance that can write Forms before applying the backfill. Old application versions do not set `visibility`/`shortCode` on forms they create.
4. Apply the backfill once, deploy the team-workspace version to every backend instance while writes remain paused, then resume traffic.
5. Do not run `--apply` against a production database without the normal release approval and backup process.
