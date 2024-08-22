const { MongoClient, ServerApiVersion } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const Database = client.db("IoT");

/**
 * @type { import("@database/schema").MongoCollection }
 */
const collections = {
  user: Database.collection("user"),
};

module.exports = { collections };
