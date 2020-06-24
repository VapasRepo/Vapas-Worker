use serde::Deserialize;

// PackageID struct
#[derive(Deserialize)]
pub struct PackageID {
    pub(crate) packageid: String
}