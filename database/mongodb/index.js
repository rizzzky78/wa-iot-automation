const { MongoClient, ServerApiVersion } = require("mongodb");

const client = new MongoClient("MONGODB_URI", {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const Database = client.db("DATABASE_NAME");

/**
 * @type { import("@database/schema").MongoCollection }
 */
const collections = {
  user: Database.collection("USER_COLLECTION_NAME"),
};

module.exports = { collections };
