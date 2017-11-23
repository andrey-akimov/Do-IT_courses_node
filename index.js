const express = require('express');
const app = express();
const path = require('path');

const sqlite3 = require('sqlite3').verbose();
const _ = require('lodash');
const engines = require('consolidate');
const bodyParser = require('body-parser');

app.engine('hbs', engines.handlebars);

app.set('views', './views');
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const db_file = process.env.DB || ':memory:';
const db = new sqlite3.Database(db_file);
let db_ready = false;

const sql_create_table =
    `CREATE TABLE if not exists Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255),
        age integer,
        address text,
        fruit VARCHAR(255)
    );`;

db.run(sql_create_table, () => db_ready = true);

app.use((req, res, next) => {
    if (db_ready) {
        req.db = db;

        return next();
    }

    res.status(500).send('Database not setup yet!');
});

app.get('/', (req, res) => {
    const query = 'SELECT * FROM users';

    db.all(query, (err, users = []) => res.render('index', {users}))
});

app.get('/:id', (req, res) => {
    const query = 'SELECT * FROM users WHERE id = ?';

    db.get(query, [req.params.id], (err, user) => {
        if (err) return res.status(404).send('User not found.');
        res.render('user', {user})
    });
});

app.put('/:id', (req, res) => {
    const {name, age, address, fruit} = req.body;
    const query = 'UPDATE Users SET name = ?, age = ?, address = ?, fruit = ? WHERE id = ?';

    db.run(query, [name, age, address, fruit, req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.sendStatus(200)
    });
});

const server = app.listen(3000, function() {
    console.log('Server running at http://localhost:' + server.address().port)
});
