/* MongoDB connection — server-only. Never import from client code.
 *
 * On Vercel each serverless invocation can reuse a "warm" instance, but module
 * state is NOT shared across instances. The danger is opening a brand-new pool
 * on every cold start / hot reload and exhausting Atlas connections. We cache
 * the connecting Promise on `globalThis` so a warm instance reuses one pool, and
 * dev hot-reload doesn't leak pools.
 *
 * Required env:
 *   MONGODB_URI  — the mongodb+srv connection string (server-only secret)
 *   MONGODB_DB   — database name (defaults to "Hanox")
 */

import { MongoClient, type Db } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "Hanox";

// Reuse a single client Promise across warm invocations and hot reloads.
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

function clientPromise(): Promise<MongoClient> {
  if (!URI) {
    throw new Error("MONGODB_URI is not set — cannot connect to the database.");
  }
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(URI, {
      // Conservative pool for serverless: many concurrent functions, each needs
      // only a handful of sockets. Keeps us well under Atlas connection limits.
      maxPoolSize: 10,
      minPoolSize: 0,
      retryWrites: true,
      // Fail fast instead of hanging a payment request on a dead DB.
      serverSelectionTimeoutMS: 8000,
    });
    globalForMongo._mongoClientPromise = client.connect();
  }
  return globalForMongo._mongoClientPromise;
}

/** Whether the database is configured (MONGODB_URI present). Lets best-effort
 *  callers (lead/order capture) skip cleanly instead of throwing when unset. */
export function isDbConfigured(): boolean {
  return Boolean(URI);
}

/** Get the application database handle (connects lazily, reuses the pool). */
export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(DB_NAME);
}
