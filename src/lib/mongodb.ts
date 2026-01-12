import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const globalWithMongoose = global as unknown as { mongooseConn?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } };

async function connectMongo() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!globalWithMongoose.mongooseConn) {
    globalWithMongoose.mongooseConn = { conn: null, promise: null };
  }

  if (globalWithMongoose.mongooseConn.conn) {
    return globalWithMongoose.mongooseConn.conn;
  }

  if (!globalWithMongoose.mongooseConn.promise) {
    globalWithMongoose.mongooseConn.promise = mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
  }

  globalWithMongoose.mongooseConn.conn = await globalWithMongoose.mongooseConn.promise;
  return globalWithMongoose.mongooseConn.conn;
}

export default connectMongo;