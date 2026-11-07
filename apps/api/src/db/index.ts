import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.ts";

export type Database = PostgresJsDatabase<typeof schema>;

export function createDatabase(connectionString: string): { db: Database; close: () => Promise<void> } {
  const sql = postgres(connectionString, {
    max: 1,
    fetch_types: false,
    // Leave SSL to the connection string. Direct Neon URLs set sslmode=require.
    // Hyperdrive's socket from the Worker does not support SSL, and forcing it
    // fails the first query with SSL_NOT_SUPPORTED.
    connect_timeout: 15,
  });
  const db = drizzle(sql, { schema });
  return {
    db,
    close: async () => {
      await sql.end({ timeout: 1 });
    },
  };
}
