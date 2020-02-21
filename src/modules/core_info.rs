extern crate rocket;
extern crate dotenv_codegen;
extern crate dotenv;
extern crate mongodb;
extern crate bson;

use rocket::response::NamedFile;

use std::io;

use mongodb::{Cursor};

use bson::ordered::{OrderedDocument};

use rustc_serialize::json::{Json, ToJson};

use crate::services::database::{find_documents, get_data_string};

#[get("/Release")]
pub fn release() -> String {
    let document = find_documents("vapasInfomation".parse().unwrap(), "object".parse().unwrap(), "release".parse().unwrap());

    let mut final_payload = "".to_owned();

    for doc in document {
        let document_data = doc.unwrap().get(&"data").unwrap().to_json();
        // Assemble core repository information
        final_payload.push_str(&format!("Origin: {}\n", document_data.get(&"Origin").unwrap().as_str().unwrap()));
        final_payload.push_str(&format!("Label: {}\n", document_data.get(&"Label").unwrap().as_str().unwrap()));
        final_payload.push_str(&format!("Suite: {}\n", document_data.get(&"Suite").unwrap().as_str().unwrap()));
        final_payload.push_str(&format!("Version: {}\n", document_data.get(&"Version").unwrap().as_str().unwrap()));
        final_payload.push_str(&format!("Codename: {}\n", document_data.get(&"Codename").unwrap().as_str().unwrap()));
        final_payload.push_str(&format!("Architectures: {}\n", document_data.get(&"Architectures").unwrap().as_str().unwrap()));
        final_payload.push_str(&format!("Components: {}\n", document_data.get(&"Components").unwrap().as_str().unwrap()));
        final_payload.push_str(&format!("Description: {}\n", document_data.get(&"Description").unwrap().as_str().unwrap()));
    }

    return final_payload;
}

#[get("/Packages")]
pub fn packages() -> String {
    // for doc in find_documents("vapas") {}
    // TODO: Add loading packages from database

    let mut final_payload = String::new();

    // Collect all data and add it to final_payload for response as a string
    final_payload.push_str(format!("Package: {}\n", "PlaceholderPackage").as_ref());
    final_payload.push_str(format!("Version: {}\n", "1.0").as_ref());
    final_payload.push_str(format!("Section: {}\n", "Development").as_ref());
    final_payload.push_str(format!("Maintainer: {}\n", "Placeholder Maintainer").as_ref());
    final_payload.push_str(format!("Depends: {}\n", "gq.vapas.placeholder").as_ref());
    final_payload.push_str("Architecture: iphoneos-arm\n");
    final_payload.push_str(format!("Filename: {}/debs/{}_{},_iphoneos-arm.deb\n", dotenv!("URL"), "PlaceholderPackage", "1.0").as_ref());
    final_payload.push_str(format!("Size: {}\n", "4096").as_ref());
    final_payload.push_str(format!("SHA256: {}\n", "PLACEHOLDER").as_ref());
    final_payload.push_str(format!("Description: {}\n", "A placeholder package for Vapas Rustwrite").as_ref());
    final_payload.push_str(format!("Name: {}\n", "Placeholder Package Name").as_ref());
    final_payload.push_str(format!("Author: {}\n", "Placeholder Author").as_ref());
    final_payload.push_str(format!("Depiction: {}/depiction/{}\n", dotenv!("URL"), "PlaceholderPackage").as_ref());
    final_payload.push_str(format!("SileoDepiction: {}/sileodepiction/{}\n", dotenv!("URL"), "PlaceholderPackage").as_ref());

    // Check for the cost of a package
    if let "1" = &*"0" {
        // Add it to final_payload
        final_payload.push_str("Tag: cydia::commercial\n");
    }

    // Add final listing and create an extra newline to signal end of package
    final_payload.push_str(format!("Icon: {}\n\n", "development").as_ref());

    return final_payload;
}

#[get("/CydiaIcon.png")]
pub fn cydia_icon() -> io::Result<NamedFile> {
    NamedFile::open("assets/cyidaIcon.png")
}

#[get("/footerIcon.png")]
pub fn footer_icon() -> io::Result<NamedFile> {
    NamedFile::open("assets/footerIcon.png")
}

#[get("/icons/<name>")]
pub fn default_icons(name: String) -> io::Result<NamedFile> {
    NamedFile::open(format!("assets/icons/{}.png", name))
}

#[get("/sileo-featured.json")]
pub fn sileo_featured() -> String {
    let document = find_documents("vapasInfomation".parse().unwrap(), "object".parse().unwrap(), "featured".parse().unwrap());

    let mut payload = "".to_owned();

    for doc in document {
        payload.push_str(&doc.unwrap().get(&"data").unwrap().to_json().to_string());
    }

    return format!("{}", payload)
}