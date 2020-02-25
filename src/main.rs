#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use] extern crate rocket;
#[macro_use] extern crate dotenv_codegen;
#[macro_use] extern crate bson;
extern crate rocket_contrib;
extern crate dotenv;

use rocket::response::Redirect;
use rocket_contrib::serve::StaticFiles;
use dotenv::dotenv;
use rocket::http::hyper::header::Location;

pub mod modules;
pub mod services;


#[derive(Responder)]
#[response(status=303)]
struct RawRedirect((), Location);

#[get("/cydiaRedirect")]
fn cydia_redirect() -> RawRedirect {
    RawRedirect((), Location(format!("{}#{}{}", "cydia://url/https://cydia.saurik.com/api/share", "?source=", dotenv!("URL"))))
}

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
        .attach(
            services::rocket_sentry::rocket_sentry::fairing()
        )
        .launch();
}
