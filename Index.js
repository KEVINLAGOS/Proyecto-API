const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bearerToken = require('express-bearer-token');
const app = express();
const cors = require('cors');
const swaggerUI = require('swagger-ui-express');
const swaggerjsDoc = require('swagger-jsdoc');
const multer = require('multer');

// Configuración de morgan para registrar solicitudes HTTP
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(cors());
app.use(express.json());
app.use(bearerToken());

// Configuración de multer para la carga de archivos
const folder = path.join(__dirname, '/archivos/');
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, folder); },
    filename: function (req, file, cb) { cb(null, file.originalname); }
});
const upload = multer({ storage: storage });
app.use(express.urlencoded({ extended: true }));
app.use(upload.single('archivo'));

// Variables de entorno
const PORT = process.env.PORT || 3000;
const PORTE = process.env.MYSQLPORT;
const HOST = process.env.MYSQLHOST || 'localhost';
const USER = process.env.MYSQLUSER || 'root';
const PASSWORD = process.env.MYSQLPASSWORD || '17112001';
const DATABASE = process.env.MYSQL_DATABASE || 'railway';
const URL = process.env.URL;

const MySqlConnection = { host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORTE };

// Leer y parsear el archivo de configuración de Swagger
const data = fs.readFileSync(path.join(__dirname, './Options.json'), { encoding: 'utf8', flag: 'r' });
const obj = JSON.parse(data);

const swaggerOptions = {
    definition: obj,
    apis: [`${path.join(__dirname, "./index.js")}`],
};
const swaggerDocs = swaggerjsDoc(swaggerOptions);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
app.get("/options", (req, res) => {
    res.json(data);
});
app.use("/api-docs-json", (req, res) => {
    res.json(swaggerDocs);
});

/**
 * @swagger
 * /computadoras:
 *   get:
 *     summary: Obtener la lista de computadoras.
 *     description: Endpoint para obtener todas las computadoras de la base de datos.
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 marca: "Dell"
 *                 modelo: "Inspiron 15"
 *                 procesador: "Intel Core i5-1035G1"
 *                 ram_gb: 8
 *                 almacenamiento_gb: 512
 *                 tipo_almacenamiento: "SSD"
 *                 sistema_operativo: "Windows 10"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Error en la base de datos. Mensaje específico del error SQL."
 */
app.get("/computadoras", async (req, res) => {
    try {
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
 *     summary: Obtener una computadora por ID.
 *     description: Endpoint para obtener una computadora filtrada por su ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID de la computadora a buscar.
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               marca: "Dell"
 *               modelo: "Inspiron 15"
 *               procesador: "Intel Core i5-1035G1"
 *               ram_gb: 8
 *               almacenamiento_gb: 512
 *               tipo_almacenamiento: "SSD"
 *               sistema_operativo: "Windows 10"
 *       404:
 *         description: No encontrado. No se encontraron computadoras con el ID especificado.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Computadora no encontrada"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Error en la base de datos. Mensaje específico del error SQL."
 */
app.get("/computadoras/:id", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [rows, fields] = await conn.query('SELECT * FROM Computadoras WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            res.status(404).json({ mensaje: "Computadora no encontrada" });
        } else {
            res.json(rows[0]);
        }
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

/**
 * @swagger
 * /computadoras:
 *   post:
 *     summary: Insertar una nueva computadora.
 *     description: Endpoint para agregar una nueva computadora a la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             marca: "Acer"
 *             modelo: "Aspire 5"
 *             procesador: "Intel Core i3-1115G4"
 *             ram_gb: 4
 *             almacenamiento_gb: 256
 *             tipo_almacenamiento: "SSD"
 *             sistema_operativo: "Windows 11"
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               message: "Datos insertados correctamente de Acer Aspire 5"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               message: "Error al insertar datos. Mensaje específico del error SQL."
 */
app.post('/computadoras', async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo } = req.body;
        await conn.execute('INSERT INTO Computadoras (marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo) VALUES (?, ?, ?, ?, ?, ?, ?)', [marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo]);
        res.json({ message: 'Datos insertados correctamente de ' + marca + ' ' + modelo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al insertar datos' });
    }
});

/**
 * @swagger
 * /computadoras/{id}:
 *   put:
 *     summary: Actualizar información de una computadora.
 *     description: Endpoint para actualizar la información de una computadora en la base de datos.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID de la computadora a actualizar.
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             marca: "Acer"
 *             modelo: "Aspire 5"
 *             procesador: "Intel Core i3-1115G4"
 *             ram_gb: 4
 *             almacenamiento_gb: 256
 *             tipo_almacenamiento: "SSD"
 *             sistema_operativo: "Windows 11"
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "ACTUALIZADO Acer Aspire 5"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Error al actualizar datos. Mensaje específico del error SQL."
 */
app.put("/computadoras/:id", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo } = req.body;
        await conn.query('UPDATE Computadoras SET marca = ?, modelo = ?, procesador = ?, ram_gb = ?, almacenamiento_gb = ?, tipo_almacenamiento = ?, sistema_operativo = ? WHERE id = ?', [marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo, req.params.id]);
        res.json({ mensaje: "ACTUALIZADO " + marca + ' ' + modelo });
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

/**
 * @swagger
 * /computadoras/{id}:
 *   delete:
 *     summary: Eliminar una computadora.
 *     description: Endpoint para eliminar una computadora de la base de datos.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID de la computadora a eliminar.
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Registro Eliminado [ID de la computadora]"
 *       404:
 *         description: No encontrado. La computadora con el ID especificado no existe.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Registro No Eliminado"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Error al eliminar datos. Mensaje específico del error SQL."
 */
app.delete("/computadoras/:id", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [rows, fields] = await conn.query('DELETE FROM Computadoras WHERE id = ?', [req.params.id]);
        if (rows.affectedRows == 0) {
            res.json({ mensaje: "Registro No Eliminado" });
        } else {
            res.json({ mensaje: "Registro Eliminado " + req.params.id });
        }
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log("Servidor express escuchando en el puerto " + PORT);
});
