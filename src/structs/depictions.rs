use askama::Template;

#[derive(Template)]
#[template(path = "depiction.html")]
struct WebDepiction<'a> {
    name: &'a str,
}