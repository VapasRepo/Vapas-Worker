extern crate rocket;
extern crate dotenv_codegen;
extern crate dotenv;


use dotenv::dotenv;
use std::env;

// On Base Route

#[get("/payment_endpoint")]
pub fn payment_endpoint() -> String {
    dotenv().ok();

    return format!("{}/payment/", env::var("URL").unwrap()).into()
}

#[get("/payment")]
pub fn payment_response() -> Status {
    return Status::Ok
}

// On "/payment" Route

#[get("/info")]
pub fn payment_info() -> String {
    dotenv().ok();

    return json!({
        "name": "Vapas",
        "icon": format!("{}/CydiaIcon.png", env::var("URL").unwrap()),
        "description": "Sign into Vapas to purchase and download paid packages.",
        "authentication_banner": {
            "message": "Sign into Vapas to purchase and download paid packages.",
            "button": "Sign in"
        }
    }).to_string()
}