#[macro_use]
extern crate dotenv_codegen;
#[macro_use]
extern crate diesel;
extern crate bson;
extern crate chrono;
extern crate dotenv;
extern crate serde_derive;
extern crate serde_json;

use actix_web::{App, HttpServer};
use std::{env, io};

use crate::services::database::establish_connection;
use dotenv::dotenv;

pub mod modules;
pub mod services;
pub mod structs;

#[actix_rt::main]
async fn main() -> io::Result<()> {
    dotenv().ok();

    // Database pooling with ActiX
    let db_pool = establish_connection();

    HttpServer::new(move || {
        App::new()
            .data(db_pool.clone())
            // Core repo info
            .service(modules::core_info::release)
            // All packages
            .service(modules::core_info::packages)
            // Cydia Icon
            .service(modules::core_info::cydia_icon)
            // Footer Icon
            .service(modules::core_info::footer_icon)
            // Default Icons
            .service(modules::core_info::default_icons)
            // Cydia redirect URL
            .external_resource(
                "cydiaRedirect",
                format!(
                    "{}#{}{}",
                    "cydia://url/https://cydia.saurik.com/api/share",
                    "?source=",
                    env::var("URL").unwrap()
                ),
            )
    })
    .workers(env::var("THREADS").unwrap().parse().unwrap())
    .bind(format!("{}:{}", "0.0.0.0", "1406"))?
    .run()
    .await
}
