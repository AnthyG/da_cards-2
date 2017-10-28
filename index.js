'use strict';

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000; // In Windows 'set PORT=3000&&node index.js'; In Linux 'PORT=3000 node index.js'
var fs = require('fs');

var log = function log(...m) {
    console.log('\n' + Date().toString() + ':\n', m);
};

server.listen(port, function() {
    log('Server listening on port ' + port);
});

var dir = __dirname + '/build/';
app.use(express.static(dir));
app.get(/^(.+)$/, function(req, res) {
    res.sendFile(dir + 'index.html');
});

var loginlist = [];

function getLoginList(cb) {
    loginlist = eval(fs.readFileSync('loginlist.js', 'UTF-8'));

    typeof cb === 'function' && cb();
}
getLoginList();
setInterval(getLoginList, 10000);

// (min * 60secs)-1sec = secs
var roundLengthNormal = (1 * 10) - 1; // 1min (60secs)
var roundLengthExtended = (60 * 60) - 1; // 60mins (3600secs)

var numUsers = 0;
var userlists = {
    'eo': {
        /*
        {
            username: gid || null
        }
        */
    },
    'o': [ /* username */ ],
    'g': {
        /*
        'RoomID': roomid,
        'Players': {
            0: {
                'Player': username_1,
                'roundsOFF': 0,
                'deck': {
                    'onHand': {},
                    'onField': {},
                    'inBlock': {}
                },
                'MP-Left': 20
            },
            1: {
                'Player': username_2,
                'roundsOFF': 0,
                'deck': {
                    'onHand': {},
                    'onField': {},
                    'inBlock': {}
                },
                'MP-Left': 20
            }
        },
        'Creationdate': Date().toString(),
        'Winner': null,
        'WinCause': null,
        'currentPlayer': Players[Math.floor(Math.random() * 2],
        'roundLength': roundLengthNormal,
        'timeRunning': 0,
        'roundNumber': 0
        */
    },
    'gids': [ /* gid */ ]
};

const states = ['lobby', 'searching', 'inGame'];

io.on('connection', function(socket) {
    var addedUser = false;

    function sendErr(...err) {
        socket.emit('error', err);
    }

    function sendState() {
        socket.emit('stateChanged', socket.state);
    }
    socket.on('getState', sendState);

    socket.on('toggleMatchSearch', function(toggleTo) {
        if (socket.state !== 'inGame' && states.indexOf(toggleTo) !== -1) {
            socket.state = toggleTo;
            sendState();
        } else {
            sendErr('new state not valid or in game!', toggleTo);
        }
    });

    socket.on('logIn', function(data) {
        if (addedUser) return;

        log('logIn >> ', JSON.stringify(data));

        var err = [];

        if (!data.hasOwnProperty('username') || !data.username)
            err.push('username');
        if (!data.hasOwnProperty('password') || !data.password)
            err.push('password');

        var verifyLogIn = loginlist.filter(function(user, index) {
            return (user.name === data.username || user.email === data.username) && user.password_hash === data.password;
        });
        if (verifyLogIn.length !== 1) {
            err.push('verify');
        }

        if (err.length === 0) {
            addedUser = true;
            numUsers++;
        }

        socket.emit('loginProcessed', err);
    });

    function logOut() {
        if (addedUser) {
            addedUser = false;
            numUsers--;
        }
    }
    socket.on('logOut', function() {
        logOut();
    });
    socket.on('disconnect', function() {
        logOut();
    });
});