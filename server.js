const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Asegúrate de que el archivo db.js esté configurado correctamente.
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ruta para servir el archivo HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html'); // Asegúrate de usar la ruta correcta
});

// Ruta para agregar un nuevo usuario
app.post('/usuario', async (req, res) => {
  const { nombre, balance } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, balance) VALUES ($1, $2) RETURNING *',
      [nombre, balance]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener todos los usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para actualizar un usuario
app.put('/usuario', async (req, res) => {
  const { id, nombre, balance } = req.body;
  try {
    const result = await pool.query(
      'UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3 RETURNING *',
      [nombre, balance, id]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para eliminar un usuario
app.delete('/usuario', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para realizar una transferencia
app.post('/transferencia', async (req, res) => {
  const { emisor, receptor, monto } = req.body;
  try {
    await pool.query('BEGIN');
    await pool.query('UPDATE usuarios SET balance = balance - $1 WHERE id = $2', [monto, emisor]);
    await pool.query('UPDATE usuarios SET balance = balance + $1 WHERE id = $2', [monto, receptor]);
    const result = await pool.query(
      'INSERT INTO transferencias (emisor, receptor, monto, fecha) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [emisor, receptor, monto]
    );
    await pool.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener todas las transferencias
app.get('/transferencias', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transferencias');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo el http://localhost:${PORT}/ `);
});
