import React, { Component } from 'react';
import CardArr from './Cards.js';

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
        const curFrame = this.state.frame;
        this.setState({
            frame: (curFrame + 1 < CardArr[this.props.type].frameNr ? curFrame + 1 : 0)
        });
    }

    render() {
        const type = this.props.type;
        const curFrame = this.state.frame;

        const cx = curFrame % CardArr[type].x_px;
        const cxm = CardArr[type].x_px - cx - 1;

        const cy = (curFrame - curFrame % CardArr[type].x_px) / CardArr[type].x_px;
        const cym = CardArr[type].y_px - cy - 1;

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

        const C = CardArr[type];
        const valMana = C.Mana;
        const valHP = C.HP;
        const valAP = C.AP;

        return (
            <div className="Card" fob={fOb} style={style}>
                <div className="CardFG" tabIndex="-1">
                    <CardFace type={type} />
                    <span className="CardName">{type}</span>
                    <CardCorner ctype="AP" value={valAP} />
                    <CardCorner ctype="HP" value={valHP} posX="R" />
                    <CardCorner posY="B" />
                    <CardCorner ctype="Mana" value={valMana} posY="B" posX="R" />
                </div>
                <div className="CardBG" tabIndex="-1"></div>
            </div>
        );
    }
}

export default Card;