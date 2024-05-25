const express=require('express');
const morgan = require('morgan');
const fs=require('fs');
const path=require('path');
const mysql =require('mysql2/promise');
const bearerToken = require('express-bearer-token'); 
const app=express();
const cors = require('cors');
var accessLogStream = fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'});
const swaggerUI = require('swagger-ui-express');
const swaggerjsDoc= require('swagger-jsdoc');
app.use(morgan('combined',{stream:accessLogStream}));
app.use(cors());
app.use(express.json());
app.use(bearerToken());

const multer = require('multer');
const folder = path.join(__dirname+'/archivos/');
const storage = multer.diskStorage({
    destination : function(req,file,cb) {cb(null,folder)},
    filename: function (req,file,cb) {cb(null,file.originalname)}
});
const upload = multer({storage:storage})
app.use(express.urlencoded({extended:true}));
app.use(upload.single('archivo'));
const PORT = process.env.PORT || 8080
const PORTE = process.env.MYSQLPORT ;
const HOST = process.env.MYSQLHOST || 'localhost';
const USER = process.env.MYSQLUSER || 'root';
const PASSWORD = process.env.MYSQLPASSWORD || '';
const DATABASE = process.env.MYSQL_DATABASE || 'railway';
const URL = process.env.URL

const MySqlConnection = {host : HOST, user : USER, password : PASSWORD, database: DATABASE,port : PORTE}
const data = fs.readFileSync(path.join(__dirname,'./Options.json'),{ encoding: 'utf8', flag: 'r' });
const obj = JSON.parse(data)

const swaggerOptions = {
    definition: obj,
    apis: [`${path.join(__dirname,"./Index.js")}`],
}
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
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Computadora'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
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
 * /insertar-computadora:
 *   post:
 *     summary: Insertar una nueva computadora.
 *     description: Endpoint para agregar una nueva computadora a la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComputadoraInput'
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

app.post('/insertar-computadora', async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo } = req.body;
        const [rows, fields] = await conn.execute('INSERT INTO Computadoras (marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo) VALUES (?, ?, ?, ?, ?, ?, ?)', [marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo]);
        res.json({ message: 'Datos insertados correctamente para la computadora' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al insertar datos' });
    }
});

/**
 * @swagger
 * /actualizar-computadora/{id}:
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
 *           schema:
 *             $ref: '#/components/schemas/ComputadoraInput'
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 */

app.put("/actualizar-computadora/:id", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo } = req.body;
        await conn.query('UPDATE Computadoras SET marca = ?, modelo = ?, procesador = ?, ram_gb = ?, almacenamiento_gb = ?, tipo_almacenamiento = ?, sistema_operativo = ? WHERE id = ?', [marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo, req.params.id]);
        res.json({ mensaje: "Computadora actualizada correctamente" });
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

/**
 * @swagger
 * /eliminar-computadora/{id}:
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
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *       404:
 *         description: No encontrado. La computadora con el ID especificado no existe.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 */
app.delete("/eliminar-computadora/:id", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [rows, fields] = await conn.query('DELETE FROM Computadoras WHERE id = ?', [req.params.id]);
        if (rows.affectedRows == 0) {
            res.status(404).json({ mensaje: "No se encontró ninguna computadora para eliminar" });
        } else {
            res.json({ mensaje: "Computadora eliminada correctamente" });
        }
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

app.listen(PORT, () => {
    console.log("Servidor express escuchando en el puerto " + PORT);
});
