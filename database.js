

const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root'
})
connection.query('CREATE DATABASE todo');

connection.query('\
CREATE TABLE todo.users ( \
    id INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    name VARCHAR(20) NOT NULL, \
    email VARCHAR(20) NOT NULL, \
    password CHAR(60) NOT NULL, \
        PRIMARY KEY (id), \
    UNIQUE INDEX id_UNIQUE (id ASC), \
    UNIQUE INDEX email_UNIQUE (email ASC) \
)');

connection.query('\
CREATE TABLE todo.tasks ( \
    id INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    title VARCHAR(20) NOT NULL, \
    isCompleted VARCHAR(5) NOT NULL, \
    date VARCHAR(20) NOT NULL, \
    userid INT UNSIGNED NOT NULL, \
        PRIMARY KEY (id), \
    UNIQUE INDEX id_UNIQUE (id ASC) \
)');

console.log('Success: Database Created!')

connection.end();