import React, { Component } from 'react';
import request from 'sync-request';

var log = function log(...m) {
    console.log('\n' + Date().toString() + ':\n', m);
};
var err = function err(...m) {
    console.error('\n' + Date().toString() + ':\n', m);
};

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
    render() {
        const style = this.props.style;

        const fOb = this.props.fOb;
        const type = this.props.type;

        // getCard(type);

        var C = { // Type/Name of the card
            "type": "", // Type/Name of the card

            "x_px": 0, // 495px // How many frames on x-axis (*55px)
            "y_px": 0, // 510px // How many frames on y-axis (*85px)
            "frameNr": 0, // Total number of frames

            "description": "", // Description of this card (will be shown on card-hover)

            "CID": null,
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

        return (
            <div className="Card" fob={fOb} style={style}>
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
        );
    }
}

export default Card;