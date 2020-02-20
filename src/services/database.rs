extern crate dotenv_codegen;
extern crate dotenv;
extern crate mongodb;

use mongodb::{Client, Cursor};

pub fn db_client() -> mongodb::<Client> {
    return Client::with_uri_str(env!("dbURL"));
}

pub fn find_documents(db: String,collection_name: String, search: String) -> mongodb::<Cursor> {
    let db = db_client().database("vapasContent");
    let coll = db.collection(collection_name);

    let coll_ref = coll.clone();

    std::thread::spawn(move || {
        return coll_ref.find(search);
    });
}