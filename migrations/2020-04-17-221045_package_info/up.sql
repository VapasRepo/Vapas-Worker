-- Your SQL goes here
create table package_information
(
    package_id           text                 PRIMARY KEY,
    package_visible      boolean default true not null,
    name                 text                 not null,
    developer_name       text                 not null,
    developer_id         text                 not null,
    section              text                 not null,
    depends              text                 not null,
    support_name         text                 not null,
    support_url          text                 not null,
    price                integer              not null,
    version              text                 not null,
    version_release_date date                 not null,
    version_size         integer              not null,
    version_hash         text                 not null,
    version_changes      text[]               not null,
    short_description    text                 not null,
    long_description     text                 not null,
    icon                 text                 not null,
    tint                 text                 not null,
    header_image         text                 not null,
    screenshots          text[]               not null,
    known_issues         text[]               not null
)