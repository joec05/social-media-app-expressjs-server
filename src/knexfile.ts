import { Knex } from 'knex'


const knexConfig: Record<string, Knex.Config> = {
  development: {
    client: 'pg', // Your database client (e.g., 'pg' for PostgreSQL)
    connection: {
      host: '192.168.1.153', // Your database host
      user: 'joec05', // Your database username
      password: 'josccarl123', // Your database password
      database: 'users_profiles', // Your database name,
      port: 5433
    },
    migrations: {
      directory: './db/migrations', // Adjust the path to your migrations directory
    },
    seeds: {
      directory: './db/seeds', // Adjust the path to your seeds directory
    },
  },
  // Add other environments (e.g., 'production', 'staging') if needed
};

export default knexConfig;
