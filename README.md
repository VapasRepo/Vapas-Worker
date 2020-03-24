# Vapas Worker "Rustwrite Edition"
[![Slack Invite](https://img.shields.io/badge/Join%20Chat-Slack-brightgreen)](https://communityinviter.com/apps/vapasrepo/aaaa)
[![Travis-CI](https://api.travis-ci.com/VapasRepo/Vapas-Worker.svg?branch=rustwrite)](https://travis-ci.com/VapasRepo/Vapas-Worker)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FVapasRepo%2FVapas-Worker.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FVapasRepo%2FVapas-Worker?ref=badge_shield)
[![OpenHub](https://www.openhub.net/p/vapas-worker/widgets/project_thin_badge?format=gif)](https://www.openhub.net/p/vapas-worker)

A rust rewrite of the Vapas Worker NodeJS server  to generate and deliver information for Native Depictions, 
Web Depictions, and other miscellaneous uses.

[**ISSUE TRACKING HAS BEEN MOVED TO THE VAPAS JIRA** ](https://jira.vapas.gq/projects/WORKER)  
[**DOCUMENTATION HAS BEEN MOVED TO THE VAPAS CONFLUENCE**](https://confluence.vapas.gq/display/WORKDOC/Vapas+Worker+Documentation)

## Plan
The current plan is slowly rewrite each part of the Vapas worker in rust, as such the original JS files will be
hosted in this branch. When a "module" of the Vapas worker is rewritten, the original JS file for that module will be
removed.

## Running

NOTE: There is a getting started page on the Vapas confluence, please note this guide is still W.I.P and may change often.   
https://confluence.vapas.gq/display/WORKDOC/Getting+Started

You'll need the same ENV file as found on the NodeJS server, copy it over and it'll work just fine if you rename 
`SENTRYDSN` to `ROCKET_SENTRY_DSN`.  

Check the `.env.example` for everything required.

## Screenshots

Coming Soon

## Widgets

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FVapasRepo%2FVapas-Worker.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FVapasRepo%2FVapas-Worker?ref=badge_large)

---

<div align="center">
    <img src="https://raw.githubusercontent.com/VapasRepo/Vapas-Worker/rustwrite/assets/footerIcon.png" width="15%" alt="Vapas Footer Icon"/>
</div>