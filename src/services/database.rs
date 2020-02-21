extern crate dotenv_codegen;
extern crate dotenv;
extern crate mongodb;
extern crate bson;
extern crate rustc_serialize;

use mongodb::{Client};
use mongodb::error::Result as MongoResult;

use rustc_serialize::json::{Json, ToJson};

use bson::{Bson, Document};

pub fn db_client() -> mongodb::error::Result<Client> {
    return Client::with_uri_str(dotenv!("dbURL"));
}

pub fn find_documents(_collection_name: String, _search_key: String, _search_value: String) -> mongodb::Cursor {
    let db = db_client().unwrap();
    let coll = db.database("vapasContent").collection(&_collection_name);

    return coll.find(doc!{_search_key : _search_value}, None).unwrap();
}


pub fn get_data_string(result: MongoResult<Document>) -> Result<Bson, String> {
    match result {
        Ok(doc) => Ok(bson::Bson::Document(doc)),
        Err(e) => Err(format!("{}", e))
    }
}