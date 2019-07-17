# Vapas Worker

A NodeJS Express worker to generate and deliver infomation for Native Depictions, Web Depictions, and other miscellaneous uses.  

## Running

In order to run the worker, you'll first need to create a `.env` file that contains:

1. A `URL` variable that points to what URL the worker is running on.
2. A `SENTRYDSN` variable used for [Sentry](https://sentry.io/) error reporting.
3. A `dbURL` variable that points to a MongoDB database.  

After that, just run `yarn install` and then `node index.js`
