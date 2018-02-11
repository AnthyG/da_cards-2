import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { DragSource, DropTarget } from 'react-dnd';
import flow from 'lodash/flow';

import request from 'then-request';
import { s_address } from './addresses.js';

import { log, err } from './logerr.js';

var tryRequests = {
    cards: [],
    effects: []
};

// setInterval(function() {
//     if (tryRequests.cards.length > 0) {
//         for (var ti in tryRequests.cards) {
//             var t = tryRequests.cards[ti];

//             getCard(t);
//         }
//     }
//     if (tryRequests.effects.length > 0) {
//         for (var ti in tryRequests.effects) {
//             var t = tryRequests.effects[ti];

//             getCardEffect(t);
//         }
//     }
// }, 10000);

var CardArr = {};
function getCardArr(cb) {
    request('GET', s_address + '/cards').done((res) => {
        try {
            CardArr = JSON.parse(res.body);
        } catch(error) {
            err(error);
        }

        typeof cb === "function" && cb(CardArr, res);
    });
}
// getCardArr();
function getCard(type, cb) {
    request('GET', s_address + '/card/' + type).done((res) => {
        log("getCard", type, res);

        try {
            CardArr[type] = JSON.parse(res.body);

            if (tryRequests.cards.indexOf(type) !== -1) {
                tryRequests.cards.splice(tryRequests.cards.indexOf(type), 1);
            }
        } catch(error) {
            err(error);
            
            if (tryRequests.cards.indexOf(type) === -1) {
                tryRequests.cards.push(type);
            }
        }

        typeof cb === "function" && cb(CardArr[type], res);
    });
}
// getCard('King');

var CardEffectsArr = {};
function getCardEffectsArr(cb) {
    request('GET', s_address + '/cardeffects').done((res) => {
        try {
            CardEffectsArr = JSON.parse(res.body);
        } catch(error) {
            err(error);
        }

        typeof cb === "function" && cb(CardEffectsArr, res);
    });
}
// getCardEffectsArr();
function getCardEffect(type, cb) {
    request('GET', s_address + '/cardeffect/' + type).done((res) => {
        log("getCardEffect", type, res);

        try {
            CardEffectsArr[type] = JSON.parse(res.body);

            if (tryRequests.effects.indexOf(type) !== -1) {
                tryRequests.effects.splice(tryRequests.effects.indexOf(type), 1);
            }
        } catch(error) {
            err(error);
            
            if (tryRequests.effects.indexOf(type) === -1) {
                tryRequests.effects.push(type);
            }
        }

        typeof cb === "function" && cb(CardEffectsArr[type], res);
    });
}
// getCardEffect('Motivate 1');

const Types = {
    CARD: 'card'
};

const cardSource = {
    beginDrag(props) {
        log('beginDrag >>', props);
        return props; // this is sent to target's .drop
    },
    endDrag(props, monitor, component) {
        log('endDrag >>..', monitor.didDrop(), props, monitor, component);
        if (!monitor.didDrop())
            return;

        const C1 = monitor.getItem(); // === props
        const C2 = monitor.getDropResult(); // this comes from target's .drop
        log('endDrag >>', C1, C2, props, monitor, component);

        C1.movecard({
            'c1': {
                dt: C1.dt,
                position: C1.position,
                side: C1.ooe
            },
            'c2': {
                dt: C2.dt,
                position: C2.position,
                side: C2.ooe
            }
        });
    }
};
function collectSource(connect, monitor) {
    // log('collectSource >>', connect, monitor);
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging()
    };
}

const cardTarget = {
    hover(props, monitor, component) {
        // log('hover >>', props, monitor, component);
    },
    canDrop(props, monitor) {
        // log('canDrop >>', props, monitor);
        return true;
    },
    drop(props, monitor, component) {
        const C1 = monitor.getItem(); // this comes from source's .beginDrag
        log('drop >>', C1, props, monitor, component);

        return props; // this is sent to source's .endDrag (getDropResult)
    }
};
function collectTarget(connect, monitor) {
    // log('collectTarget >>', connect, monitor);
    return {
        connectDropTarget: connect.dropTarget(),
        highlighted: monitor.canDrop(),
        hovered: monitor.isOver()
    }
}

class CardFace extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cardInfoLoaded: this.props.cardinfoloaded ? true : false,
            frame_face: 0,
            frame_bg: 0
        };
    }

    draw() {
        const C = this.props.c;
        const rC = this.props.rc;
        const curFrame_face = this.state.frame_face;
        const curFrame_bg = this.state.frame_bg;
        const animations = (C.animations || rC.animations);

        log("draw", C, C.type, rC, rC.type, animations, curFrame_face, curFrame_bg);
        
        const x_px_face = animations.face.x_px;

        const cx_face = curFrame_face % x_px_face;

        const cy_face = (curFrame_face - curFrame_face % x_px_face) / x_px_face;
        
                
        const x_px_bg = animations.bg.x_px;

        const cx_bg = curFrame_bg % x_px_bg;

        const cy_bg = (curFrame_bg - curFrame_bg % x_px_bg) / x_px_bg;



        const cvs = this.cvs;
        const ctx = this.ctx;

        const img_face = this.img_face;
        const img_bg = this.img_bg;

        this.ctx.clearRect(0, 0, cvs.width, cvs.height);
        
        if (img_bg.src) {
            ctx.drawImage(img_bg, cx_bg * 55, cy_bg * 85, 55, 85, 0, 0, 55, 85);
        }
        
        if (img_face.src) {
            ctx.drawImage(img_face, cx_face * 55, cy_face * 85, 55, 85, 0, 0, 55, 85);
        }
    }

    newDraw() {
        const C = this.props.c;
        const rC = this.props.rc;
        const type = C.type;

        this.cvs = document.getElementById('Card-' + rC.cid);

        this.cvs.width = 55;
        this.cvs.height = 85;

        this.ctx = this.cvs.getContext('2d');

        log('Card-' + rC.cid, type, this.cvs, this.ctx);

        this.img_face = new Image();
        this.img_bg = new Image();

        const dis = this;
        this.img_face.onload = function() {
            dis.img_bg.onload = function() {
                dis.timerID = setInterval(
                    () => dis.tick(),
                    120
                );
            };
            dis.img_bg.src = '/Cards/Card-PNGs/' + type + '_Border.png';
        };

        this.img_face.src = '/Cards/Card-PNGs/' + type + '_Icon.png';
    }

    shouldComponentUpdate(nextProps, nextState) {
        const test = this.props.cardinfoloaded !== nextProps.cardinfoloaded;
        // log("shouldComponentUpdate", this.props, this.state, nextProps, nextState, test);
        if (test) {
            return true;
        } else {
            return false;
        }
    }

    componentDidMount() {
        this.newDraw();
    }
    componentDidUpdate(prevProps, prevState) {
        clearInterval(this.timerID);
        log("componentDidUpdate", prevProps, prevState, this.props, this.state);
        this.newDraw();
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }
    // componentWillUpdate() {
    //     clearInterval(this.timerID);
    // }

    tick() {
        const C = this.props.c;
        const rC = this.props.rc;
        const curFrame_face = this.state.frame_face;
        const curFrame_bg = this.state.frame_bg;
        const animations = (C.animations || rC.animations);

        log("tick", C, C.type, rC, rC.type, animations, curFrame_face, curFrame_bg);

        this.draw();

        this.setState({
            frame_face: (curFrame_face + 1 < animations.face.frameNr ? curFrame_face + 1 : 0),
            frame_bg: (curFrame_bg + 1 < animations.bg.frameNr ? curFrame_bg + 1 : 0)
        });
    }

    render() {
        const rC = this.props.rc;

        return (
            <div className="CardFace" cardinfoloaded={this.state.cardInfoLoaded.toString()}>
                <canvas id={"Card-" + rC.cid}></canvas>
            </div>
        );
    }
}

class CardCorner extends Component {
    render() {
        const posX = this.props.posX || "L";
        const posY = this.props.posY || "T";

        const ctype = this.props.ctype;
        const value = this.props.value;

        return (
            <div className="CardCorner" posx={posX} posy={posY} ctype={ctype}><span>{value}</span></div>
        );
    }
}

class CardEffect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            effectInfoLoaded: CardEffectsArr.hasOwnProperty(this.props.type) || false
        };
    }

    componentDidMount() {
        var dis = this;

        if (!CardEffectsArr.hasOwnProperty(this.props.type)
            && this.props.type !== null && this.props.type) {
            getCardEffect(this.props.type, function(rbody, res) {
                // log(rbody, res);
            
                function getCardEffectIntervalFunc() {
                    getCardEffect(dis.props.type, function(rbody, res) {
                        if (rbody) {
                            clearInterval(getCardEffectInterval);
    
                            dis.setState({
                                effectInfoLoaded: true
                            });
                        }
                    });
                }
                getCardEffectIntervalFunc();

                var getCardEffectInterval = setInterval(getCardEffectIntervalFunc, 10000);
            });   
        }
    }

    render() {
        const type = this.props.type;
        const rl = this.props.rl;

        var effect = {
            "description": "",
            "roundsLeft": 0
        };
        if (CardEffectsArr.hasOwnProperty(type))
            effect = CardEffectsArr[type];

        return (
            <div className="CardEffect">
                <span className="EffectType">{type}</span><br />
                <span className="EffectRL">{rl}/{effect.roundsLeft}</span><br />
                <span className="EffectDescription">{effect.description}</span>
            </div>
        );
    }
}

class CardEffects extends Component {
    render() {
        const effects = this.props.effects;

        var effectslist = [];
        for (var ex in effects) {
            var ey = effects[ex];

            effectslist.push(
                <CardEffect type={ex} rl={ey}
                    key={ex + '-' + ey} />
            );
        }

        return (
            <div className="CardEffects">
                {effectslist}
            </div>
        );
    }
}

class CardInfo extends Component {
    render() {
        const C = this.props.c;
        const rC = this.props.rc;

        return (
            <div className="CardInfo">
                {rC.marked && <span>This card is marked!</span>}
                {rC.marked && <br />}
                <span>AT: {C.AT}</span><br />
                <span>Description: {C.description}</span><br />
                <CardEffects effects={C.effects} />
            </div>
        );
    }
}

class Card extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cardInfoLoaded: CardArr.hasOwnProperty(this.props.type) || false,
            fOb: this.props.fOb || "front",
            hoverable: this.props.hoverable || "false"
        };
    }
    
    componentDidMount() {
        var dis = this;

        const checkID = (Math.floor((Math.random() * 90000) + 10000)).toString();

        log("check: ", checkID, this.props.type, !CardArr.hasOwnProperty(this.props.type), this.props.type !== null, !!this.props.type);

        var oC = {
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
        };

        var C = {};

        const type = this.props.type;

        if (CardArr.hasOwnProperty(type))
            C = CardArr[type];

        var rC = this.props.rc || {};

        var error = false;
        for (var p in oC) {
            var pv = C[p];
            if (!C.hasOwnProperty(p))
                error = true;
            if (!rC.hasOwnProperty(p))
                error = true;
        }

        log("check 2: ", checkID, this.props.type, !CardArr.hasOwnProperty(this.props.type), this.props.type !== null, !!this.props.type, error);

        if ((!CardArr.hasOwnProperty(this.props.type) || error) &&
            this.props.type !== null && !!this.props.type
        ) {
            log("gettingCard: ", checkID);
            
            function getCardIntervalFunc() {
                getCard(dis.props.type, function(rbody, res) {
                    log("getCard: ", checkID, rbody, res);

                    if (rbody) {
                        clearInterval(getCardInterval);

                        dis.setState({
                            cardInfoLoaded: true
                        });
                    }
                });
            }
            getCardIntervalFunc();

            var getCardInterval = setInterval(getCardIntervalFunc, 10000);
        }
    }

    render() {
        const hoverable = this.state.hoverable || "false";
        const fOb = this.state.fOb || "front";

        const { connectDragSource, connectDropTarget, connectDragPreview, isDragging } = this.props;
        // log("DnD >>", connectDragSource, connectDropTarget, isDragging);

        var oC = {
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
        };

        var C = {};

        const type = this.props.type;
        
        const checkID = (Math.floor((Math.random() * 90000) + 10000)).toString();

        if (CardArr.hasOwnProperty(type))
            C = CardArr[type];
        else
            C = JSON.parse(JSON.stringify(oC));

        log("set (or not), C", checkID, JSON.parse(JSON.stringify(this.state.stateC)), CardArr.hasOwnProperty(type), C ? JSON.parse(JSON.stringify(C)) : C, this.props.rc ? JSON.parse(JSON.stringify(this.props.rc)) : this.props.rc);

        var rC = this.props.rc || JSON.parse(JSON.stringify(C));
        const position = this.props.position;
        const dt = this.props.dt;
        const ooe = this.props.ooe;

        if (rC.cid === null)
            rC.cid = "cid-undefined-" + Math.random().toString(16).slice(2) + "-" + (new Date()).getTime()

        C.cid = rC.cid;

        for (var p in oC) {
            var pv = C[p];
            if (!C.hasOwnProperty(p))
                C[p] = pv;
            if (!rC.hasOwnProperty(p))
                rC[p] = pv;
        }

        log("set (or not), C 2", checkID, CardArr.hasOwnProperty(type), C ? JSON.parse(JSON.stringify(C)) : C, rC ? JSON.parse(JSON.stringify(rC)) : rC);

        const dragable = this.props.dragable || "false";
        const dropable = this.props.dropable || "false";

        // getCard(type);

        const alreadyUsed = rC.alreadyUsed.toString();
        const roundsLeft = rC.roundsLeft;
        const marked = rC.marked.toString();
        const MPS = C.MPS;
        const HP = rC.HP;
        const AP = C.AP;

        const CardMark =
            <div className="Card" type={type} fob={fOb}
                cardinfoloaded={this.state.cardInfoLoaded.toString()}
                dt={dt} position={position} ooe={ooe}
                alreadyused={alreadyUsed} marked={marked}
                hoverable={hoverable}
                draggable={alreadyUsed === 'false' ? dragable : 'false'}
                dropable={alreadyUsed === 'false' ? dropable : 'false'}
                isdragging={isDragging ? "true" : "false"}>
                <div className="CardFG" tabIndex="-1">
                    <CardFace c={C} rc={rC} cardinfoloaded={this.state.cardInfoLoaded.toString()}/>
                    <span className="CardName">{type}</span>
                    <CardInfo c={C} rc={rC} />
                    <CardCorner ctype="AP" value={AP} />
                    <CardCorner ctype="HP" value={HP} posX="R" />
                    <CardCorner ctype="roundsLeft" value={roundsLeft} posY="B" />
                    <CardCorner ctype="MPS" value={MPS} posY="B" posX="R" />
                </div>
                <div className="CardBG" tabIndex="-1"></div>
            </div>

        if (dragable === "true" && dropable === "true")
            return connectDragSource(connectDropTarget(connectDragPreview(
                CardMark, {
                    captureDraggingState: true
                }
            )));
        else if (dragable === "true" && dropable === "false")
            return connectDragSource(connectDragPreview(
                CardMark, {
                    captureDraggingState: true
                }
            ));
        else if (dragable === "false" && dropable === "true")
            return connectDropTarget(
                CardMark
            );
        else
            return (
                CardMark
            );
    }
}

Card.propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    connectDragPreview: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired
}

export default flow(
    DragSource(Types.CARD, cardSource, collectSource),
    DropTarget(Types.CARD, cardTarget, collectTarget)
)(Card);
// export default DragSource(Types.CARD, cardSource, collectSource)(Card);
// export default Card;