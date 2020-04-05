const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const session = require('express-session');

const bodyParser = require('body-parser');
const passport = require('passport');
const jwt = require('jsonwebtoken');
require('./passport')(passport);
const bcrypt = require('bcrypt');

const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'todo'
})

const cors = require('cors');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(session({
    secret: 'test',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors({ origin: 'http://localhost:3000' }));

app.post('/login', function (req, res, next) {

    passport.authenticate('local', {}, (err, user, info) => {

        if (err || !user) {
            return res.status(400).json({
                message: info ? info.message : 'Login failed',
                user: user
            });
        }

        req.login(user, {}, (err) => {
            if (err) {
                return res.status(400).json({
                    message: err ? err : 'Login failed',
                });
            }
            const newUserMysql = {
                id: user.id,
                name: user.name,
                email: user.email

            };

            const token = jwt.sign(newUserMysql, 'kBoaeMlNFqifswTPxVar6DEXzDTFsEd51SW6UzXP8AeE3D0aIufTBbxnLVIdNEy');

            return res.json({ user, token });
        });
    })
        (req, res);

});

app.post('/signup', function (req, res) {
    const { name, email, password } = req.body;
    let errors = [];

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {

        return res.status(500).json({
            message: errors ? errors : 'There are some errors',
        });

    } else {

        connection.query("SELECT * FROM users WHERE email = ?", [email], function (err, rows) {

            if (err) {

                return res.status(500).json({
                    message: err ? err : 'There are some errors',
                });

            } if (rows.length) {

                return res.status(500).json({
                    message: 'This email has laready been registered',
                });

            } else {

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        const insertQuery = "INSERT INTO users ( name, email, password ) values (?,?,?)";
                        connection.query(insertQuery, [name, email, hash], function (err, rowsa) {
                            if (err) {
                                return res.status(500).json({
                                    message: err ? err : 'There are some errors',
                                });
                            }
                        });
                        return res.send({ status: 200, text: 'Created' });

                    });
                });
            }
        });
    }

});

app.put('/user', passport.authenticate('jwt', {}), function (req, res) {

    user = req.user;
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) {
                return res.status(500).json({
                    message: err ? err : 'There are some errors',
                });
            }

            const sql = "UPDATE users SET name = ?, email = ?, password=? WHERE id = ?";
            connection.query(sql, [req.body.name, req.body.email, hash, user.id], function (err, rowsa) {
                if (err) {
                    return res.status(500).json({
                        message: err ? err : 'There are some errors',
                    });
                }

                return res.send(rowsa);
            });
        });
    });
});

app.get('/user', passport.authenticate('jwt', {}), function (req, res) {

    user = req.user;

    const sql = "SELECT * from users  WHERE id = ?";
    connection.query(sql, [user.id], function (err, rowsa) {

        if (err) {
            return res.status(500).json({
                message: err ? err : 'There are some errors',
            });
        }

        return res.send(rowsa);
    });

});

app.post('/task', passport.authenticate('jwt', {}), function (req, res) {

    user = req.user;
    const insertQuery = "INSERT INTO tasks ( title, isCompleted, date , userId ) values (?,?,?,?)";
    connection.query(insertQuery, [req.body.title, false, new Date().toJSON().slice(0, 10).replace(/-/g, '/'), user.id], function (err, rowsa) {
        if (err) {
            return res.status(500).json({
                message: err ? err : 'There are some errors',
            });
        }
        return res.send({ status: 200, text: 'Created' });

    });

});

app.delete('/task/:id', passport.authenticate('jwt', {}), function (req, res) {

    const sql = "DELETE FROM tasks WHERE id = ?";
    connection.query(sql, [req.params.id], function (err, rowsa) {

        if (err) {
            return res.status(500).json({
                message: err ? err : 'There are some errors',
            });
        }

        return res.send({ status: 200, text: 'Deleted' }
        );
    });
});

app.put('/task/:id', passport.authenticate('jwt', {}), function (req, res) {

    const sql = "UPDATE tasks SET title = ? WHERE id = ?";
    connection.query(sql, [req.body.title, req.params.id], function (err, rowsa) {
        if (err) {
            return res.status(500).json({
                message: err ? err : 'There are some errors',
            });
        }
        return res.send(rowsa);
    });

});

app.put('/taskstatus/:id', passport.authenticate('jwt', {}), function (req, res) {
    const sql = "UPDATE tasks SET isCompleted = ? WHERE id = ?";
    connection.query(sql, [req.body.status, req.params.id], function (err, rowsa) {
        if (err) {
            return res.status(500).json({
                message: err ? err : 'There are some errors',
            });
        }
        return res.send(rowsa);
    });

});

app.get('/tasks', passport.authenticate('jwt', {}), function (req, res) {
    user = req.user;

    const sql = "SELECT * from tasks  WHERE userid = ?";
    connection.query(sql, [user.id], function (err, rowsa) {

        if (err) {
            return res.status(500).json({
                message: err ? err : 'There are some errors',
            });
        }

        return res.send(rowsa);
    });
});


app.get('/logout', function (req, res) {
    req.logout();
});



app.listen(port);
console.log('Listening on port ' + port);
