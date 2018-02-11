'use strict';

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fs = require('fs');

var port = process.env.PORT || 3000; // In Windows 'set PORT=3000&&node index.js'; In Linux 'PORT=3000 node index.js'
var privatePath = process.env.PRIVATEPATH || 'PRIVATE';

/* MODIFIED FROM https://stackoverflow.com/a/1985471/5712160 */
var arrRotate = function arrRotate(arr, count) {
    var unshift = Array.prototype.unshift,
        splice = Array.prototype.splice;

    var len = arr.length >>> 0,
        count = count >> 0;

    unshift.apply(arr, splice.call(arr, count % len, len));
    return arr;
}

var log = function log(...m) {
    console.log('\n' + Date().toString() + ':\n', m);
};

var loginlist = [];

function getLoginList(cb) {
    loginlist = eval(fs.readFileSync(__dirname + '/' + privatePath + '/loginlist.js', 'UTF-8'));

    typeof cb === 'function' && cb();
}
getLoginList();
setInterval(getLoginList, 10000);

var CardArr = [];

function getCards(cb) {
    const l1 = ('let CardArr = ').length;
    const l2 = (';  export default CardArr;').length;
    const rCardArr = fs.readFileSync(__dirname + '/CardArr.js', 'UTF-8');
    eval('CardArr = ' + rCardArr.substr(l1, rCardArr.length - l2 - l1));

    typeof cb === 'function' && cb();
}
getCards();
setInterval(getCards, 10000);

var CardEffectsArr = [];

function getCardEffects(cb) {
    const l1 = ('let CardEffectsArr = ').length;
    const l2 = (';  export default CardEffectsArr;').length;
    const rCardEffectsArr = fs.readFileSync(__dirname + '/CardEffectsArr.js', 'UTF-8');
    eval('CardEffectsArr = ' + rCardEffectsArr.substr(l1, rCardEffectsArr.length - l2 - l1));

    typeof cb === 'function' && cb();
}
getCardEffects();
setInterval(getCardEffects, 10000);

server.listen(port, function() {
    log('Server listening on port ' + port);
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/cards', function(req, res) {
    log('Serving all cards');
    res.json(CardArr);
});

function cardTypeRes(req, res) {
    const type = req.params.type;
    const exists = CardArr.hasOwnProperty(type);
    log('Serving card ', type, exists);
    if (exists)
        res.json(CardArr[type]);
    else
        res.status(404).json({
            "type": "",
            "animations": {
                "face": {
                    "x_px": 0,
                    "y_px": 0,
                    "frameNr": 0
                },
                "bg": {
                    "x_px": 0,
                    "y_px": 0,
                    "frameNr": 0
                }
            },
            "description": "",
            "cid": null,
            "alreadyUsed": false,
            "roundsLeft": 0,
            "marked": false,
            "MPS": 0,
            "HP": 0,
            "AP": 0,
            "AT": "",
            "effects": {}
        });
}
app.get('/card/:type', cardTypeRes);

app.get('/cardeffects', function(req, res) {
    log('Serving all cardeffects');
    res.json(CardEffectsArr);
});

function cardEffectRes(req, res) {
    const type = req.params.type;
    const exists = CardEffectsArr.hasOwnProperty(type);
    log('Serving cardeffect ', type, exists);
    if (exists)
        res.json(CardEffectsArr[type]);
    else
        res.status(400).json({
            "description": "",
            "roundsLeft": 0
        });
}
app.get('/cardeffect/:type', cardEffectRes);

var dir = __dirname + '/build/';
app.use(express.static(dir));
app.get(/^(.+)$/, function(req, res) {
    res.sendFile(dir + 'index.html');
});

// (min * 60secs)-1sec = secs (-1sec because it starts at 0, not 1, (just a shift -1sec))
var roundLengthNormal = (1 * 30) - 1; // 1min (60secs)
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
    'g': {},
    'gids': [ /* gid */ ]
};

const states = ['lobby', 'searching', 'waiting', 'inGame', 'giveUp', 'results'];

io.on('connection', function(socket) {
    var addedUser = false;

    function sendErr(...m) {
        if (!addedUser) return;

        socket.emit('err', m);
    }

    function sendLog(...m) {
        if (!addedUser) return;

        socket.emit('log', m);
    }

    function sendUserlist(ul) {
        if (!addedUser) return;

        // **THIS IS ONLY FOR DEVELOPMENT!!!*
        // THIS SHOULD BE SOMEWHAT FILTERING THE OUTPUT
        // FOR EXAMPLE, .g SHOULDN'T CONTAIN ANY OTHER USER's .onHand
        // OR IN GENERAL THE .inBlock, BUT FOR BOTH JUST THE NUMBER OF CARDS IN THERE
        // ...... ok.
        // just disable transmission of userlists.g, because there is sendGame(gid)
        if (userlists.hasOwnProperty(ul)) {
            socket.emit('userlist', ul, userlists[ul]);
        }
    }
    socket.on('getUserlist', sendUserlist);

    function sendGame(alsoToEnemy, gid) {
        if (!addedUser && !isInGame()) return;
        if (!isInGame()) return;

        const sendToEnemy = alsoToEnemy || false;
        const cgid = gid || userlists.eo[socket.username].gid;

        if (cgid !== null) {
            var g = JSON.parse(JSON.stringify(userlists.g[cgid]));
            const iAmNr = userlists.g[cgid].Players[0].User.name === socket.username ? 0 : (userlists.g[cgid].Players[1].User.name === socket.username ? 1 : false);
            const eIsNr = iAmNr === 0 ? 1 : (iAmNr === 1 ? 0 : false);

            const otherMeId = userlists.g[cgid].Players[iAmNr].User.id;
            const enemyId = userlists.g[cgid].Players[eIsNr].User.id;

            // log('sendGame >>', socket.username, socket.id, otherMeId, enemyId, cgid, sendToEnemy, iAmNr, eIsNr);
            // sendLog('sendGame >>', socket.username, socket.id, enemyId, cgid, sendToEnemy, iAmNr, eIsNr);

            if (iAmNr === 0 || iAmNr === 1) {
                g.Players[iAmNr].deck.inBlock = Object.keys(g.Players[iAmNr].deck.inBlock).length;
                g.Players[eIsNr].deck.onHand = Object.keys(g.Players[eIsNr].deck.onHand).length;
                g.Players[eIsNr].deck.inBlock = Object.keys(g.Players[eIsNr].deck.inBlock).length;

                if (socket.id !== otherMeId) {
                    socket.broadcast.to(otherMeId).emit('game', g);
                } else {
                    socket.emit('game', g);
                }

                if (sendToEnemy) {
                    var g2 = JSON.parse(JSON.stringify(userlists.g[cgid]));

                    g2.Players[eIsNr].deck.inBlock = Object.keys(g2.Players[eIsNr].deck.inBlock).length;
                    g2.Players[iAmNr].deck.onHand = Object.keys(g2.Players[iAmNr].deck.onHand).length;
                    g2.Players[iAmNr].deck.inBlock = Object.keys(g2.Players[iAmNr].deck.inBlock).length;

                    socket.broadcast.to(enemyId).emit('game', g2);
                }
            } else {
                g.Players[0].deck.onHand = Object.keys(g.Players[0].deck.onHand).length;
                g.Players[0].deck.inBlock = Object.keys(g.Players[0].deck.inBlock).length;
                g.Players[1].deck.onHand = Object.keys(g.Players[1].deck.onHand).length;
                g.Players[1].deck.inBlock = Object.keys(g.Players[1].deck.inBlock).length;

                socket.emit('game', g);
            }
        }
    }
    socket.on('getGame', function() {
        sendGame();
    });

    function sendUser(username) {
        if (!addedUser) return;

        var username = username || socket.username;
        socket.emit('user', username, userlists.eo[username]);
    }
    socket.on('getUser', sendUser);

    function sendState() {
        if (!addedUser) return;

        socket.emit('state', socket.state);
    }
    socket.on('getState', sendState);

    function joinGID(gid) {
        if (!addedUser) return;

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
        } else if (userlists.g.hasOwnProperty(gid)) {
            if (userlists.g[gid].Winner !== null && userlists.g[gid].WinCause !== null) {
                io.in(gid).emit('gameEnded', userlists.g[gid]);
            } else {
                sendLog('rejoining >>', gid);
                const iAmNr = userlists.g[gid].Players[0].User.name === socket.username ? 0 : 1;

                userlists.g[gid].Players[iAmNr].User.id = socket.id;

                socket.state = 'inGame';
                sendState();
            }
        }
    }

    function startGame(odata) {
        if (!addedUser) return;

        const cgid = userlists.eo[socket.username].gid;
        const players = [socket.username, odata.username];

        log('Starting Game with GID', cgid);

        userlists.g[cgid] = {
            'gid': cgid,
            'Players': {
                0: {
                    'User': {
                        'name': socket.username,
                        'id': socket.id
                    },
                    'roundsOff': 0,
                    'deck': {
                        'onHand': [],
                        'onField': [],
                        'inBlock': []
                    },
                    'MP': 20,
                    'HP': 3
                },
                1: {
                    'User': {
                        'name': odata.username,
                        'id': odata.id
                    },
                    'roundsOff': 0,
                    'deck': {
                        'onHand': [],
                        'onField': [],
                        'inBlock': []
                    },
                    'MP': 20,
                    'HP': 3
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

        function generatedeckthingieandreturn(number, mode, empty) {
            var mode = mode || false;
            var empty = empty || false;

            var arr;
            arr = [];
            var fncs;
            fncs = [];
            var ARRAYTHINGIEd = [];

            function gRC() {
                return CardArr[Object.keys(CardArr)[Math.floor(Math.random() * Object.keys(CardArr).length)]]; // WORKS FOR OBJECT's
                // return CardArr[Math.floor(Math.random() * CardArr.length)]; // WORKS FOR ARRAY's
            }

            for (var a = 0; a < number; a++) {
                fncs[a] = function(b, modeP, emptyP) {
                    return function() {
                        if (emptyP !== true) {
                            arr[b] = gRC();
                            arr[b].cid = "cid-" + (Math.floor((Math.random() * 90000) + 10000)).toString();
                            if (modeP === true) {
                                arr[b].position = b;
                            }
                            delete arr[b].animations;
                            delete arr[b].frameNr;
                            delete arr[b].description;
                            delete arr[b].MPS;
                            delete arr[b].AP;
                            delete arr[b].AT;
                        } else if (emptyP === true) {
                            arr[b] = null;
                        }
                        return JSON.stringify(arr[b]);
                    }
                };
                ARRAYTHINGIEd[a] = (JSON.parse(fncs[a](a, mode, empty)()));
            }
            return ARRAYTHINGIEd;
        }

        // This part is kinda unfair, except the onField of course
        // Because it means, that both players can or rather, most probably will,
        // get a different number of the same card.!
        for (var xa = 0; xa < 2; xa++) {
            userlists.g[cgid].Players[xa].deck.onHand = generatedeckthingieandreturn(5);
            userlists.g[cgid].Players[xa].deck.onField = generatedeckthingieandreturn(13, false, true);
            userlists.g[cgid].Players[xa].deck.inBlock = generatedeckthingieandreturn(50);
        }

        // DON'T FORGET TO FILTER OUT THE OTHER USER's .onHand AND FOR BOTH THE .inBlock!
        var g = JSON.parse(JSON.stringify(userlists.g[cgid]));
        const iAmNr = userlists.g[cgid].Players[0].User.name === socket.username ? 0 : 1;

        g.Players[iAmNr].deck.inBlock = Object.keys(g.Players[iAmNr].deck.inBlock).length;
        g.Players[(iAmNr === 0 ? 1 : 0)].deck.onHand = Object.keys(g.Players[(iAmNr === 0 ? 1 : 0)].deck.onHand).length;
        g.Players[(iAmNr === 0 ? 1 : 0)].deck.inBlock = Object.keys(g.Players[(iAmNr === 0 ? 1 : 0)].deck.inBlock).length;

        io.in(cgid).emit('gameStarted', g);
    }
    socket.on('startGame', startGame);

    function gameStarted() {
        if (!addedUser) return;

        socket.state = 'inGame';
        sendState();

        const cgid = userlists.eo[socket.username].gid;

        if (userlists.g[cgid].Players[0].User.name === socket.username) {
            gameLoop();
        }
    }
    socket.on('gameStarted', gameStarted);

    function viewGame(gid) {
        if (!addedUser && !isInGame()) return;

        sendGame(false, gid);
    }
    socket.on('viewGame', viewGame);

    function gameLoop() {
        // log('gameLoop >>', socket.username, socket.id, addedUser, isInGame());
        if (!addedUser && !isInGame()) return;
        if (!isInGame()) return;

        const cgid = userlists.eo[socket.username].gid;
        if (cgid !== null) {
            const iAmNr = userlists.g[cgid].Players[0].User.name === socket.username ? 0 : 1;

            if (userlists.g[cgid].timeRunning < userlists.g[cgid].roundLength) {
                userlists.g[cgid].timeRunning++;
            } else if (userlists.g[cgid].timeRunning >= userlists.g[cgid].roundLength) {
                nextRound();
            }

            if (userlists.g[cgid].Winner === null && userlists.g[cgid].WinCause === null) {
                setTimeout(function() {
                    gameLoop();
                }, 1000);
            }
        }
    }

    function nextRound() {
        // log('nextRound >>', socket.username, socket.id, addedUser, isInGame());
        if (!addedUser && !isInGame()) return;
        if (!isInGame()) return;

        const cgid = userlists.eo[socket.username].gid;
        const iAmNr = userlists.g[cgid].Players[0].User.name === socket.username ? 0 : 1;

        if (socket.username === userlists.g[cgid].currentPlayer || userlists.g[cgid].timeRunning >= userlists.g[cgid].roundLength) {
            userlists.g[cgid].timeRunning = 0;
            userlists.g[cgid].roundNumber++;

            const lastPlayerNr = userlists.g[cgid].currentPlayer === userlists.g[cgid].Players[0].User.name ? 0 : 1;
            userlists.g[cgid].currentPlayer = userlists.g[cgid].Players[lastPlayerNr === 0 ? 1 : 0].User.name;

            for (let px = 0; px < 2; px++) {
                var markAtCx = -1;
                var markAtCxWHP = -1;
                for (let cx in userlists.g[cgid].Players[px].deck.onField) {
                    if (userlists.g[cgid].Players[px].deck.onField[cx] !== null) {
                        // Check if the card has an effect, which disables it's ability to be used,
                        // and set alreadyUsed accordingly
                        userlists.g[cgid].Players[px].deck.onField[cx].alreadyUsed = false;
                        userlists.g[cgid].Players[px].deck.onField[cx].marked = false;

                        if (userlists.g[cgid].Players[px].deck.onField[cx].roundsLeft >= 1) {
                            userlists.g[cgid].Players[px].deck.onField[cx].roundsLeft--;

                            if (userlists.g[cgid].Players[px].deck.onField[cx].HP > markAtCxWHP) {
                                markAtCxWHP = userlists.g[cgid].Players[px].deck.onField[cx].HP;
                                markAtCx = cx;
                            }
                        } else {
                            // Check if the card has an effect, that get's called on-death, and execute it,
                            // Afterwards, delete the card
                            userlists.g[cgid].Players[px].deck.onField[cx] = null;
                        }
                    }
                }

                // Mark card with highest HP, if there are any cards
                if (markAtCx > -1)
                    userlists.g[cgid].Players[px].deck.onField[markAtCx].marked = true;

                // Serve new card from block into hand,
                // if lastPlayerNr is this px,
                // if the maximum of 15 cards in onHand hasn't been reached yet,
                // and if any cards are left in inBlock
                if (lastPlayerNr !== px &&
                    Object.keys(userlists.g[cgid].Players[px].deck.onHand).length < 15 &&
                    Object.keys(userlists.g[cgid].Players[px].deck.inBlock).length > 0) {
                    // Set MP back to 20
                    userlists.g[cgid].Players[px].MP = 20;

                    // Rotate onField
                    arrRotate(userlists.g[cgid].Players[px].deck.onField, 1);

                    const scard = JSON.parse(JSON.stringify(userlists.g[cgid].Players[px].deck.inBlock[Object.keys(userlists.g[cgid].Players[px].deck.inBlock)[0]]));
                    // Put card from inBlock into onHand
                    userlists.g[cgid].Players[px].deck.onHand[Object.keys(userlists.g[cgid].Players[px].deck.onHand).length] = scard;

                    // Remove card from inBlock
                    delete userlists.g[cgid].Players[px].deck.inBlock[Object.keys(userlists.g[cgid].Players[px].deck.inBlock)[0]];
                }
            }

            sendGame(true);

            if (userlists.o.indexOf(userlists.g[cgid].currentPlayer) === -1 && userlists.g[cgid].Players[lastPlayerNr].roundsOff < 3) {
                userlists.g[cgid].Players[lastPlayerNr].roundsOff++;
            } else if (userlists.o.indexOf(userlists.g[cgid].currentPlayer) === -1 && userlists.g[cgid].Players[lastPlayerNr].roundsOff === 3) {
                endGame('afk');
            }
        }
    }
    socket.on('nextRound', nextRound);

    function moveCard(c1toc2) {
        if (!addedUser) return;

        const cgid = userlists.eo[socket.username].gid;
        const iAmNr = userlists.g[cgid].Players[0].User.name === socket.username ? 0 : 1;

        // log('moveCard >>', c1toc2);

        var mverr = false;
        if (!c1toc2.hasOwnProperty('c1') || !c1toc2.hasOwnProperty('c2')) {
            sendLog('moveCard >> failed because one/ both card\'s are missing!');
            mverr = true;
        }
        if (mverr) {
            sendGame();
            return false;
        }

        const C1 = c1toc2.c1,
            C2 = c1toc2.c2;

        const sdttosdt = (((C1.side === "enemy" ? "e" : "o") + (C1.dt === "onHand" ? "h" : (C1.dt === "onField" ? "f" : ""))) +
            '-' +
            ((C2.side === "enemy" ? "e" : "o") + (C2.dt === "onHand" ? "h" : (C2.dt === "onField" ? "f" : "")))
        );
        // log('moveCard 2 >>', C1, C2, sdttosdt);

        var sendToEnemy = false;
        if (socket.username === userlists.g[cgid].currentPlayer || sdttosdt === "oh-oh") {
            if (sdttosdt === "oh-oh") {
                var oldc1 = userlists.g[cgid].Players[iAmNr].deck[C1.dt][C1.position];

                userlists.g[cgid].Players[iAmNr].deck[C1.dt][C1.position] = userlists.g[cgid].Players[iAmNr].deck[C2.dt][C2.position];
                userlists.g[cgid].Players[iAmNr].deck[C2.dt][C2.position] = oldc1;
            } else if (sdttosdt === "oh-of") {
                // Check if the player has enough MP to summon the card,
                // if that field is available for summon's,
                // and if there already is a card on that field
                if (userlists.g[cgid].Players[iAmNr].MP >= CardArr[userlists.g[cgid].Players[iAmNr].deck[C1.dt][C1.position].type].MPS) {
                    // Check, if the card is even able to get summoned on this field

                    if (userlists.g[cgid].Players[iAmNr].deck[C2.dt][C2.position]) { // If there is a card..
                        // Direct-actions/-effects will be applied here!
                        sendToEnemy = true;
                    } else { // If there is no card..
                        // Put the card from onHand to onField, and take appropiate mana from the player
                        userlists.g[cgid].Players[iAmNr].deck[C2.dt][C2.position] = userlists.g[cgid].Players[iAmNr].deck[C1.dt][C1.position];

                        // If the card hasn't got the instant-use effect
                        if (!userlists.g[cgid].Players[iAmNr].deck[C2.dt][C2.position].effects.hasOwnProperty('instant-use'))
                            userlists.g[cgid].Players[iAmNr].deck[C2.dt][C2.position].alreadyUsed = true;

                        userlists.g[cgid].Players[iAmNr].deck[C1.dt].splice(C1.position, 1);

                        userlists.g[cgid].Players[iAmNr].MP -= CardArr[userlists.g[cgid].Players[iAmNr].deck[C2.dt][C2.position].type].MPS;

                        sendToEnemy = true;
                    }
                }
            } else if (sdttosdt === "of-ef") {
                // Check if the card hasn't already been used,
                // and if there are cards on the enemies field, which can prevent this action from happening
                // Depending on that, apply damage/effects etc, set the card's alreadyUsed = true, and what not
                // ?Maybe also a MP (not MPS), which requires the player to have enough mana, to use this card!?
                if (!userlists.g[cgid].Players[iAmNr].deck[C1.dt][C1.position].alreadyUsed &&
                    userlists.g[cgid].Players[(iAmNr === 0 ? 1 : 0)].deck[C2.dt].hasOwnProperty(C2.position) &&
                    userlists.g[cgid].Players[(iAmNr === 0 ? 1 : 0)].deck[C2.dt][C2.position] !== null) {

                    userlists.g[cgid].Players[iAmNr].deck[C1.dt][C1.position].alreadyUsed = true;

                    var c1_HP = userlists.g[cgid].Players[iAmNr].deck[C1.dt][C1.position].HP;
                    var c2_HP = userlists.g[cgid].Players[(iAmNr === 0 ? 1 : 0)].deck[C2.dt][C2.position].HP;
                    var c1_AP = CardArr[userlists.g[cgid].Players[iAmNr].deck[C1.dt][C1.position].type].AP;
                    var c2_AP = CardArr[userlists.g[cgid].Players[(iAmNr === 0 ? 1 : 0)].deck[C2.dt][C2.position].type].AP;

                    for (let attacks = 0; attacks < c1_AP; attacks++) {
                        if (c2_HP > 0) {
                            c2_HP--;
                        } else {
                            break;
                        }
                    }
                    if (c2_HP > 0) {
                        userlists.g[cgid].Players[(iAmNr === 0 ? 1 : 0)].deck[C2.dt][C2.position].HP = c2_HP;
                        for (let attacks = 0; attacks < c2_AP; attacks++) {
                            if (c1_HP > 0) {
                                c1_HP--;
                            } else {
                                break;
                            }
                        }
                        if (c1_HP > 0) {
                            userlists.g[cgid].Players[iAmNr].deck[C1.dt][C1.position].HP = c1_HP;
                        } else if (c1_HP === 0) {
                            if (userlists.g[cgid].Players[iAmNr].deck[C1.dt][C1.position].marked) {
                                userlists.g[cgid].Players[iAmNr].HP--;
                                sendLog('You lost 1 HP!');

                                if (userlists.g[cgid].Players[iAmNr].HP <= 0) {
                                    endGame('death');
                                }
                            }

                            userlists.g[cgid].Players[iAmNr].deck[C1.dt][C1.position] = null;
                            sendLog('Your enemy destroyed', C1, 'with', C2);
                        }
                    } else if (c2_HP === 0) {
                        if (userlists.g[cgid].Players[(iAmNr === 0 ? 1 : 0)].deck[C2.dt][C2.position].marked) {
                            userlists.g[cgid].Players[(iAmNr === 0 ? 1 : 0)].HP--;
                            sendLog('You took 1 HP from your enemy!');

                            if (userlists.g[cgid].Players[(iAmNr === 0 ? 1 : 0)].HP <= 0) {
                                endGame('death', iAmNr);
                            }
                        }

                        userlists.g[cgid].Players[(iAmNr === 0 ? 1 : 0)].deck[C2.dt][C2.position] = null;
                        sendLog('You destroyed', C2, 'with', C1);
                    }

                    sendToEnemy = true;
                }
            }
        }

        sendGame(sendToEnemy);
    }
    socket.on('moveCard', moveCard);

    function endGame(wincause, winner) {
        if (!addedUser && !isInGame()) return;
        if (!isInGame()) return;

        const cgid = userlists.eo[socket.username].gid;

        var g = userlists.g[cgid];

        const iAmNr = g.Players[0].User.name === socket.username ? 0 : 1;

        if (g.Winner === null && g.WinCause === null) {
            g.Winner = (winner === 0 || winner === 1) ? g.Players[winner].User.name : g.Players[(iAmNr === 0 ? 1 : 0)].User.name;
            g.WinCause = wincause;

            userlists.eo[g.Players[(iAmNr === 0 ? 1 : 0)].User.name].wins++;
        }

        userlists.g[cgid] = g;

        g.Players[0].deck.inBlock = Object.keys(g.Players[0].deck.inBlock).length;
        g.Players[1].deck.inBlock = Object.keys(g.Players[1].deck.inBlock).length;

        io.in(cgid).emit('gameEnded', g);
    }
    socket.on('giveUp', function() {
        endGame('given up');
    });

    function gameEnded() {
        if (!addedUser) return;

        const cgid = userlists.eo[socket.username].gid;
        leaveGID(cgid);
        userlists.eo[socket.username].gid = null;

        socket.state = 'results';
        sendState();
    }
    socket.on('gameEnded', gameEnded);

    function leaveGID(gid) {
        if (!addedUser && !isInGame()) return;
        if (!isInGame()) return;

        userlists.eo[socket.username].gid = null;
        socket.leave(gid);
    }

    function switchState(switchTo) {
        if (!addedUser) return;

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

        var alreadyLoggedIn = userlists.o.indexOf(username) !== -1;

        if (err.length === 0 && username && !alreadyLoggedIn) {
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
        } else if (alreadyLoggedIn) {
            err.push('alreadyLoggedIn');
        }

        socket.emit('loginProcessed', err);
    });

    function isInGame() {
        var isInGame = false;

        if (socket.hasOwnProperty('username'))
            if (socket.username !== '' && socket.state === 'inGame')
                if (userlists.eo[socket.username].gid !== null)
                    isInGame = true;

        return isInGame;
    }

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