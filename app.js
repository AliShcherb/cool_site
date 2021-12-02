let express = require('express');
let mongoClient = require("mongodb").MongoClient;
let url = "mongodb+srv://admin:admin@cluster0.mnitq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
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


const PORT = 5000;


let db;

mongoClient.connect(url, (err, client) => {
    if (err) return console.log(err);
    db = client.db('cool');

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

server.post('/addbook', (req, res) => {
    db.collection('books').insertOne(req.body).then(
        (result, err) => {
            if (err) return console.log(err);
            res.redirect('/add');
            
        })
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
server.get('/add', function (req, res) {
        res.render('./add.pug')
});
const send = async (user, lang) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: 'sushko.liza10@gmail.com',
            pass: 'alina_17112001'
        }
    });
    await transporter.sendMail({
        from: 'sushko.liza10@gmail.com',
        to: user.email,
        subject: "Confirm email",
        text: i8n[lang].confirm + "\n" + "http://localhost:5000/confirm/" + user.hash
    });
};

