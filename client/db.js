import pkg from 'pg';

const { Pool } = pkg;

export const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mcp_agent',
    password: 'root',
    port: 5432
});