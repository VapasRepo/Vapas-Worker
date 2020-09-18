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
use self::actix_web::web::Query;

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
            "name": "Evie Viau",
            "email": "evie.viau@gmail.com"
        }
    });
    HttpResponse::Ok()
        .json(user_info)
}

#[get("/payment/authenticate")]
pub async fn authenticate(info: Query<AuthQuery>) -> impl Responder {
    HttpResponse::TemporaryRedirect()
        .header(http::header::LOCATION, format!("https://{}/authorize?response_type=code&client_id={}&redirect_uri={}/payment/auth0callback&state={}&scope=openid%20profile%20email",
        env::var("auth0URL").unwrap(),
        env::var("auth0clientID").unwrap(),
        env::var("URL").unwrap(),
        info.udid))
        .finish()
}

#[get("/payment/auth0callback")]
pub async fn auth0callback(info: Query<Auth0CallbackQuery>) -> impl Responder {
    println!("{}", info.code);
    let post_client = reqwest::Client::new();
    let response = post_client
        .post(&format!("https://{}/oauth/token", env::var("auth0URL").unwrap()))
        .header("Content-Type", "application/json")
        .body(to_vec(&json!({
            "grant_type": "authorization_code",
            "client_id": env::var("auth0clientID").unwrap(),
            "client_secret": env::var("auth0clientSecret").unwrap(),
            "code": &info.code,
            "redirect_uri": format!("{}", env::var("URL").unwrap())
        })).unwrap())
        .send()
        .await
        .unwrap()
        .text()
        .await
        .unwrap();
    println!("{}", response);
    let response_json = serde_json::from_str::<Auth0CodeQuery>(&response).unwrap();
    println!("{}", response_json.id_token);
    HttpResponse::TemporaryRedirect()
        .header(http::header::LOCATION, format!("sileo://authentication_success?token={}&payment_secret={}",
        response_json.id_token,
        "jr38tgh9t832gew89gt3j8y4hjgmf92r1jt38gfhrq5jtwyhsgfekart0gh9fet8yhrgw89e3qw6h4gfn5ty5hgrfgh34ty5894g"))//TODO: Get a payment secret
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
pub async fn package_info(pool: web::Data<DbPool>, info: web::Path<PackageID>, post: web::Json<SileoPackageRequest>) -> impl Responder {
    use crate::structs::schema::package_information::dsl::*;
    use crate::structs::schema::vapas_users::dsl::*;

    let conn = pool.get().unwrap();

    let auth0_id = "auth0|5d3c133d96ba380cb390ee59".to_string();// Temporary hardcoded auth0 id

    let results = package_information
        .filter(package_id.eq(&info.packageid))
        .load::<crate::structs::models::PackageInformation>(&conn)
        .expect("Error loading package information");

    let user_results = vapas_users
        .filter(user_id.eq(auth0_id))
        .load::<crate::structs::models::VapasUsers>(&conn)
        .expect("Error loading user information");

    let mut package_data = serde_json::Value::Null;

    let mut purchased = false;

        for information in user_results {
            if information.owned_packages.unwrap().contains(&info.packageid) {
                purchased = true;
            }
        }

    for information in results {
        if information.package_visible {
            // Package visible, return data
            package_data = json!({
                "price": format!("${}", information.price.to_string()),
                "purchased": purchased,
                "available": information.package_visible
            })
        } else {
            // Package not visible, don't return data
            package_data = json!({
                "available": information.package_visible,
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
            "status": 1,
            "url": "https://excuseme.wtf"
        }))
}