let http = require('http');
let express = require('express');
let mongoClient = require("mongodb").MongoClient;
let ObjectId = require('mongodb').ObjectId;
let url = "mongodb://localhost:27017/books";
let bodyParser = require('body-parser');
let server = express();
let config = require('./config.json');
let i8n = require('./i18n');
let crypto = require('crypto');
let nodemailer = require("nodemailer");

server.set("view engine", "pug");
server.set('views', './');

server.use(express.static(__dirname));
server.use(bodyParser.urlencoded({extended: true}));


const PORT = 8888;


let db;

mongoClient.connect(url, (err, client) => {
    if (err) return console.log(err);
    db = client.db('books');

    server.listen(PORT);
    console.log('Server is running on port ' + PORT);
});


server.get('/', function (req, res) {
    const lang = req.query.lang ? req.query.lang : "uk",
        url_path = req.url.split('?')[0];
    res.render('./index.pug', {info: {config: config, url_path, lang: lang, i8n: i8n}});
});


server.get('/books', function (req, res) {
    const lang = req.query.lang ? req.query.lang : "uk",
        url_path = req.url.split('?')[0];
    db.collection('books').find().toArray((err, result) => {
        if (err) return console.log(err);
        res.render('./index.pug', {info: {config: config, url_path, lang: lang, i8n: i8n, books: result}});
    });

});
server.get('/about', function (req, res) {
    const lang = req.query.lang ? req.query.lang : "uk",
        url_path = req.url.split('?')[0];
    res.render('./index.pug', {info: {config: config, url_path, lang: lang, i8n: i8n}});
});

server.post('/register', function (req, res) {
    const lang = req.query.lang ? req.query.lang : "uk",
        url_path = req.url.split('?')[0];
    const date=new Date();
    const hash = crypto.createHmac('sha256', req.body.email+date.toISOString())
        .update('I love cupcakes')
        .digest('hex');
    const user = {hash, confirmed: "false", ...req.body};
    db.collection('users').insertOne(user).then(
        (result, err) => {
            send(user, lang).catch((err) => console.log(err));
            if (err) return console.log(err);
            console.log('saved to database');
            res.redirect('/');
        })
});

server.get('/confirm/:hash', function (req, res) {
    db.collection('users').updateOne({hash:req.params.hash}, {$set: { "confirmed":true},}).then(
        (result, err) => {
            if (err) return console.log(err);
            console.log(result);
            res.redirect('/');
        })

});


server.get('/applications', function (req, res) {
    db.collection('users').find().toArray((err, result) => {
        if (err) return console.log(err);
        res.render('./table.pug', {users: result})
    });

});

const send = async (user, lang) => {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        port: 587,
        secure: false,
        auth: {
            user: "bronksleon@gmail.com",
            pass: "lolkekazaza"
        }
    });
    await transporter.sendMail({
        from: 'bronksleon@gmail.com',
        to: user.email,
        subject: "Confirm email",
        text: i8n[lang].confirm + "\n" + "http://localhost:8888/confirm/" + user.hash
    });
};

