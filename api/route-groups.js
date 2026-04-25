import pool from './lib/db.js';

function normalizeGroupName(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function isGeneralGroup(value) {
  return normalizeGroupName(value).toLowerCase() === 'general';
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await pool.query(
        `SELECT name
         FROM route_groups
         ORDER BY CASE WHEN LOWER(name) = 'general' THEN 0 ELSE 1 END, name`
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const name = normalizeGroupName(req.body?.name);
      if (!name) return res.status(400).json({ error: 'Missing group name' });

      await pool.query(
        'INSERT INTO route_groups (name) VALUES ($1) ON CONFLICT DO NOTHING',
        [name]
      );
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      const oldName = normalizeGroupName(req.body?.name);
      const newName = normalizeGroupName(req.body?.newName);

      if (!oldName || !newName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (isGeneralGroup(oldName) && !isGeneralGroup(newName)) {
        return res.status(400).json({ error: 'General group cannot be renamed' });
      }

      const duplicateCheck = await pool.query(
        'SELECT 1 FROM route_groups WHERE LOWER(name) = LOWER($1) AND LOWER(name) <> LOWER($2) LIMIT 1',
        [newName, oldName]
      );
      if (duplicateCheck.rowCount > 0) {
        return res.status(409).json({ error: 'Group name already exists' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query(
          'UPDATE route_groups SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(name) = LOWER($2)',
          [newName, oldName]
        );

        await client.query(
          'UPDATE resources SET group_name = $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(group_name) = LOWER($2)',
          [newName, oldName]
        );

        await client.query(
          'INSERT INTO route_groups (name) VALUES ($1) ON CONFLICT DO NOTHING',
          ['General']
        );

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const name = normalizeGroupName(req.body?.name);
      if (!name) return res.status(400).json({ error: 'Missing group name' });
      if (isGeneralGroup(name)) {
        return res.status(400).json({ error: 'General group cannot be deleted' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query('DELETE FROM route_groups WHERE LOWER(name) = LOWER($1)', [name]);
        await client.query(
          "UPDATE resources SET group_name = 'General', updated_at = CURRENT_TIMESTAMP WHERE LOWER(group_name) = LOWER($1)",
          [name]
        );
        await client.query(
          'INSERT INTO route_groups (name) VALUES ($1) ON CONFLICT DO NOTHING',
          ['General']
        );

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
