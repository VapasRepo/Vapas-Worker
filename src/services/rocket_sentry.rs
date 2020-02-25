use std::sync::Mutex;

use rocket::fairing::{Fairing, Info, Kind};
use rocket::Rocket;
use sentry::internals::ClientInitGuard;

pub struct rocket_sentry {
    guard: Mutex<Option<ClientInitGuard>>,
}

impl rocket_sentry {
    pub fn fairing() -> impl Fairing {
        rocket_sentry {
            guard: Mutex::new(None),
        }
    }

    fn init(&self, dsn: &str) {
        let guard = sentry::init(dsn);

        if guard.is_enabled() {
            // Tuck the ClientInitGuard in the fairing, so it lives as long as the server.
            let mut self_guard = self.guard.lock().unwrap();
            *self_guard = Some(guard);

            self.configure();
            println!("Sentry enabled.");
        } else {
            println!("Sentry did not initialize.");
        }
    }

    fn configure(&self) {
        sentry::integrations::panic::register_panic_handler();
    }
}

impl Fairing for rocket_sentry {
    fn info(&self) -> Info {
        Info {
            name: "rocket_sentry",
            // Kind::Response is necessary, otherwise Rocket dealloc's our SentryGuard reference.
            kind: Kind::Attach | Kind::Response,
        }
    }

    fn on_attach(&self, rocket: Rocket) -> Result<Rocket, Rocket> {
        match rocket.config().get_str("sentry_dsn") {
            Ok("") => {
                println!("Sentry disabled.");
            }
            Ok(dsn) => {
                self.init(dsn);
            }
            Err(err) => println!("Sentry disabled: {}", err),
        }
        Ok(rocket)
    }
}

/* TODO: write tests
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
    }
}
*/
