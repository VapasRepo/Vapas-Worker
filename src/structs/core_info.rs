#![allow(non_snake_case)]

use serde::Serialize;

// Sileo Featured Struct
#[derive(Serialize)]
pub struct SileoFeaturedStruct {
    pub(crate) class: String,
    pub(crate) itemSize: String,
    pub(crate) itemCornerRadius: u64,
    pub(crate) banners: Vec<SileoFeaturedBannerStruct>,
}

// Sileo Featured Banner Struct
#[derive(Serialize)]
pub struct SileoFeaturedBannerStruct {
    pub(crate) url: String,
    pub(crate) title: String,
    pub(crate) package: String,
    pub(crate) hideShadow: bool,
}