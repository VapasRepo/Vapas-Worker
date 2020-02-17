# Vapas Worker "Rustwrite Edition"
[![Slack Invite](https://img.shields.io/badge/Join%20Chat-Slack-brightgreen)](https://communityinviter.com/apps/vapasrepo/aaaa)
[![OpenHub](https://www.openhub.net/p/vapas-worker/widgets/project_thin_badge?format=gif)](https://www.openhub.net/p/vapas-worker)
[![Travis-CI](https://api.travis-ci.com/VapasRepo/Vapas-Worker.svg?branch=rustwrite)](https://travis-ci.com/VapasRepo/Vapas-Worker)

A rust rewrite of the Vapas Worker NodeJS server  to generate and deliver information for Native Depictions, 
Web Depictions, and other miscellaneous uses.

## Plan
The current plan is slowly rewrite each part of the Vapas worker in rust, as such the original JS files will be
hosted in this branch. When a "module" of the Vapas worker is rewritten, the original JS file for that module will be
removed.

## Running

You'll need the same ENV file as found on the NodeJS server, copy it over and it'll work just fine if you rename 
`SENTRYDSN` to `ROCKET_SENTRY_DSN`.  

Check the `.env.example` for everything required.

## Screenshots

Coming Soon

---

<div align="center">
    <img src="https://gitlab.com/vapas/vapas-worker/raw/master/assets/footerIcon.png" width="10%" alt="Vapas Footer Icon"/>
</div>