import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { default: pool } = await import('./lib/db.js');

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Creating tables...');

    // Resources table
    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        group_name TEXT DEFAULT 'General',
        order_weight INTEGER DEFAULT 0,
        is_summary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Route groups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS route_groups (
        name TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        color TEXT DEFAULT '#3b82f6',
        editable BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Drivers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_events_resource_id ON events(resource_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time)
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_route_groups_name_lower ON route_groups(LOWER(name))
    `);

    await client.query(`
      INSERT INTO route_groups (name)
      VALUES ('General')
      ON CONFLICT DO NOTHING
    `);

    await client.query(`
      INSERT INTO route_groups (name)
      SELECT DISTINCT COALESCE(NULLIF(TRIM(group_name), ''), 'General')
      FROM resources
      ON CONFLICT DO NOTHING
    `);

    console.log('Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

initializeDatabase();
