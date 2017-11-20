const express = require('express');
const app = express();
const path = require('path');

const fs = require('fs');
const _ = require('lodash');
const engines = require('consolidate');
const bodyParser = require('body-parser');

let users = [];

function getUser(username) {
    let user = JSON.parse(fs.readFileSync(getUserFilePath(username), {encoding: 'utf8'}));
    user.nickname = user.name.toLowerCase().replace(/\s/ig, '');

    return user
}

function getUserFilePath(username) {
    return `${path.join(__dirname, 'users', username)}.json`
}

function saveUser(username, data) {
    let fp = getUserFilePath(username);
    fs.unlinkSync(fp); // delete the file
    console.log(data);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), {encoding: 'utf8'})
}

function verifyUser(req, res, next) {
    let fp = getUserFilePath(req.params.username);

    fs.exists(fp, yes => {
        if (yes) {
            next()
        } else {
            res.redirect('/error/' + req.params.username)
        }
    })
}

app.engine('hbs', engines.handlebars);

app.set('views', './views');
app.set('view engine', 'hbs');

app.use(express.static('public')); //example of serve static files
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json()); // Body parser use JSON data

app.get('/', (req, res) => {
    fs.readdir('users', (err, files) => {
        files = _.filter(files, file => !file.startsWith('.'));
        users = _.map(files, file => getUser(file.replace(/\.json/ig, '')));
        res.render('index', {users})
    });
});

app.get('*.json', (req, res) => res.download('./users/' + req.path));
app.get('/error/:username', (req, res) => res.status(404).send(`No user named ${req.params.username} found`));
app.get('/data/:username', (req, res) => {
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(getUser(req.params.username), null, 4));
});

app.all('/:username', function(req, res, next) {
    console.log(req.method, 'for', req.params.username);
    next()
});

app.get('/:username', verifyUser, function(req, res) {
    const user = getUser(req.params.username);
    res.render('user', {user, address: user.location})
});

app.put('/:username', function(req, res) {
    saveUser(req.params.username, req.body);
    res.end()
});

app.delete('/:username', function(req, res) {
    fs.unlinkSync(getUserFilePath(req.params.username)); // delete the file
    res.sendStatus(200)
});

const server = app.listen(3000, function() {
    console.log('Server running at http://localhost:' + server.address().port)
});
