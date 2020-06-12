table! {
    package_information (package_id) {
        package_id -> Text,
        package_visible -> Bool,
        name -> Text,
        developer_name -> Text,
        developer_id -> Text,
        section -> Text,
        depends -> Text,
        support_name -> Text,
        support_url -> Text,
        price -> Int4,
        version -> Text,
        version_release_date -> Date,
        version_size -> Int4,
        version_hash -> Text,
        version_changes -> Array<Text>,
        short_description -> Text,
        long_description -> Text,
        icon -> Text,
        tint -> Text,
        header_image -> Text,
        screenshots -> Array<Text>,
        known_issues -> Array<Text>,
    }
}

table! {
    vapas_featured (package) {
        url -> Text,
        title -> Text,
        package -> Text,
        hide_shadow -> Bool,
    }
}

table! {
    vapas_payment_info (name) {
        name -> Text,
        description -> Text,
        banner_message -> Text,
    }
}

table! {
    vapas_release (origin) {
        origin -> Text,
        label -> Text,
        suite -> Text,
        version -> Text,
        codename -> Text,
        architectures -> Text,
        components -> Text,
        description -> Text,
    }
}

allow_tables_to_appear_in_same_query!(
    package_information,
    vapas_featured,
    vapas_payment_info,
    vapas_release,
);
