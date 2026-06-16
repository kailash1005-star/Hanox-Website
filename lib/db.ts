/* MongoDB connection (Atlas).
 *
 * Serverless-safe: caches a single MongoClient promise on globalThis so that
 * hot-reload (dev) and re-used Lambda containers (Vercel) don't open a new
 * connection on every request.
 *
 * No-op friendly: if MONGODB_URI is not set, getDb() throws a typed error that
 * callers catch — payment/email flows must keep working even without the DB.
 *
 * Server-only — never import from client components. */

import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "Hanox";

export class DbDisabledError extends Error {
  constructor() {
    super("MONGODB_URI is not set — database is disabled.");
    this.name = "DbDisabledError";
  }
}

export function isDbConfigured(): boolean {
  return Boolean(uri);
}

// Cache across hot-reloads / warm invocations.
const g = globalThis as unknown as { _mongoClientPromise?: Promise<MongoClient> };

function clientPromise(): Promise<MongoClient> {
  if (!uri) throw new DbDisabledError();
  if (!g._mongoClientPromise) {
    const client = new MongoClient(uri);
    g._mongoClientPromise = client.connect();
  }
  return g._mongoClientPromise;
}

/** Get the application database handle. Throws DbDisabledError if unconfigured. */
export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}
