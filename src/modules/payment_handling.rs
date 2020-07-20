extern crate actix_web;
extern crate diesel;
extern crate dotenv;

use std::env;

use actix_web::{get, http, HttpResponse, post, Responder, web};
use diesel::prelude::*;
use dotenv::dotenv;
use serde_json::*;

use crate::services::database::DbPool;
use crate::structs::general::PackageID;
use crate::structs::payment_handling::*;

// Payment Endpoint Setup

#[get("/payment_endpoint")]
pub async fn payment_endpoint() -> impl Responder {
    dotenv().ok();

    HttpResponse::Ok().body(format!("{}/payment/", env::var("URL").unwrap()))
}

#[get("/payment")]
pub async fn payment_response() -> impl Responder {
    HttpResponse::Ok()
}

#[get("/payment/info")]
pub async fn payment_info(pool: web::Data<DbPool>) -> impl Responder {
    dotenv().ok();
    use crate::structs::schema::vapas_payment_info::dsl::*;

    let conn = pool.get().unwrap();

    let results = vapas_payment_info
        .load::<crate::structs::models::VapasPaymentInfo>(&conn)
        .expect("Error loading payment endpoint information");

    let mut payment_info = Vec::new();

    for result in results {
        payment_info.push(result.name);
        payment_info.push(result.description);
        payment_info.push(result.banner_message);
    }

    HttpResponse::Ok().json(PaymentInformationStruct {
        name: payment_info[0].clone(),
        icon: format!("{}/CydiaIcon.png", env::var("URL").unwrap()),
        description: payment_info[1].clone(),
        authentication_banner: PaymentInformationBannerStruct {
            message: payment_info[2].clone(),
            button: "Sign in".to_string(),
        },
    })
}

// Data and Authentication

#[post("/payment/user_info")]
pub async fn user_info() -> impl Responder {
    // TODO: Implement vapas_user data here
    let user_info = json!({
        "items": ["gq.vapas.paidtestpackage"],
        "user": {
            "name": "Skye Viau",
            "email": "skye.viau@outlook.com"
        }
    });
    HttpResponse::Ok()
        .json(user_info)
}

#[get("/payment/authenticate")]
pub async fn authenticate() -> impl Responder {
    // TODO: Implement Auth0 here
    HttpResponse::TemporaryRedirect()
        // junk data from the sileo documentation
        .header(http::header::LOCATION, "sileo://authentication_success?token=BEARER%20f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2&payment_secret=jr38tgh9t832gew89gt3j8y4hjgmf92r1jt38gfhrq5jtwyhsgfekart0gh9fet8yhrgw89e3qw6h4gfn5ty5hgrfgh34ty5894g")
        .finish()
}

#[post("/payment/sign_out")]
pub async fn sign_out() -> impl Responder {
    // TODO: Implement Auth0 here
    HttpResponse::Ok()
        .json(json!({
            "success": true
        }))
}

#[post("/payment/package/{packageid}/info")]
pub async fn package_info(pool: web::Data<DbPool>, info: web::Path<PackageID>) -> impl Responder {
    use crate::structs::schema::package_information::dsl::*;

    let conn = pool.get().unwrap();

    let results = package_information
        .filter(package_id.eq(&info.packageid))
        .load::<crate::structs::models::PackageInformation>(&conn)
        .expect("Error loading package information");

    let mut package_data = serde_json::Value::Null;

    for information in results {
        if information.package_visible {
            // Package visible, return data
            package_data = json!({
                "price": format!("${}", information.price.to_string()),
                // TODO: Implement Auth0 and vapas_users here
                "purchased": false,
                "available": true
            })
        } else {
            // Package not visible, don't return data
            package_data = json!({
                "available": false,
                "error": "Package not visible... How did you get here?",
                "recovery_url": "https://excuseme.wtf/"
            })
        }
    }

    HttpResponse::Ok()
        .json(package_data)
}

// Purchases

#[post("/payment/package/{packageid}/purchase")]
pub async fn purchase(pool: web::Data<DbPool>, info: web::Path<PackageID>) -> impl Responder {
    // TODO: Implement Auth0, vapas_users, and Stripe here
    HttpResponse::Ok()
        .json(json!({
            "success": 0
        }))
}