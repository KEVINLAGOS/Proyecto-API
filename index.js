const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const app = express();
const cors = require('cors');
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
const swaggerUI = require('swagger-ui-express');
const swaggerjsDoc = require('swagger-jsdoc');
const multer = require('multer');
const bodyParser = require('body-parser');

app.use(morgan('combined', { stream: accessLogStream }));
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const folder = path.join(__dirname + '/archivos/');
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, folder) },
    filename: function (req, file, cb) { cb(null, file.originalname) }
});
const upload = multer({ storage: storage });
app.use(upload.single('archivo'));

const PORT = process.env.PORT || 3001
const PORTE = process.env.MYSQLPORT|| 3306;
const HOST = process.env.MYSQLHOST || 'localhost';
const USER = process.env.MYSQLUSER || 'root';
const PASSWORD = process.env.MYSQLPASSWORD || '';
const DATABASE = process.env.MYSQL_DATABASE || 'ejemplo';
const URL = process.env.URL;

const MySqlConnection = { host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORTE };

const data = fs.readFileSync(path.join(__dirname, './Options.json'), { encoding: 'utf8', flag: 'r' });
const obj = JSON.parse(data);

const swaggerOptions = {
    definition: obj,
    apis: [`${path.join(__dirname, "./index.js")}`],
};
/**
 * @swagger
 * /computadoras:
 *   get:
 *     summary: Obtiene la lista de computadoras.
 *     description: Retorna la lista completa de computadoras almacenadas en la base de datos.
 *     tags:
 *       - Computadoras
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Éxito. Retorna la lista de computadoras.
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 marca: Dell
 *                 modelo: XPS 13
 *                 procesador: Intel Core i7
 *                 ram_gb: 16
 *                 almacenamiento_gb: 512
 *                 tipo_almacenamiento: SSD
 *                 sistema_operativo: Windows 10
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Error en la base de datos.
 */
app.get("/computadoras", async (req, res) => {
    try {
        const token = req.token;

        const conn = await mysql.createConnection(MySqlConnection);
        const [rows, fields] = await conn.query('SELECT * from Computadoras');
        res.json(rows);

    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

/**
 * @swagger
 * /computadoras/{id}:
 *   get:
 *     summary: Obtiene una computadora por ID.
 *     description: Retorna los detalles de una computadora específica según el ID proporcionado.
 *     tags:
 *       - Computadoras
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la computadora a consultar.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Éxito. Retorna los detalles de la computadora.
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               marca: Dell
 *               modelo: XPS 13
 *               procesador: Intel Core i7
 *               ram_gb: 16
 *               almacenamiento_gb: 512
 *               tipo_almacenamiento: SSD
 *               sistema_operativo: Windows 10
 *       404:
 *         description: No encontrado. La computadora con el ID proporcionado no existe.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Computadora no existe.
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Error en la base de datos.
 */
app.get("/computadoras/:id", async (req, res) => {
    console.log(req.params.id);
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [rows, fields] = await conn.query('SELECT * FROM Computadoras WHERE id = ?', [req.params.id]);
        if (rows.length == 0) {
            res.status(404).json({ mensaje: "Computadora no existe" });
        } else {
            res.json(rows);
        }
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});
/**
 * @swagger
 * /insertar:
 *   post:
 *     summary: Inserta una nueva computadora.
 *     description: Inserta una nueva computadora en la base de datos con la información proporcionada.
 *     tags:
 *       - Computadoras
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             marca: Dell
 *             modelo: XPS 13
 *             procesador: Intel Core i7
 *             ram_gb: 16
 *             almacenamiento_gb: 512
 *             tipo_almacenamiento: SSD
 *             sistema_operativo: Windows 10
 *     responses:
 *       200:
 *         description: Éxito. Datos insertados correctamente.
 *         content:
 *           application/json:
 *             example:
 *               message: Datos insertados correctamente.
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               message: Error al insertar datos.
 */
app.post('/insertar', async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);

        const { marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo } = req.body;

        const [rows, fields] = await conn.execute(
            'INSERT INTO Computadoras (marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo]
        );

        res.json({ message: 'Datos insertados correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al insertar datos' });
    }
});
/**
 * @swagger
 * /computadoras/{id}:
 *   put:
 *     summary: Actualiza una computadora por ID.
 *     description: Actualiza la información de una computadora específica según el ID proporcionado.
 *     tags:
 *       - Computadoras
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la computadora a actualizar.
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             marca: Dell
 *             modelo: XPS 13
 *             procesador: Intel Core i7
 *             ram_gb: 16
 *             almacenamiento_gb: 512
 *             tipo_almacenamiento: SSD
 *             sistema_operativo: Windows 10
 *     responses:
 *       200:
 *         description: Éxito. Computadora actualizada correctamente.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: ACTUALIZADO
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Error en la base de datos.
 */
app.put("/computadoras/:id", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo } = req.body;

        await conn.query(
            'UPDATE Computadoras SET marca = ?, modelo = ?, procesador = ?, ram_gb = ?, almacenamiento_gb = ?, tipo_almacenamiento = ?, sistema_operativo = ? WHERE id = ?',
            [marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo, req.params.id]
        );
        res.json({ mensaje: "ACTUALIZADO" });
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});
/**
 * @swagger
 * /computadoras/{id}:
 *   delete:
 *     summary: Elimina una computadora por ID.
 *     description: Elimina una computadora específica de la base de datos según el ID proporcionado.
 *     tags:
 *       - Computadoras
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la computadora a eliminar.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Éxito. Computadora eliminada correctamente.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Registro Eliminado
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Error en la base de datos.
 */
app.delete("/computadoras/:id", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [rows, fields] = await conn.query('DELETE FROM Computadoras WHERE id = ?', [req.params.id]);

        if (rows.affectedRows == 0) {
            res.json({ mensaje: "Registro No Eliminado" });
        } else {
            res.json({ mensaje: "Registro Eliminado" });
        }

    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

const swaggerDocs = swaggerjsDoc(swaggerOptions);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
app.get("/options", (req, res) => {
    res.json(data);
});

app.use("/api-docs-json", (req, res) => {
    res.json(swaggerDocs);
});

app.listen(PORT, () => {
    console.log("Servidor express escuchando en el puerto " + PORT);
});
