const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); // Reemplaza './swagger.json' con la ubicación real de tu archivo Swagger
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuración de conexión a la base de datos MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
    return;
  }
  console.log('Conexión a la base de datos exitosa');
});

// Middleware para analizar solicitudes JSON
app.use(bodyParser.json());

// Middleware para servir la documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Ruta para obtener todas las computadoras
app.get('/computadoras', (req, res) => {
  connection.query('SELECT * FROM Computadoras', (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }
    res.json(results);
  });
});

// Ruta para crear una nueva computadora
app.post('/computadoras', (req, res) => {
  const { marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo, precio, fecha_adquisicion } = req.body;
  const query = 'INSERT INTO Computadoras (marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo, precio, fecha_adquisicion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  connection.query(query, [marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo, precio, fecha_adquisicion], (err, result) => {
    if (err) {
      console.error('Error al crear la computadora:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }
    res.status(201).json({ message: 'Computadora creada exitosamente', id: result.insertId });
  });
});

// Ruta para actualizar una computadora existente
app.put('/computadoras/:id', (req, res) => {
  const { id } = req.params;
  const { marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo, precio, fecha_adquisicion } = req.body;
  const query = 'UPDATE Computadoras SET marca = ?, modelo = ?, procesador = ?, ram_gb = ?, almacenamiento_gb = ?, tipo_almacenamiento = ?, sistema_operativo = ?, precio = ?, fecha_adquisicion = ? WHERE id = ?';
  connection.query(query, [marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo, precio, fecha_adquisicion, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar la computadora:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }
    res.json({ message: 'Computadora actualizada exitosamente' });
  });
});

// Ruta para eliminar una computadora
app.delete('/computadoras/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM Computadoras WHERE id = ?';
  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar la computadora:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }
    res.json({ message: 'Computadora eliminada exitosamente' });
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
