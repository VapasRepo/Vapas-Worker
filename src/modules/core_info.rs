extern crate rocket;
extern crate dotenv_codegen;
extern crate dotenv;
extern crate diesel;

use diesel::prelude::*;
use crate::structs::*;

use flate2::Compression;
use flate2::write::GzEncoder;

use rocket::response::{NamedFile, content};
use rocket::response::content::Json as JsonRocket;

use rocket_contrib::compression::Compress;

use crate::services::database::*;
use std::io::Write;
use crate::structs::models::*;

#[get("/Release")]
pub fn release() -> String {
    use crate::structs::schema::vapas_release::dsl::*;

    let connection = establish_connection();
    let results = vapas_release
        .load::<vapas_release>(&connection)
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

    return final_payload;
}

#[get("/Packages.gz")]
pub fn packages() -> Vec<u8> {
    use crate::structs::schema::package_information::dsl::*;

    let connection = establish_connection();
    let results = package_information
        .filter(package_visible.eq(true))
        .load::<package_information>(connection)
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
        final_payload.push_str(&format!("Filename: {}/debs/{}_{}_iphoneos-arm.deb\n", dotenv!("URL"), information.name, information.version));
        final_payload.push_str(&format!("Size: {}\n", information.version_size.to_String()));
        final_payload.push_str(&format!("SHA256: {}\n", information.version_hash));
        final_payload.push_str(&format!("Description: {}\n", information.short_description));
        final_payload.push_str(&format!("Name: {}\n", information.name));
        final_payload.push_str(&format!("Author: {}\n", information.developer_name));
        final_payload.push_str(&format!("SileoDepiction: {}/sileodepiction/{}\n", dotenv!("URL"), information.package_id));
        final_payload.push_str(&format!("Depiction: {}/depiction/{}\n", dotenv!("URL"), information.package_id));

        // Check for the cost of a package
        if information.price > 0 {
            // Add it to final_payload
            final_payload.push_str("Tag: cydia::commercial\n");
        }

        // Add final listing and create an extra newline to signal end of package
        final_payload.push_str(&format!("Icon: {}\n\n", information.icon));
    }

    // Compress the string for use with clients
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(final_payload.as_ref());

    return encoder.finish().unwrap();
}

#[get("/CydiaIcon.png")]
pub fn cydia_icon() -> Option<NamedFile> {
    NamedFile::open("assets/cyidaIcon.png").ok()
}

#[get("/footerIcon.png")]
pub fn footer_icon() -> Option<NamedFile> {
    NamedFile::open("assets/footerIcon.png").ok()
}

#[get("/icons/<name>")]
pub fn default_icons(name: String) -> Option<NamedFile> {
    NamedFile::open(format!("assets/icons/{}.png", name)).ok()
}

#[get("/sileo-featured.json")]
pub fn sileo_featured() -> content::Json<String> {
    use crate::structs::schema::vapas_featured::dsl::*;

    let connection = establish_connection();
    let results = vapas_featured
        .filter(hide_shadow.eq(false))
        .load::<vapas_featured>(&connection)
        .expect("Error loading featured information");

    let mut payload = "".to_owned();
    let mut featured_payload = "".to_owned();

    for featured in results {

    }

    payload = json!({
        "class":"FeaturedBannersView",
        "itemSize":"{263, 148}",
        "itemCornerRadius":10,
        "banners":[{}]
    }).to_string();

    return JsonRocket(payload)
}