extern crate actix_web;
extern crate diesel;
extern crate dotenv;

use std::env;

use actix_web::{get, HttpResponse, Responder, web};
use diesel::prelude::*;
use dotenv::dotenv;
use serde_json::*;

use crate::services::database::DbPool;
use crate::structs::general::*;

#[get("/sileodepiction/{packageid}")]
pub async fn sileo_depiction(pool: web::Data<DbPool>, info: web::Path<PackageID>) -> impl Responder {
    // TODO: Implement Native (Sileo/Installer) Depictions
    dotenv().ok();

    use crate::structs::schema::package_information::dsl::*;

    let conn = pool.get().unwrap();

    let results = package_information
        .filter(package_id.eq(&info.packageid))
        .load::<crate::structs::models::PackageInformation>(&conn)
        .expect("Error loading package information");

    let mut package_price: String = String::new();
    let mut package_changelog: String = String::new();
    let mut package_issues: String = String::new();
    let mut package_screenshots = Vec::new();

    let mut package_header: String = String::new();
    let mut package_tint: String = String::new();

    let mut package_data = serde_json::Value::Null;

    for information in results {
        for i in information.version_changes {
            package_changelog.push_str(&format!("* {}\n", i));
        }

        for i in information.known_issues {
            package_issues.push_str(&format!("* {}\n", i));
        }

        for i in information.screenshots {
            // Todo: Add accessibility text in database
            package_screenshots.push(json!({"url": i, "accessibilityText": "Screenshot"}));
        }

        if information.price == 0 {
            package_price = "Free!".to_string();
        } else {
            package_price = format!("${}", information.price.to_string());
        }

        package_header = information.header_image;
        package_tint = information.tint;

        package_data = json!({
            "minVersion": "0.1",
            "headerImage": package_header,
            "tintColor": package_tint,
            "tabs": [{
                "tabname": "Details",
                "views": [{
                    "itemCornerRadius": 6,
                    "itemSize": "{160, 275.41333333333336}",
                    "screenshots": package_screenshots,
                    "class": "DepictionScreenshotsView"
                }, {
                    "class": "DepictionSeparatorView"
                }, {
                    "markdown": information.long_description,
                    "useSpacing": true,
                    "class": "DepictionMarkdownView"
                }, {
                    "class": "DepictionSeparatorView"
                }, {
                    "title": "What's New",
                    "class": "DepictionHeaderView"
                }, {
                    "markdown": package_changelog,
                    "useSpacing": true,
                    "class": "DepictionMarkdownView"
                }, {
                    "title": "Known Issues",
                    "class": "DepictionHeaderView"
                }, {
                    "markdown": package_issues,
                    "useSpacing": true,
                    "class": "DepictionMarkdownView"
                }, {
                    "class": "DepictionSeparatorView"
                }, {
                    "title": "Package Information",
                    "class": "DepictionHeaderView"
                }, {
                    "title": "Version",
                    "text": information.version,
                    "class": "DepictionTableTextView"
                }, {
                    "title": "Size",
                    "text": information.version_size.to_string(),
                    "class": "DepictionTableTextView"
                }, {
                    "title": "Released",
                    "text": information.version_release_date.format("%b %e %Y").to_string(),
                    "class": "DepictionTableTextView"
                }, {
                    "title": "Price",
                    "text": package_price,
                    "class": "DepictionTableTextView"
                }, {
                    "class": "DepictionSeparatorView"
                }, {
                    "title": "Developer Information",
                    "class": "DepictionHeaderView"
                }, {
                    "title": "Developer",
                    "text": information.developer_name,
                    "class": "DepictionTableTextView"
                }, {
                    "title": format!("Support ({})", information.support_name),
                    "action": information.support_url,
                    "class": "DepictionTableButtonView"
                }, {
                    "class": "DepictionSeparatorView"
                }, {
                    "spacing": 10,
                    "class": "DepictionSpacerView"
                }, {
                    "URL": format!("{}/footerIcon.png", env::var("URL").unwrap()),
                    "width": 125,
                    "height": 67.5,
                    "cornerRadius": 0,
                    "alignment": 1,
                    "class": "DepictionImageView"
                }],
                "class": "DepictionStackView"
            }],
            "class": "DepictionTabView"
        })
    }

    HttpResponse::Ok()
        .json(package_data)
}

#[get("/depiction/{packageid}")]
pub async fn depiction(pool: web::Data<DbPool>, info: web::Path<PackageID>) -> impl Responder {
    // TODO: Implement Web (Cydia/Zebra/Online) Depictions
    HttpResponse::Ok()
        .body(format!("Not Implemented. You requested the web depiction for {}. The database connection count is {} with {} idle connections.", &info.packageid, pool.state().connections, pool.state().idle_connections))
}
