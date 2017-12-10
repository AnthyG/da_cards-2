import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { DragSource, DropTarget } from 'react-dnd';
import flow from 'lodash/flow';

import request from 'sync-request';
import { s_address } from './addresses.js';

import { log, err } from './logerr.js';

var CardArr = {};
function getCardArr() {
    try {
        const resCardArr = request('GET', s_address + '/cards');
        CardArr = JSON.parse(resCardArr.body);
    } catch (error) {
        err(error);
    }
}
getCardArr();
function getCard(type) {
    try {
        const resCard = request('GET', s_address + '/card/' + type);
        var nCard;
        eval('nCard = ' + resCard.body);
        CardArr[type] = nCard;
    } catch (error) {
        err(error);
    }
}
// getCard('King');

var CardEffectsArr = {};
function getCardEffectsArr() {
    try {
        const resCardEffectsArr = request('GET', s_address + '/cardeffects');
        CardEffectsArr = JSON.parse(resCardEffectsArr.body);
    } catch (error) {
        err(error);
    }
}
getCardEffectsArr();
function getCardEffect(type) {
    try {
        const resCardEffect = request('GET', s_address + '/cardeffect/' + type);
        var nCardEffect;
        eval('nCardEffect = ' + resCardEffect.body);
        CardEffectsArr[type] = nCardEffect;
    } catch (error) {
        err(error);
    }
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
            frame_face: 0,
            frame_bg: 0
        };
    }

    draw() {
        const C = this.props.c;
        const curFrame_face = this.state.frame_face;
        const curFrame_bg = this.state.frame_bg;
        
        const x_px_face = C.animations.face.x_px;

        const cx_face = curFrame_face % x_px_face;

        const cy_face = (curFrame_face - curFrame_face % x_px_face) / x_px_face;
        
                
        const x_px_bg = C.animations.bg.x_px;

        const cx_bg = curFrame_bg % x_px_bg;

        const cy_bg = (curFrame_bg - curFrame_bg % x_px_bg) / x_px_bg;


        const dis = this;

        const cvs = dis.cvs;
        const ctx = dis.ctx;

        const img_face = dis.img_face;
        const img_bg = dis.img_bg;

        this.ctx.clearRect(0, 0, cvs.width, cvs.height);
        
        if (img_bg.src) {
            ctx.drawImage(img_bg, cx_bg * 55, cy_bg * 85, 55, 85, 0, 0, 55, 85);
        }
        
        if (img_face.src) {
            ctx.drawImage(img_face, cx_face * 55, cy_face * 85, 55, 85, 0, 0, 55, 85);
        }
    }

    componentDidMount() {
        const C = this.props.c;
        const rC = this.props.rc;
        const type = C.type;

        this.cvs = document.getElementById('Card-' + rC.cid);

        this.cvs.width = 55;
        this.cvs.height = 85;

        this.ctx = this.cvs.getContext('2d');

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

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    tick() {
        const C = this.props.c;
        const curFrame_face = this.state.frame_face;
        const curFrame_bg = this.state.frame_bg;

        this.draw();

        this.setState({
            frame_face: (curFrame_face + 1 < C.animations.face.frameNr ? curFrame_face + 1 : 0),
            frame_bg: (curFrame_bg + 1 < C.animations.bg.frameNr ? curFrame_bg + 1 : 0)
        });
    }

    render() {
        const rC = this.props.rc;

        return (
            <div className="CardFace">
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
    render() {
        const type = this.props.type;
        const rl = this.props.rl;

        const effect = CardEffectsArr[type];

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
            fOb: this.props.fOb || "front",
            hoverable: this.props.hoverable || "false"
        };
    }

    render() {
        const hoverable = this.state.hoverable || "false";
        const fOb = this.state.fOb || "front";

        const { connectDragSource, connectDropTarget, connectDragPreview, isDragging } = this.props;
        // log("DnD >>", connectDragSource, connectDropTarget, isDragging);

        var C = {
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
        const type = this.props.type;
        if (CardArr.hasOwnProperty(type))
            C = CardArr[type];

        const rC = this.props.rc || JSON.parse(JSON.stringify(C));
        const position = this.props.position;
        const dt = this.props.dt;
        const ooe = this.props.ooe;

        if (!rC.cid)
            rC.cid = "cid-undefined-" + Math.random().toString(16).slice(2) + "-" + (new Date()).getTime()

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
                dt={dt} position={position} ooe={ooe}
                alreadyused={alreadyUsed} marked={marked}
                hoverable={hoverable}
                draggable={alreadyUsed === 'false' ? dragable : 'false'}
                dropable={alreadyUsed === 'false' ? dropable : 'false'}
                isdragging={isDragging ? "true" : "false"}>
                <div className="CardFG" tabIndex="-1">
                    <CardFace c={C} rc={rC} />
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