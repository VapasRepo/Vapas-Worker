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