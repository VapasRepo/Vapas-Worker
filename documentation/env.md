# ENV File

(W.I.P)

One of the most important files in Vapas is the .env file. The file contains all the configuration details required
for Vapas to run.

You'll need the following things:
* Auth0 configuration ready: [auth0.md]()
* Stripe configuration ready: [stripe.md]()
* MongoDB configuration ready: [MongoDB.md]()
* Sentry configuration read: [sentry.md]()

The .env file is structred like this:

````
URL=
SENTRYDSN=
dbURL=
auth0URL=
auth0clientID=
auth0clientSecret=
JWTSecret=
stripeApi=
stripeID=
````

The URL variable is the HTTPS URL that the instance will be running on.

This MUST be HTTPS or it will fail.