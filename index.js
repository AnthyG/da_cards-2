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
    loginlist = eval(fs.readFileSync(__dirname + '/PRIVATE/loginlist.js', 'UTF-8'));

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
            user_name: {
                'gid': gid || null,
                'wins': 0
            }
        }
        */
    },
    'o': [ /* user_name */ ],
    'g': {
        /*
        'RoomID': roomid,
        'Players': {
            0: {
                'User': {
                    'name': user_1_name,
                    'id': user_1_id
                },
                'roundsOFF': 0,
                'deck': {
                    'onHand': {},
                    'onField': {},
                    'inBlock': {}
                },
                'MP-Left': 20
            },
            1: {
                'User': {
                    'name': user_2_name,
                    'id': user_2_id
                },
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
        'currentPlayer': Players[Math.floor(Math.random() * 2)],
        'roundLength': roundLengthNormal,
        'timeRunning': 0,
        'roundNumber': 0
        */
    },
    'gids': [ /* gid */ ]
};

const states = ['lobby', 'searching', 'waiting', 'inGame', 'giveUp', 'results'];

io.on('connection', function(socket) {
    var addedUser = false;

    function sendErr(...m) {
        socket.emit('err', m);
    }

    function sendLog(...m) {
        socket.emit('log', m);
    }

    function sendUserlist(ul) {
        if (userlists.hasOwnProperty(ul))
            socket.emit('userlist', ul, userlists[ul]);
    }
    socket.on('getUserlist', sendUserlist);

    function sendUser(username) {
        var username = username || socket.username;
        socket.emit('user', username, userlists.eo[username]);
    }
    socket.on('getUser', sendUser);

    function sendState() {
        socket.emit('state', socket.state);
    }
    socket.on('getState', sendState);

    function joinGID(gid) {
        userlists.eo[socket.username].gid = gid;
        socket.join(gid);

        if (!userlists.g.hasOwnProperty(gid)) {
            var mydata = {
                id: socket.id,
                username: socket.username
            };
            socket.state = 'waiting';
            sendState();
            socket.broadcast.to(gid).emit('playerJoined', mydata);
        }
    }

    function startGame(odata) {
        const cgid = userlists.eo[socket.username].gid;
        const players = [socket.username, odata.username];

        userlists.g[cgid] = {
            'gid': cgid,
            'Players': {
                0: {
                    'User': {
                        'name': socket.username,
                        'id': socket.id
                    },
                    'roundsOFF': 0,
                    'deck': {
                        'onHand': {},
                        'onField': {},
                        'inBlock': {}
                    },
                    'MP-Left': 20
                },
                1: {
                    'User': {
                        'name': odata.username,
                        'id': odata.id
                    },
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
            'currentPlayer': players[Math.floor(Math.random() * 2)],
            'roundLength': roundLengthNormal,
            'timeRunning': 0,
            'roundNumber': 0
        };
        log('Starting Game with GID', cgid);
        // sendLog('Starting Game', userlists.g[cgid]);

        io.in(cgid).emit('gameStarted', userlists.g[cgid]);
    }
    socket.on('startGame', startGame);

    function gameStarted() {
        socket.state = 'inGame';
        sendState();
    }
    socket.on('gameStarted', gameStarted);

    function endGame(wincause) {
        const cgid = userlists.eo[socket.username].gid;
        const iAmNr = userlists.g[cgid].Players[0].User.name === socket.username ? 0 : 1;

        userlists.g[cgid].Winner = userlists.g[cgid].Players[(iAmNr === 0 ? 1 : 0)].User.name;
        userlists.g[cgid].WinCause = wincause;

        userlists.eo[userlists.g[cgid].Players[(iAmNr === 0 ? 1 : 0)].User.name].wins++;

        io.in(cgid).emit('gameEnded', userlists.g[cgid]);
    }
    socket.on('giveUp', function() {
        endGame('given up');
    });

    function gameEnded() {
        socket.state = 'results';
        sendState();
        userlists.eo[socket.username].gid = null;
    }
    socket.on('gameEnded', gameEnded);

    function leaveGID(gid) {
        userlists.eo[socket.username].gid = null;
        socket.leave(gid);
    }

    function switchState(switchTo) {
        if (states.indexOf(switchTo) !== -1) {
            const cgid = userlists.eo[socket.username].gid;
            if (cgid === null || ((socket.state === 'searching' || socket.state === 'waiting') && switchTo === 'lobby')) {
                socket.state = switchTo;
                if (switchTo === 'searching' && userlists.gids[0]) {
                    var jgid = userlists.gids.splice(0, 1)[0];
                    sendLog('Joining GID', jgid);
                    joinGID(jgid);
                } else if (switchTo === 'searching' && !userlists.gids[0]) {
                    var ngid = 'GID-' + (Math.floor((Math.random() * 1000000) + 1)).toString();
                    log('Created GID', ngid);
                    sendLog('Created GID', ngid);
                    userlists.gids.push(ngid);
                    joinGID(ngid);
                } else if (switchTo === 'lobby') {
                    sendLog('Stopping search');
                    leaveGID(cgid);
                }
            } else if (cgid !== null && switchTo === 'giveUp') {
                log(socket.username, 'gave up in', cgid);
                endGame('given up');
            } else if (cgid !== null) {
                sendLog('Already in game');
                socket.state = 'inGame';
                joinGID(cgid);
            }
        } else {
            sendErr('new state not valid!', switchTo, socket.state);
        }
        sendState();
    }
    socket.on('switchState', switchState);

    socket.on('logIn', function(data) {
        if (addedUser) return;

        log('logIn >> ', JSON.stringify(data));

        var err = [];

        if (!data.hasOwnProperty('username') || !data.username)
            err.push('username');
        if (!data.hasOwnProperty('password') || !data.password)
            err.push('password');

        var verifyLogIn = loginlist.filter(function(user, index) {
            // This should rather has to check the un-hashed user-hash with the given password
            return (user.name === data.username || user.email === data.username) && user.password_hash === data.password;
        });

        var username;

        if (verifyLogIn.length !== 1) {
            err.push('verify');
        } else {
            username = verifyLogIn[0].name;
        }

        if (err.length === 0 && username && userlists.o.indexOf(username) === -1) {
            addedUser = true;
            numUsers++;
            socket.username = username;

            socket.state = 'lobby';
            sendState();
            if (!userlists.eo.hasOwnProperty(username)) {
                userlists.eo[username] = {
                    'gid': null,
                    'wins': 0
                };
            } else if (userlists.eo[username].gid !== null) {
                joinGID(userlists.eo[username].gid);
            }

            userlists.o.push(username);
            log(username, 'logged in', userlists.eo[username].gid);
        }

        socket.emit('loginProcessed', err);
    });

    function logOut() {
        if (addedUser) {
            addedUser = false;
            numUsers--;
            userlists.o.splice(userlists.o.indexOf(socket.username), 1);
            if (socket.state !== 'inGame') {
                socket.state = 'lobby';
                sendState();
                userlists.eo[socket.username].gid = null;
            }
        }
    }
    socket.on('logOut', function() {
        logOut();
    });
    socket.on('disconnect', function() {
        logOut();
    });
});