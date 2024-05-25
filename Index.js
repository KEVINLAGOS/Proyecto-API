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
const PORT = process.env.PORT || 3001
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
 * tags:
 *   name: Computadoras
 *   description: Operaciones relacionadas con las computadoras
 */

/**
 * @swagger
 * /computadoras:
 *   get:
 *     summary: Obtener todas las computadoras
 *     tags: [Computadoras]
 *     responses:
 *       '200':
 *         description: Lista de computadoras obtenida correctamente
 *       '500':
 *         description: Error del servidor al obtener la lista de computadoras
 */

app.get("/computadoras", async(req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [rows, fields] = await conn.query('SELECT * FROM Computadoras');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.sqlMessage });
    }
});

/**
 * @swagger
 * /computadoras:
 *   post:
 *     summary: Agregar una nueva computadora
 *     tags: [Computadoras]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               procesador:
 *                 type: string
 *               ram_gb:
 *                 type: integer
 *               almacenamiento_gb:
 *                 type: integer
 *               tipo_almacenamiento:
 *                 type: string
 *                 enum: ['HDD', 'SSD']
 *               sistema_operativo:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Computadora agregada correctamente
 *       '500':
 *         description: Error del servidor al agregar la computadora
 */

app.post('/computadoras', async(req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo } = req.body;
        await conn.execute('INSERT INTO Computadoras (marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo) VALUES (?, ?, ?, ?, ?, ?, ?)', [marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo]);
        res.json({ message: 'Computadora agregada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al agregar la computadora' });
    }
});

/**
 * @swagger
 * /computadoras/{id}:
 *   put:
 *     summary: Actualizar una computadora existente
 *     tags: [Computadoras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la computadora a actualizar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               procesador:
 *                 type: string
 *               ram_gb:
 *                 type: integer
 *               almacenamiento_gb:
 *                 type: integer
 *               tipo_almacenamiento:
 *                 type: string
 *                 enum: ['HDD', 'SSD']
 *               sistema_operativo:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Computadora actualizada correctamente
 *       '404':
 *         description: Computadora no encontrada
 *       '500':
 *         description: Error del servidor al actualizar la computadora
 */

app.put("/computadoras/:id", async(req, res) => {
    const id = req.params.id;
    const { marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo } = req.body;

    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [result] = await conn.execute('UPDATE Computadoras SET marca = ?, modelo = ?, procesador = ?, ram_gb = ?, almacenamiento_gb = ?, tipo_almacenamiento = ?, sistema_operativo = ? WHERE id = ?', [marca, modelo, procesador, ram_gb, almacenamiento_gb, tipo_almacenamiento, sistema_operativo, id]);

        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Computadora no encontrada' });
            return;
        }

        res.json({ message: 'Computadora actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la computadora' });
    }
});

/**
 * @swagger
 * /computadoras/{id}:
 *   delete:
 *     summary: Eliminar una computadora existente
 *     tags: [Computadoras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la computadora a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Computadora eliminada correctamente
 *       '404':
 *         description: Computadora no encontrada
 *       '500':
 *         description: Error del servidor al eliminar la computadora
 */

app.delete("/computadoras/:id", async(req, res) => {
    const id = req.params.id;

    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [result] = await conn.execute('DELETE FROM Computadoras WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Computadora no encontrada' });
            return;
        }

        res.json({ message: 'Computadora eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la computadora' });
    }
});


const swaggerDocs = swaggerjsDoc(swaggerOptions);

app.use("/api-docs",swaggerUI.serve,swaggerUI.setup(swaggerDocs));
app.get("/options",(req,res)=>
{
    res.json(data)
})

app.use("/api-docs-json",(req,res)=>{
    res.json(swaggerDocs);
});



app.listen(PORT,()=>{
    console.log("Servidor express escuchando en el puerto "+PORT);
});