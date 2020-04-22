#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use] extern crate rocket;
#[macro_use] extern crate dotenv_codegen;
#[macro_use] extern crate diesel;
#[macro_use] extern crate rocket_contrib;
extern crate dotenv;
extern crate chrono;
extern crate serde_derive;
extern crate serde_json;
extern crate bson;

use rocket_contrib::serve::StaticFiles;
use dotenv::dotenv;
use rocket::http::hyper::header::Location;

pub mod modules;
pub mod services;
pub mod structs;

#[derive(Responder)]
#[response(status=303)]
struct RawRedirect((), Location);

#[get("/cydiaRedirect")]
fn cydia_redirect() -> RawRedirect {
    RawRedirect((), Location(format!("{}#{}{}", "cydia://url/https://cydia.saurik.com/api/share", "?source=", dotenv!("URL"))))
}

// Database pooling with Rocket
#[database("vapasdb")]
struct VapasDBConn(rocket_contrib::databases::diesel::PgConnection);

fn main() {
    dotenv().ok();

    rocket::ignite()
        // Internal main "/" routes
        .mount(
            "/",
            routes![cydia_redirect]
        )

        // Static public files
        .mount(
            "/",
            StaticFiles::from("public/")
        )

        // Core repo information routes
        .mount(
            "/",
            routes![modules::core_info::release, modules::core_info::packages, modules::core_info::cydia_icon, modules::core_info::footer_icon, modules::core_info::default_icons, modules::core_info::sileo_featured]
        )

        // Core repo information routes for Cydia
        .mount(
            "/./",
            routes![modules::core_info::release, modules::core_info::packages, modules::core_info::cydia_icon]
        )


        // Depictions routes
        /* *
        .mount(
            "/",
            routes![modules::depictions::depiction, modules::depictions::sileo_depiction]
        )
        **/

        // Payment information routes
        .mount(
            "/",
            routes![modules::payment_handling::payment_endpoint, modules::payment_handling::payment_response]
        )

        // Payment routes
        .mount(
            "/payment/",
            routes![modules::payment_handling::payment_info]
        )

        // Attach Sentry Fairing
        .attach(
            services::RocketSentry::RocketSentry::fairing()
        )

        // Attach Rocket Diesel Pooling
        .attach(
            VapasDBConn::fairing()
        )

        .launch();
}
