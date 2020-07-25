use serde::{Serialize, Deserialize};

// Payment information
#[derive(Serialize)]
pub struct PaymentInformationStruct {
    pub(crate) name: String,
    pub(crate) icon: String,
    pub(crate) description: String,
    pub(crate) authentication_banner: PaymentInformationBannerStruct,
}

// Payment information banner
#[derive(Serialize)]
pub struct PaymentInformationBannerStruct {
    pub(crate) message: String,
    pub(crate) button: String,
}

// Sileo auth query
#[derive(Deserialize)]
pub struct AuthQuery {
    pub udid: String,
    pub model: String
}

// Auth0 callback query
#[derive(Deserialize)]
pub struct Auth0CallbackQuery {
    pub code: String,
    pub state: String
}

// Auth0 code query
#[derive(Deserialize)]
pub struct Auth0CodeQuery {
    pub access_token: String,
    pub expires_in: i32,
    pub token_type: String
}

// Sileo package post request
#[derive(Deserialize)]
pub struct SileoPackageRequest {
    pub token: String,
    pub udid: String,
    pub device: String
}