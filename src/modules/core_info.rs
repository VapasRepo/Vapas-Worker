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
    let document = find_documents("vapasInfomation".parse().unwrap(), doc! {"object" : "release"});

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
    let document = find_documents("vapasPackages".parse().unwrap(), doc! {"packageVisible" : true});

    let mut final_payload = String::new();
    for doc in document {
        let doc_root = doc.unwrap();
        let document_data = doc_root.get(&"package").unwrap().to_json();
        // Collect all data and add it to final_payload for response as a string
        final_payload.push_str(&format!("Package: {}\n", doc_root.get(&"packageName").unwrap().as_str().unwrap()));
        final_payload.push_str(format!("Version: {}\n", document_data.get(&"currentVersion").unwrap().get(&"version").unwrap().as_str().unwrap()).as_ref());
        final_payload.push_str(format!("Section: {}\n", document_data.get(&"section").unwrap().as_str().unwrap()).as_ref());
        final_payload.push_str(format!("Maintainer: {}\n", document_data.get(&"developer").unwrap().as_str().unwrap()).as_ref());
        final_payload.push_str(format!("Depends: {}\n", document_data.get(&"depends").unwrap().as_str().unwrap()).as_ref());
        final_payload.push_str("Architecture: iphoneos-arm\n");
        final_payload.push_str(format!("Filename: {}/debs/{}_{}_iphoneos-arm.deb\n", dotenv!("URL"), doc_root.get(&"packageName").unwrap().as_str().unwrap(), document_data.get(&"currentVersion").unwrap().get(&"version").unwrap().as_str().unwrap()).as_ref());
        final_payload.push_str(format!("Size: {}\n", document_data.get(&"currentVersion").unwrap().get(&"size").unwrap().as_str().unwrap()).as_ref());
        final_payload.push_str(format!("SHA256: {}\n", document_data.get(&"currentVersion").unwrap().get(&"SHA256").unwrap().as_str().unwrap()).as_ref());
        final_payload.push_str(format!("Description: {}\n", document_data.get(&"shortDescription").unwrap().as_str().unwrap()).as_ref());
        final_payload.push_str(format!("Name: {}\n", document_data.get(&"name").unwrap().as_str().unwrap()).as_ref());
        final_payload.push_str(format!("Author: {}\n", document_data.get(&"developer").unwrap().as_str().unwrap()).as_ref());
        final_payload.push_str(format!("Depiction: {}/depiction/{}\n", dotenv!("URL"), doc_root.get(&"packageName").unwrap().as_str().unwrap()).as_ref());
        final_payload.push_str(format!("SileoDepiction: {}/sileodepiction/{}\n", dotenv!("URL"), doc_root.get(&"packageName").unwrap().as_str().unwrap()).as_ref());

        let price = document_data.get(&"price").unwrap().as_str().unwrap();

        // Check for the cost of a package
        if price > "0" {
            // Add it to final_payload
            final_payload.push_str("Tag: cydia::commercial\n");
        }

        // Add final listing and create an extra newline to signal end of package
        final_payload.push_str(format!("Icon: {}\n\n", document_data.get(&"icon").unwrap().as_str().unwrap()).as_ref());
    }
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
    let document = find_documents("vapasInfomation".parse().unwrap(), doc! {"object" : "featured"});

    let mut payload = "".to_owned();

    for doc in document {
        payload.push_str(&doc.unwrap().get(&"data").unwrap().to_json().to_string());
    }

    return format!("{}", payload)
}