'use strict';

var config = require('./config');

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var steamStrategy = require('passport-steam').Strategy;
var passport = require('passport');

const origin = 'http://127.0.0.1:' + config.webServer.port;
passport.use(new steamStrategy({
        returnURL: origin + '/login/steam/return',
        realm: origin,
        apiKey: config.steam.ApiKey,
    },
    function(identifier, profile, done) {
        var user = {
            identifier: identifier,
            // Extract the Steam ID from the Claimed ID ("identifier")
            steamId: identifier.match(/\d+$/)[0]
        };
        console.log(user);
        console.log(profile);
        return done(null, identifier);
    }
));

passport.serializeUser(function(user, done) {
    console.log('serializing: ' +  user);
    done(null, user);
});
passport.deserializeUser(function(id, done) {
    console.log('deserializing: ' +  id);
    done(null, id);
});


var app = express();

app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var session = require('express-session');
var redisStore = require('connect-redis')(session);
var redisClient = require('redis').createClient({
    host: config.redisDb.host,
    port: config.redisDb.port
});

app.use(session({
    secret: 'your secret',
    name: 'name of session id',
    store: new redisStore({
        client: redisClient,
        db: 11,
        logErrors: true
    }),
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


app.get('/', function(req, res) {
    res.send('index.html');
});

app.get('/login/steam', passport.authenticate('steam'), function(req, res) {
});

app.get('/login/steam/return', passport.authenticate('steam'), function(req, res) {
    // Successful authentication, redirect home. 
    console.log(req.user);
    res.redirect('/');
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.listen(config.webServer.port, function() {
    console.log('Server started on port ' + config.webServer.port)
});