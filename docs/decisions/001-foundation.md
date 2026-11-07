# Foundation decisions

## One origin

The interface and API ship as one Worker on `coach.milemarklabs.com`. Static assets use single-page-application fallback, and `/api/*` runs the Worker first. A separate Pages project would split the cookie and the OAuth callback across hosts.

## Neon and Hyperdrive

The database is PostgreSQL on Neon. Workers reach it through Hyperdrive. Migrations use a direct `DATABASE_URL` from Node. The local connection string is an environment variable, not a committed Wrangler field.

## Packages that have code

`packages/shared` exists because both apps import the same contracts. Analytics and AI packages wait until those milestones have functions to put in them. The API does not calculate training load and does not select a model.

## One Strava page per invocation

Historical import does not loop inside a Worker request. The client continues the job. The same continue path is what the later cron triggers will call for the 09:30, 13:30, and 16:30 UTC reconciliations.

## Single athlete

Coach is a personal application on a public hostname. The first Strava athlete owns the account. Tokens are encrypted, the session is an HMAC cookie, and the model is not given a database connection.
