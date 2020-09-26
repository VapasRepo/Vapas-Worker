
# Vapas Worker "Rustwrite Edition"
A rust rewrite of the Vapas Worker NodeJS server to generate and deliver information for Native Depictions, 
Web Depictions, and other miscellaneous uses.

[**WE ARE NOW ON GITLAB!**](https://gitlab.com/vapas/vapas-worker/)

## Plan
The current plan is slowly rewrite each part of the Vapas worker in rust, as such the original JS files will be
hosted in this branch. When a "module" of the Vapas worker is rewritten, the original JS file for that module will be removed.

## Running

If you navigate to our [Wiki](https://gitlab.com/vapas/vapas-worker/-/wikis/home), you can find a getting started guide that can help you run the Vapas Worker for the first time.

You'll need the same ENV file as found on the NodeJS server, copy it over and it'll work just fine if you rename 
`SENTRYDSN` to `ROCKET_SENTRY_DSN`.

Check the `.env.example` for everything required.

## Screenshots

Coming Soon

## Special Thanks

<a href="https://www.jetbrains.com/?from=Vapas"><img src="https://gitlab.com/vapas/vapas-worker/-/raw/rustwrite/assets/jetbrains.png?inline=false" width="10%" alt="JetBrains Icon"/></a>
Special thanks to JetBrains for providing a free All Products Open-Source license to Vapas!

<a href="https://gitlab.com/"><img src="https://about.gitlab.com/images/press/logo/png/gitlab-logo-gray-stacked-rgb.png" width="15%" alt="GitLab Icon"/></a>
A special thanks to GitLab for giving us a free GitLab Gold OSS subscription!

---

<div align="center">
    <img src="https://gitlab.com/vapas/vapas-worker/-/raw/rustwrite/assets/footerIcon.png?inline=false" width="15%" alt="Vapas Footer Icon"/>
</div>
