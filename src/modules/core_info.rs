extern crate dotenv_codegen;
extern crate dotenv;
extern crate diesel;
extern crate actix_web;

use actix_web::{get, web, HttpResponse, Responder, http::ContentEncoding, dev::BodyEncoding};

use diesel::prelude::*;

use dotenv::dotenv;
use std::env;

use crate::services::database::DbPool;

#[get("/Release")]
pub async fn release(pool: web::Data<DbPool>) -> impl Responder {
    use crate::structs::schema::vapas_release::dsl::*;

    let conn = pool.get().unwrap();

    let results = vapas_release
        .load::<crate::structs::models::VapasRelease>(&conn)
        .expect("Error loading release information");

    let mut final_payload = "".to_owned();

    for release in results {
        // Assemble core repository information
        final_payload.push_str(&format!("Origin: {}\n", release.origin));
        final_payload.push_str(&format!("Label: {}\n", release.label));
        final_payload.push_str(&format!("Suite: {}\n", release.suite));
        final_payload.push_str(&format!("Version: {}\n", release.version));
        final_payload.push_str(&format!("Codename: {}\n", release.codename));
        final_payload.push_str(&format!("Architectures: {}\n", release.architectures));
        final_payload.push_str(&format!("Components: {}\n", release.components));
        final_payload.push_str(&format!("Description: {}\n", release.description));
    }

    HttpResponse::Ok()
        .body(final_payload)
}

#[get("/Packages.gz")]
pub async fn packages(pool: web::Data<DbPool>) -> impl Responder {
    dotenv().ok();

    use crate::structs::schema::package_information::dsl::*;
    
    let conn = pool.get().unwrap();

    let results = package_information
        .filter(package_visible.eq(true))
        .load::<crate::structs::models::PackageInformation>(&conn)
        .expect("Error loading package information");

    let mut final_payload = String::new();

    for information in results {
        // Collect all data and add it to final_payload for response as a string
        final_payload.push_str(&format!("Package: {}\n", information.package_id));
        final_payload.push_str(&format!("Version: {}\n", information.version));
        final_payload.push_str(&format!("Section: {}\n", information.section));
        final_payload.push_str(&format!("Maintainer: {}\n", information.developer_name));
        final_payload.push_str(&format!("Depends: {}\n", information.depends));
        final_payload.push_str("Architecture: iphoneos-arm\n");
        final_payload.push_str(&format!("Filename: {}/debs/{}_{}_iphoneos-arm.deb\n", env::var("URL").unwrap(), information.name, information.version));
        final_payload.push_str(&format!("Size: {}\n", information.version_size.to_string()));
        final_payload.push_str(&format!("SHA256: {}\n", information.version_hash));
        final_payload.push_str(&format!("Description: {}\n", information.short_description));
        final_payload.push_str(&format!("Name: {}\n", information.name));
        final_payload.push_str(&format!("Author: {}\n", information.developer_name));
        final_payload.push_str(&format!("SileoDepiction: {}/sileodepiction/{}\n", env::var("URL").unwrap(), information.package_id));
        final_payload.push_str(&format!("Depiction: {}/depiction/{}\n", env::var("URL").unwrap(), information.package_id));

        // Check for the cost of a package
        if information.price > 0 {
            // Add it to final_payload
            final_payload.push_str("Tag: cydia::commercial\n");
        }

        // Add final listing and create an extra newline to signal end of package
        final_payload.push_str(&format!("Icon: {}\n\n", information.icon));
    }

    HttpResponse::Ok()
        .encoding(ContentEncoding::Gzip)
        .body(final_payload)
}

/**
#[get("/CydiaIcon.png")]
async pub fn cydia_icon() -> Option<NamedFile> {
    NamedFile::open("assets/cyidaIcon.png").ok()
}

#[get("/footerIcon.png")]
async pub fn footer_icon() -> Option<NamedFile> {
    NamedFile::open("assets/footerIcon.png").ok()
}

#[get("/icons/<name>")]
async pub fn default_icons(name: String) -> Option<NamedFile> {
    NamedFile::open(format!("assets/icons/{}.png", name)).ok()
}
**/

#[get("/sileo-featured.json")]
pub async fn sileo_featured(pool: web::Data<DbPool>) -> impl Responder {
    use crate::structs::schema::vapas_featured::dsl::*;

    let conn = pool.get().unwrap();

    let results = vapas_featured
        .filter(hide_shadow.eq(false))
        .load::<crate::structs::models::VapasFeatured>(&conn)
        .expect("Error loading featured information");

    let mut payload = "".to_owned();
    let mut featured_payload = "".to_owned();

    for featured in results {

    }

    payload = "a".parse().unwrap();

    HttpResponse::Ok()
        .json(payload)
}