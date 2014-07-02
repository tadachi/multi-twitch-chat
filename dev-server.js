var express         = require('express');
var bodyParser      = require('body-parser');
var methodOverride  = require('method-override');
var port            = parseInt(process.env.PORT, 10) || 4000;
var fs              = require('fs');
var path            = require('path');
var router          = express.Router();
var vhost           = require('vhost');
var app             = require('express.io')();
app.http().io();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded());

// parse application/json
app.use(bodyParser.json());

app.use(methodOverride());
app.listen(port);
app.enable('trust proxy');

var home = require('express.io')();

home.use('/js', express.static(__dirname + '/app/js'));
home.use('/css', express.static(__dirname + '/app/css'));
home.use('/img', express.static(__dirname + '/app/img'));

home.set('jsonp callback', true);
/* Testing headers */
home.use(function (req, res, next) {
    // Website you wish to allow to connect
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header("Access-Control-Allow-Headers", "X-Requested-With");

    // Request methods you wish to allow
    //res.setHeader('Access-Control-Allow-Methods', 'GET');

    // Pass to next layer of middleware
    next();
});

var hostname = 'mtc.tak.com';
app.use(vhost(hostname, home));

home.get('/', function(req, res) {
    //req.header('Access-Control-Allow-Origin', '*');
    res.sendfile(__dirname + '/app/index.html');

    req.io.route('home');
})

/* Outputs the users' ips visiting your website*/
app.io.route('home', function (req) {
    console.log(req.ip);
});

/* Debug */
console.log(__dirname);
console.log(__dirname + '/app/');
console.log('Listening on port: ' + port);
console.log('hostname: ' + hostname + ':' + port);
