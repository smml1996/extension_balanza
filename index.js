// to generate executables run 'pkg .'
const http = require('http');
var express = require('express');
const { exec } = require("child_process");
const SerialPort = require('serialport');
var path = require('path');
const fs = require('fs');
const Readline = require('@serialport/parser-readline');

var app = express();

app.use(express.static(path.join(__dirname, '/static')));

const hostname = '127.0.0.1';
const port = 3000;
let current_port_name = '';
let baudios;

let set_variables = async () => {

    await fs.readFile(path.join(__dirname, 'config.json'), (err, data)=>{
        var config = JSON.parse(data);
        current_port_name = config.port;
        baudios = config.baudios;
    });
}

let write_variables = async () => {
    var json = `{
        "baudios": ${baudios},
        "port": "${current_port_name}"
    }`
    fs.writeFile('config.json', json, function(err, result) {
        if(err) console.log('error', err);
    });
}

let get_ports = async () => {
    var portsList = [];

    var ports_raw = await SerialPort.list();

    for (const port of ports_raw) {
        portsList.push(port.path);
    }

    return portsList;
};


app.get('/', function(req, res) {
    // viewed at http://localhost:8080
    res.sendFile(path.join(__dirname + '/index.html'));
});


app.get('/get-serial-ports', async function(req, res){
    res.setHeader('Content-Type', 'application/json');
    var ports = await get_ports();
    res.end(JSON.stringify({ 'ports': ports }));
});

app.get('/update-config', function(req, res){
    baudios = req.query.baudios;
    current_port_name = req.query.port;
    write_variables();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 'status': 'ok' }));
});

app.get('/get-config', function(req, res){
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 'baudios': baudios, 'port': current_port_name }));
});

app.get('/get-port-data', function(req, res){
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 'baudios': baudios, 'port': current_port_name }));
});

app.get('/read-data', function(req, res){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    function sendData(code, msg) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 'data': msg, 'code':code }));
    }

    var port = new SerialPort(current_port_name, {
        baudRate: baudios
    });

    port.on('open', function() {
        console.log("puerto abierto");
    });

    var buffer = '';
    port.on('data', function(chunk) {
        buffer += chunk;
        var answers = buffer.split(/\r?\n/);
        buffer = answers.pop(); 

        if (answer.length > 0) 
            sendData(200, answer);
    });

    port.on('error', function(err) {
        sendData(500, err.message)
        console.log(err.message);
    });
});

app.listen(port, async () => {

    await set_variables();   
    
    console.log(`Abre en tu navegador web la siguiente dirección: http://localhost:${port}`);

    if(process.platform == 'win32'){
        exec(`start http://localhost:${port}`);
    }else if(process.platform == 'darwin'){
        exec(`open http://localhost:${port}`);
    }else{
        exec(`xdg-open http://localhost:${port}`);
    }
    
});