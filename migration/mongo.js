import { MongoClient } from 'mongodb';

const { mongoDbName, mongoUri } = { mongoDbName: 'migration', mongoUri: 'mongodb://localhost:27017'};

const client = new MongoClient(mongoUri, { directConnection: true });

console.log(`Try to connect to mongo... ${mongoUri}`);
await client.connect().catch((e) => {
  console.log(`Connexion to mongo instance failed... Terminating... ${e.message}`);
  process.kill(process.pid, 'SIGTERM');
});

console.log(`Connected to mongo database... ${mongoDbName}`);
const db = client.db(mongoDbName);

const clearDB = async (_db, exclude = []) => {
  const collections = await _db.listCollections().toArray();
  const excludeAll = [...exclude, 'system.views'];
  const collectionsToDelete = collections.filter((collection) => (!(excludeAll.includes(collection.name))));
  return Promise.all(collectionsToDelete.map((collection) => _db.collection(collection.name).drop()));
};

export { clearDB, client, db };
