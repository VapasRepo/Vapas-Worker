#[derive(Queryable)]
pub struct PackageInformation {
    pub package_id: String,
    pub package_visible: bool,
    pub name: String,
    pub developer_name: String,
    pub developer_id: String,
    pub section: String,
    pub depends: String,
    pub support_name: String,
    pub support_url: String,
    // TODO: Oops, this should be a double because cents exists
    pub price: i32,
    pub version: String,
    pub version_release_date: chrono::NaiveDate,
    pub version_size: i32,
    pub version_hash: String,
    pub version_changes: Vec<String>,
    pub short_description: String,
    pub long_description: String,
    pub icon: String,
    pub tint: String,
    pub header_image: String,
    pub screenshots: Vec<String>,
    pub known_issues: Vec<String>,
}

#[derive(Queryable)]
pub struct VapasFeatured {
    pub url: String,
    pub title: String,
    pub package: String,
    pub hide_shadow: bool,
}

#[derive(Queryable)]
pub struct VapasRelease {
    pub origin: String,
    pub label: String,
    pub suite: String,
    pub version: String,
    pub codename: String,
    pub architectures: String,
    pub components: String,
    pub description: String,
}

#[derive(Queryable)]
pub struct VapasPaymentInfo {
    pub name: String,
    pub description: String,
    pub banner_message: String,
}

#[derive(Queryable)]
pub struct VapasUsers {
    pub id: String,
    pub owned_packages: Vec<String>,
    pub is_developer: bool,
    pub is_admin: bool,
    pub stripe_token: String,
    pub stripe_publish_key: String,
    pub stripe_user_id: String
}