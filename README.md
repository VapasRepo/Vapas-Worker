# Vapas Worker
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![OpenHub](https://www.openhub.net/p/vapas-worker/widgets/project_thin_badge?format=gif)](https://www.openhub.net/p/vapas-worker)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/8ac5eec156d741a9a03b11e02eff7d34)](https://www.codacy.com/manual/pretzel/Vapas-Worker?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=VapasRepo/Vapas-Worker&amp;utm_campaign=Badge_Grade)
[![BCH compliance](https://bettercodehub.com/edge/badge/VapasRepo/Vapas-Worker?branch=develop)](https://bettercodehub.com/)
[![Build Status](https://travis-ci.com/VapasRepo/Vapas-Worker.svg?branch=develop)](https://travis-ci.com/VapasRepo/Vapas-Worker)

A NodeJS Express worker to generate and deliver information for Native Depictions, Web Depictions, and other miscellaneous uses.  

## Running

In order to run the worker, you'll first need to create a `.env` file that contains:

1. A `URL` variable that points to what URL the worker is running on.
2. A `SENTRYDSN` variable used for [Sentry](https://sentry.io/) error reporting.
3. A `dbURL` variable that points to a MongoDB database.  

After that, just run `yarn install` and then `yarn start`!

## Screenshots
<img src="https://gitlab.com/vapas/vapas-worker/raw/master/screenshots/sileo1.png" width="25%" alt="Vapas Footer Icon"/>
<img src="https://gitlab.com/vapas/vapas-worker/raw/master/screenshots/sileo2.png" width="25%" alt="Vapas Footer Icon"/>
<img src="https://gitlab.com/vapas/vapas-worker/raw/master/screenshots/sileo3.png" width="25%" alt="Vapas Footer Icon"/>

---

<div align="center">
    <img src="https://gitlab.com/vapas/vapas-worker/raw/master/assets/footerIcon.png" width="10%" alt="Vapas Footer Icon"/>
</div>