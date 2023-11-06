const knexConfig = {
    development: {
        client: 'pg',
        connection: {
            host: '192.168.1.153',
            user: 'joec05',
            password: 'josccarl123',
            database: 'users_profiles',
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
