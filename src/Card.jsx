import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { DragSource, DropTarget } from 'react-dnd';
import flow from 'lodash/flow';

import request from 'sync-request';
import { s_address } from './addresses.js';

import { log, err } from './logerr.js';

var CardArr = {};
function getCardArr() {
    const resCardArr = request('GET', s_address + '/cards');
    CardArr = JSON.parse(resCardArr.body);
}
getCardArr();
function getCard(type) {
    const resCard = request('GET', s_address + '/card/' + type);
    var nCard;
    eval('nCard = ' + resCard.body);
    CardArr[type] = nCard;
}
// getCard('King');

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
            frame: 0
        };
    }

    componentDidMount() {
        this.timerID = setInterval(
            () => this.tick(),
            120
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    tick() {
        const Card = this.props.c;
        const curFrame = this.state.frame;
        this.setState({
            frame: (curFrame + 1 < Card.frameNr ? curFrame + 1 : 0)
        });
    }

    render() {
        const Card = this.props.c;
        const type = Card.type;
        const curFrame = this.state.frame;

        const cx = curFrame % Card.x_px;
        const cxm = Card.x_px - cx - 1;

        const cy = (curFrame - curFrame % Card.x_px) / Card.x_px;
        const cym = Card.y_px - cy - 1;

        return (
            <div className="CardFace"
                style={{
                    borderImage: 'url(/Cards/Card-PNGs/' + type +
                    '_Icon_Bordered.png) calc(85 * ' + cy + ') calc(55 * ' + cxm +
                    ') calc(85 * ' + cym + ') calc(55 * ' + cx + ') fill'
                    // Maybe rather do it like Duelyst does, with background instead of border..
                    // I mean, that does look cleaner IMO :D
                }}>{/* <h4>{curFrame}</h4> */}</div>
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

        const type = this.props.type || "";
        const position = this.props.position;
        const dt = this.props.dt;
        const ooe = this.props.ooe;

        const dragable = this.props.dragable || "false";
        const dropable = this.props.dropable || "false";

        // getCard(type);

        var C = {
            "type": "",
            "x_px": 0,
            "y_px": 0,
            "frameNr": 0,
            "description": "",
            "cid": null,
            "alreadyUsed": false,
            "roundsLeft": 0,
            "MPS": 0,
            "HP": 0,
            "AP": 0,
            "AT": "",
            "effects": {}
        };
        if (CardArr.hasOwnProperty(type))
            C = CardArr[type];

        const description = C.description;
        const alreadyUsed = C.alreadyUsed;
        const roundsLeft = C.roundsLeft;
        const MPS = C.MPS;
        const HP = C.HP;
        const AP = C.AP;
        const AT = C.AT;
        const effects = C.effects;

        const CardMark =
            <div className="Card" type={type} fob={fOb}
                dt={dt} position={position} ooe={ooe}
                hoverable={hoverable}
                draggable={dragable} dropable={dropable}
                isdragging={isDragging ? "true" : "false"}>
                <div className="CardFG" tabIndex="-1">
                    <CardFace c={C} />
                    <span className="CardName">{type}</span>
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