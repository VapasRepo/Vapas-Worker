#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use] extern crate rocket;
#[macro_use] extern crate dotenv_codegen;
extern crate rocket_contrib;
extern crate dotenv;

use rocket::response::Redirect;
use rocket_contrib::serve::StaticFiles;
use dotenv::dotenv;

#[get("/cydiaRedirect")]
fn cydia_redirect() -> Redirect {
    println!("{}", dotenv!("URL"));
    Redirect::to(format!("cydia://url/https://cydia.saurik.com/api/share#?source={}", dotenv!("URL")))
}

fn main() {
    dotenv().ok();
    rocket::ignite()
        .mount("/", routes![cydia_redirect])
        .mount("/", StaticFiles::from("public/"))
        .launch();
}
