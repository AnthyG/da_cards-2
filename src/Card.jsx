import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { DragSource, DropTarget } from 'react-dnd';
import flow from 'lodash/flow';

import request from 'sync-request';

import { log, err } from './logerr.js';

var CardArr = {};
function getCardArr() {
    const resCardArr = request('GET', 'http://localhost:3000/cards');
    CardArr = JSON.parse(resCardArr.body);
}
getCardArr();
function getCard(type) {
    const resCard = request('GET', 'http://localhost:3000/card/' + type);
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

        const C = monitor.getItem();
        const dropResult = monitor.getDropResult(); // this comes from target's .drop
        log('endDrag >>', C, dropResult, props, monitor, component);
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
        const C = monitor.getItem(); // this comes from source's .beginDrag
        log('drop >>', C, props, monitor, component);

        return props; // this is sent to source's .endDrag
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
            draggable: this.props.draggable || "false",
            hoverable: this.props.hoverable || "false"
        };
    }

    render() {
        const hoverable = this.state.hoverable;
        const draggable = this.state.draggable;
        const fOb = this.state.fOb;

        const { connectDragSource, connectDropTarget, connectDragPreview, isDragging } = this.props;
        // log("DnD >>", connectDragSource, connectDropTarget, isDragging);

        const type = this.props.type;

        // getCard(type);

        var C = { // Type/Name of the card
            "type": "", // Type/Name of the card

            "x_px": 0, // 495px // How many frames on x-axis (*55px)
            "y_px": 0, // 510px // How many frames on y-axis (*85px)
            "frameNr": 0, // Total number of frames

            "description": "", // Description of this card (will be shown on card-hover)

            "cid": null,
            "alreadyUsed": false, // if this card has already been played in "this" round
            "roundsLeft": 0, // rounds left, until this card will be destroyed (-1 for infinite)

            "MPS": 0, // required Mana-Points to summon this card
            "HP": 0, // Health-Points

            "AP": 0, // Attack-Points
            "AT": "", // Attack-Type (Magical || Physical)

            "effects":
            // The effects (own and enemy) that are currently on this card,
            // and their roundsLeft (gets applied after push to deck, so it can be pretty much everything)
            // Effects can already be in here, which are called summon-effects
            // They will be shown on card-hover
            {
                // Effecttype/-name: roundsLeft
            }
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
                hoverable={hoverable} isdragging={isDragging} draggable={draggable}>
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

        if (draggable === "true")
            return connectDragSource(connectDropTarget(connectDragPreview(
                CardMark
            ), {
                    captureDraggingState: true
                }
            ));
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