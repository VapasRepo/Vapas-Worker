use diesel::pg::types::date_and_time::PgDate;
use diesel::pg::types::sql_types::Array;

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
    pub price: i32,
    pub version: String,
    pub version_release_date: PgDate,
    pub version_size: i32,
    pub version_hash: String,
    pub version_changes: Array<String>,
    pub short_description: String,
    pub long_description: String,
    pub icon: String,
    pub tint: String,
    pub header_image: String,
    pub screenshots: Array<String>,
    pub known_issues: Array<String>,
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