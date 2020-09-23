extern crate bson;
extern crate chrono;
#[macro_use]
extern crate diesel;
extern crate dotenv;
extern crate serde_derive;
extern crate serde_json;

use std::{env, io};

use actix_web::{App, HttpServer};
use dotenv::dotenv;

use crate::services::database::establish_connection;

pub mod modules;
pub mod services;
pub mod structs;

#[actix_rt::main]
async fn main() -> io::Result<()> {
    dotenv().ok();

    // Database pooling with ActiX
    let db_pool = establish_connection();

    println!("Vapas Worker OK!");

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
            // Sileo featured JSON
            .service(modules::core_info::sileo_featured)
            // Payment endpoint
            .service(modules::payment_handling::payment_endpoint)
            // Payment endpoint status
            .service(modules::payment_handling::payment_response)
            // Payment endpoint info
            .service(modules::payment_handling::payment_info)
            // Payment user info
            .service(modules::payment_handling::user_info)
            // Payment authentication
            .service(modules::payment_handling::authenticate)
            // Payment deauth
            .service(modules::payment_handling::sign_out)
            // Auth0 deauth callback
            .service(modules::payment_handling::sign_out_redirect)
            // Auth0 callback
            .service(modules::payment_handling::auth0callback)
            // Payment package info
            .service(modules::payment_handling::package_info)
            // Buy
            .service(modules::payment_handling::purchase)
            // Native Depictions
            .service(modules::depictions::sileo_depiction)
            // Web Depictions
            .service(modules::depictions::depiction)
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
