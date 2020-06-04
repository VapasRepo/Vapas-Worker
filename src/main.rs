#[macro_use] extern crate dotenv_codegen;
#[macro_use] extern crate diesel;
extern crate dotenv;
extern crate chrono;
extern crate serde_derive;
extern crate serde_json;
extern crate bson;

use std::io;
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

    HttpServer::new(move || {
        App::new()
            .data(db_pool.clone())

            // Cydia redirect URL
            .external_resource("cydiaRedirect", format!("{}#{}{}", "cydia://url/https://cydia.saurik.com/api/share", "?source=", dotenv!("URL")))
    })
        .bind(format!("{}:{}", "127.0.0.1", "3030"))?
        .run()
        .await
}
