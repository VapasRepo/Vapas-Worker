extern crate actix_web;
extern crate diesel;
extern crate dotenv;

use actix_web::{get, web, HttpResponse, Responder};

use diesel::prelude::*;
use dotenv::dotenv;
use serde::Serialize;
use std::env;

use crate::services::database::DbPool;

#[get("/payment_endpoint")]
pub async fn payment_endpoint() -> impl Responder {
    dotenv().ok();

    HttpResponse::Ok().body(format!("{}/payment/", env::var("URL").unwrap()))
}

#[get("/payment")]
pub async fn payment_response() -> impl Responder {
    HttpResponse::Ok()
}

// Payment information
#[derive(Serialize)]
struct PaymentInformationStruct {
    name: String,
    icon: String,
    description: String,
    authentication_banner: PaymentInformationBannerStruct,
}

// Payment information banner
#[derive(Serialize)]
struct PaymentInformationBannerStruct {
    message: String,
    button: String,
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
