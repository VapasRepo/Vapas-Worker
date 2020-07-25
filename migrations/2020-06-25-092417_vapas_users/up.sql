create table vapas_users
(
    user_id text not null,
    owned_packages text[],
    is_developer bool default false not null,
    is_admin bool default false not null,
    stripe_token text,
    stripe_publish_key text,
    stripe_user_id text
);

create unique index vapas_users_id_uindex
    on vapas_users (user_id);

alter table vapas_users
    add constraint vapas_users_pk
        primary key (user_id);