import pool from './lib/db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await pool.query('SELECT id, name FROM drivers ORDER BY name');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { id, name } = req.body;
      if (!id || !name) return res.status(400).json({ error: 'Missing required fields' });

      try {
        await pool.query(
          'INSERT INTO drivers (id, name) VALUES ($1, $2)',
          [id, name]
        );
        return res.status(201).json({ success: true });
      } catch (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: 'Driver name already exists' });
        }
        throw error;
      }
    }

    if (req.method === 'PUT') {
      const { id, name } = req.body;
      if (!id || !name) return res.status(400).json({ error: 'Missing required fields' });

      try {
        await pool.query(
          'UPDATE drivers SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [name, id]
        );
        return res.status(200).json({ success: true });
      } catch (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: 'Driver name already exists' });
        }
        throw error;
      }
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      await pool.query('DELETE FROM drivers WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
