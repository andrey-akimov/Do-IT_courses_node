const express = require('express');
const app = express();
const path = require('path');

const fs = require('fs');
const _ = require('lodash');
const engines = require('consolidate');

const users = [];

fs.readFile('users.json', { encoding: 'utf8' }, (err, data) => {
    if (err) throw err;

    _.forEach(JSON.parse(data), user => users.push(user));
});

app.engine('hbs', engines.handlebars);

app.set('views', './views');
app.set('view engine', 'hbs');

app.get('/', (req, res) => res.render('index', { users }));
app.get('/favicon.ico', (req, res) => res.status(204));
app.get('/:username', (req, res) => {
    fs.readFile(`./users/${req.params.username}.json`, { encoding: 'utf8' }, (err, data) => {
        if (err) throw err;
        res.send(data);
    });
});

const server = app.listen(3000, () => {
    console.log(`Server running at http://localhost:${server.address().port}`);
});
