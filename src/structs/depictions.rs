use askama_actix::Template;

#[derive(Template)]
#[template(path = "../../public/depiction_template.html")]
struct WebDepiction<'a> {
    name: &'a str,
}