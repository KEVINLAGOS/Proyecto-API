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

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));
app.use(cors());
app.use(express.json());
app.use(bearerToken());
app.use(express.urlencoded({ extended: true }));

const folder = path.join(__dirname, '/archivos/');
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, folder); },
    filename: function (req, file, cb) { cb(null, file.originalname); }
});
const upload = multer({ storage: storage });
app.use(upload.single('archivo'));

const PORT = process.env.PORT || 3000;
const MYSQLPORT = process.env.MYSQLPORT;
const MYSQLHOST = process.env.MYSQLHOST || 'localhost';
const MYSQLUSER = process.env.MYSQLUSER || 'root';
const MYSQLPASSWORD = process.env.MYSQLPASSWORD || '';
const MYSQLDATABASE = process.env.MYSQL_DATABASE || 'railway';
const URL = process.env.URL;

const MySqlConnection = { host: MYSQLHOST, user: MYSQLUSER, password: MYSQLPASSWORD, database: MYSQLDATABASE, port: MYSQLPORT };
const data = fs.readFileSync(path.join(__dirname, './Options.json'), { encoding: 'utf8', flag: 'r' });
const obj = JSON.parse(data);

const swaggerOptions = {
    definition: obj,
    apis: [`${path.join(__dirname, "./index.js")}`],
}

const swaggerDocs = swaggerjsDoc(swaggerOptions);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
app.use("/api-docs-json", (req, res) => {
    res.json(swaggerDocs);
});
app.get("/options", (req, res) => {
    res.json(data);
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
*                 modelo: "XPS 13"
*                 procesador: "Intel Core i7"
*                 ram_gb: 16
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
        const [rows] = await conn.query('SELECT * from railway.Computadoras');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

/**
 * @swagger
 * /computadoras/{marca}:
 *   get:
 *     summary: Obtener computadoras por marca.
 *     description: Endpoint para obtener computadoras filtradas por su marca.
 *     parameters:
 *       - in: path
 *         name: marca
 *         description: Marca de la computadora a buscar.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 marca: "Dell"
 *                 modelo: "XPS 13"
 *                 procesador: "Intel Core i7"
 *                 ram_gb: 16
 *                 almacenamiento_gb: 512
 *                 tipo_almacenamiento: "SSD"
 *                 sistema_operativo: "Windows 10"
 *       404:
 *         description: No encontrado. No se encontraron computadoras con la marca especificada.
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
app.get("/computadoras/:marca", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [rows] = await conn.query('SELECT * FROM railway.Computadoras WHERE marca = ?', [req.params.marca]);

        if (rows.length === 0) {
            res.status(404).json({ mensaje: "Computadora no encontrada" });
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
 *     summary: Insertar una nueva computadora.
 *     description: Endpoint para agregar una nueva computadora a la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             marca: "HP"
 *             modelo: "Spectre x360"
 *             procesador: "Intel Core i7"
 *             ram_gb: 16
 *             almacenamiento_gb: 512
 *             tipo_almacenamiento: "SSD"
 *             sistema_operativo: "Windows 10"
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               message: "Datos insertados correctamente de HP Spectre x360"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               message: "Error al insertar datos. Mensaje específico del error SQL."
 */
app.post('/insertar', async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);

        const { marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo } = req.body;

        await conn.execute(
            'INSERT INTO railway.Computadoras (marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo]
        );

        res.json({ message: `Datos insertados correctamente de ${marca} ${modelo}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al insertar datos' });
    }
});

/**
 * @swagger
 * /computadora/{id}:
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
 *             marca: "HP"
 *             modelo: "Spectre x360"
 *             procesador: "Intel Core i7"
 *             ram_gb: 16
 *             almacenamiento_gb: 512
 *             tipo_almacenamiento: "SSD"
 *             sistema_operativo: "Windows 11"
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "ACTUALIZADO HP Spectre x360"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Error al actualizar datos. Mensaje específico del error SQL."
 */
app.put("/computadora/:id", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo } = req.body;
        await conn.query(
            'UPDATE  railway.Computadoras SET marca = ?, modelo = ?, procesador = ?, ram_gb = ?, almacenamiento_gb = ?, tipo_almacenamiento = ?, sistema_operativo = ? WHERE id = ?',
            [marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo, req.params.id]
        );
        res.json({ mensaje: `ACTUALIZADO ${marca} ${modelo}` });
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

/**
 * @swagger
 * /computadora/{id}:
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
 *               mensaje: "Registro Eliminado [id de la computadora]"
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
app.delete("/computadora/:id", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [rows] = await conn.query('DELETE FROM railway.Computadoras WHERE id = ?', [req.params.id]);

        if (rows.affectedRows === 0) {
            res.json({ mensaje: "Registro No Eliminado" });
        } else {
            res.json({ mensaje: `Registro Eliminado ${req.params.id}` });
        }
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor express escuchando en el puerto ${PORT}`);
});
