extern crate rocket;
extern crate dotenv_codegen;
extern crate dotenv;

use rocket::http::Status;

// On Base Route

#[get("/payment_endpoint")]
pub fn payment_endpoint() -> String {
    return format!("{}/payment/", dotenv!("URL")).into()
}

#[get("/payment")]
pub fn payment_response() -> Status {
    return Status::Ok
}

// On "/payment" Route

#[get("/info")]
pub fn payment_info() -> String {
    return json!({
        "name": "Vapas",
        "icon": format!("{}/CydiaIcon.png", dotenv!("URL")),
        "description": "Sign into Vapas to purchase and download paid packages.",
        "authentication_banner": {
            "message": "Sign into Vapas to purchase and download paid packages.",
            "button": "Sign in"
        }
    }).to_string()
}