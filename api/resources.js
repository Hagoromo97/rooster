import pool from './lib/db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT id, title, group_name AS "group", order_weight AS "orderWeight", is_summary AS "isSummary" FROM resources WHERE is_summary = FALSE ORDER BY order_weight, group_name, title'
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { id, title, group } = req.body;
      if (!id || !title) return res.status(400).json({ error: 'Missing required fields' });
      const groupName = typeof group === 'string' && group.trim() ? group.trim() : 'General';

      await pool.query(
        'INSERT INTO route_groups (name) VALUES ($1) ON CONFLICT DO NOTHING',
        [groupName]
      );

      await pool.query(
        'INSERT INTO resources (id, title, group_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [id, title, groupName]
      );
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      const { id, title, group } = req.body;
      if (!id || !title) return res.status(400).json({ error: 'Missing required fields' });
      const groupName = typeof group === 'string' && group.trim() ? group.trim() : 'General';

      await pool.query(
        'INSERT INTO route_groups (name) VALUES ($1) ON CONFLICT DO NOTHING',
        [groupName]
      );

      await pool.query(
        'UPDATE resources SET title = $1, group_name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [title, groupName, id]
      );
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      await pool.query('DELETE FROM resources WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
