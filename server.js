
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.static('public')); 
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.post('/upload', upload.single('foto'), function(req, res) {
    // Devolver la ruta completa de la imagen subida
    res.send('/uploads/' + req.file.filename);
});

const db = new sqlite3.Database('chat.db');

db.run(`CREATE TABLE IF NOT EXISTS mensajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    mensaje TEXT,
    hora TEXT
)`);

io.on('connection', function(socket){
    console.log('Usuario conectado');

    socket.on('chat message', function(data){
        console.log('Mensaje de ' + data.nombre + ': ' + data.mensaje);

        db.run('INSERT INTO mensajes (nombre, mensaje, hora) VALUES (?, ?, ?)', [data.nombre, data.mensaje, data.hora], function(err) {
            if (err) {
                return console.error(err.message);
            }
            console.log(`Agregado mensaje de ${data.nombre} a la base de datos`);
        });

        io.emit('chat message', { mensaje: data.mensaje, nombre: data.nombre, hora: obtenerHora(), avatar: data.avatar });
    });

    socket.on('disconnect', function(){
        console.log('Usuario desconectado');
    });
});
function obtenerHora() {
    var ahora = new Date();
    var hora = ahora.getHours();
    var minutos = ahora.getMinutes();
    return hora + ':' + (minutos < 10 ? '0' : '') + minutos;
}

http.listen(3000, function(){
    console.log('Servidor escuchando en http://localhost:3000');
});
