const knexConfig = {
    development: {
        client: 'pg',
        connection: {
            host: '127.0.0.1',
            user: 'joec05',
            password: 'josccarl123',
            database: 'users-profile-db', // Your database name
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
