import { pool } from './db.js';

export async function saveMessage(sessionId, role, content) {
    const result = await pool.query(
        `INSERT INTO chat_message (session_id, role, content)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [sessionId, role, content]
    );

    return result.rows[0].id;
}