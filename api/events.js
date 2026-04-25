import pool from './lib/db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT id, title, resource_id AS resourceId, start_time AS start, end_time AS end, color FROM events ORDER BY start_time'
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { id, title, resourceId, start, end, color } = req.body;
      if (!id || !title || !resourceId || !start || !end) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await pool.query(
        'INSERT INTO events (id, title, resource_id, start_time, end_time, color) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
        [id, title, resourceId, new Date(start), new Date(end), color || '#3b82f6']
      );
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      const { id, title, resourceId, start, end, color } = req.body;
      if (!id || !title || !resourceId || !start || !end) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await pool.query(
        'UPDATE events SET title = $1, resource_id = $2, start_time = $3, end_time = $4, color = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6',
        [title, resourceId, new Date(start), new Date(end), color || '#3b82f6', id]
      );
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      await pool.query('DELETE FROM events WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
