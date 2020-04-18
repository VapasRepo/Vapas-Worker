extern crate rocket;
extern crate mongodb;
extern crate serde_json;
extern crate dotenv_codegen;
extern crate dotenv;

use rocket_contrib::json::{Json, JsonValue};

use rocket::response::content;

use crate::services::database::{find_documents};
use std::ptr::null;

#[get("/sileodepiction/<_packageid>")]
pub fn sileo_depiction(_packageid: String) -> content::Json<String> {
    // TODO: Implement Native (Sileo/Installer) Depictions
    let document = find_documents("vapasPackages".parse().unwrap(), doc! {"packageName" : _packageid});

    let mut package_info = doc!{};
    let mut  package_price = "N/A";
    let mut package_changelog = "".to_owned();
    let mut package_issues = "".to_owned();
    let mut package_screenshots = "";

    for doc in document {
        package_info = doc.get("package").and_then(bson::Bson::Document);
    }

    for i in package_info.get(&"currentVersion").unwrap().as_document().unwrap().get(&"changeLog").into_iter() {
        package_changelog.push_str(format!("* {}\n", i).as_ref())
    }

    for i in package_info.get(&"knownIssues").into_iter(){
        package_issues.push_str(format!("* {}\n", i).as_ref())
    }

    if package_info.get(&"price").unwrap().as_str().unwrap() == "0" {
        package_price = "Free!"
    } else {
        package_price = package_info.get(&"price").unwrap().as_str().unwrap()
    }

    return content::Json(json!({
        "minVersion": "0.1",
        "headerImage": package_info.get(&"headerImage").unwrap(),
        "tintColor": package_info.get(&"tint").unwrap(),
        "tabs": [{
            "tabname": "Details",
            "views": [{
                "title": package_info.get(&"shortDescription").unwrap(),
                "useBoldText": true,
                "useBottomMargin": false,
                "class": "DepictionSubheaderView"
            }, {
                "markdown": package_info.get(&"longDescription").unwrap(),
                "useSpacing": true,
                "class": "DepictionMarkdownView"
            }, {
                "class": "DepictionSeparatorView"
            }, {
                "title": "Screenshots",
                "class": "DepictionHeaderView"
            }, {
                "itemCornerRadius": 6,
                "itemSize": "{160, 275.41333333333336}",
                "screenshots": [],
                "ipad": {
                    "itemCornerRadius": 6,
                    "itemSize": "{160, 275.41333333333336}",
                    "screenshots": [],
                    "class": "DepictionScreenshotsView"
                },
                "class": "DepictionScreenshotsView"
            }, {
                "class": "DepictionSeparatorView"
            }, {
                "title": "Known Issues",
                "class": "DepictionHeaderView"
            }, {
                "markdown": package_issues,
                "useSpacing": false,
                "class": "DepictionMarkdownView"
            }, {
                "class": "DepictionSeparatorView"
            }, {
                "title": "Package Information",
                "class": "DepictionHeaderView"
            }, {
                "title": "Version",
                "text": package_info.get(&"currentVersion").unwrap().as_document().unwrap().get(&"version").unwrap(),
                "class": "DepictionTableTextView"
            }, {
                "title": "Released",
                "text": package_info.get(&"currentVersion").unwrap().as_document().unwrap().get(&"dateReleased").unwrap(),
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
                "class": "DepictionStackView"
            }, {
                "title": "Developer",
                "text": package_info.get(&"developer").unwrap(),
                "class": "DepictionTableTextView"
            }, {
                "title": format!("Support ({})", package_info.get(&"supportLink").unwrap().as_document().unwrap().get(&"name").unwrap()),
                "action": package_info.get(&"supportLink").unwrap().as_document().unwrap().get(&"url").unwrap(),
                "class": "DepictionTableButtonView"
            }, {
                "class": "DepictionSeparatorView"
            }, {
                "spacing": 10,
                "class": "DepictionSpacerView"
            }, {
                "URL": format!("{}/footerIcon.png", dotenv!("URL")),
                "width": 125,
                "height": 67.5,
                "cornerRadius": 0,
                "alignment": 1,
                "class": "DepictionImageView"
            }],
            "class": "DepictionStackView"
        }, {
            "tabname": "Changelog",
            "views": [{
                "title": format!("Version {}", package_info.get(&"currentVersion").unwrap().as_document().unwrap().get(&"version").unwrap()),
                "useBoldText": true,
                "useBottomMargin": true,
                "class": "DepictionSubheaderView"
            }, {
                "markdown": package_changelog,
                "useSpacing": false,
                "class": "DepictionMarkdownView"
            }],
            "class": "DepictionStackView"
        }],
        "class": "DepictionTabView"
    }).to_string())
}

#[get("/depiction/<_packageid>")]
pub fn depiction(_packageid: String) -> String {
    // TODO: Implement Web (Cyida/Zebra/Online) Depictions
    "Not Implemented".into()
}
