var mysql = require('mysql');
var LocalStrategy = require('passport-local').Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
var bcrypt = require('bcrypt');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'todo'
})

module.exports = function (passport) {

    passport.use('jwt', new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: 'kBoaeMlNFqifswTPxVar6DEXzDTFsEd51SW6UzXP8AeE3D0aIufTBbxnLVIdNEy'
    },
        function (jwtPayload, cb) {


            return connection.query("SELECT * FROM users WHERE id = ? ", [jwtPayload.id], function (err, rows) {

                if (err) return cb(null, err)

                return cb(null, rows[0]);
            })


        }
    ));


    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        connection.query("SELECT * FROM users WHERE id = ? ", [id], function (err, rows) {
            done(err, rows[0]);
        });
    });

    passport.use(
        'local',
        new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
            function (req, email, password, done) {
                connection.query("SELECT * FROM users WHERE email = ?", [email], function (err, rows) {
                    if (err)
                        return done(err);
                    if (!rows.length) {
                        return done(null, false, req.flash('loginMessage', 'No user found.'));
                    }

                    if (!bcrypt.compareSync(password, rows[0].password))
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

                    return done(null, rows[0]);
                });
            })
    );
};
