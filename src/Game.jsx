import React, { Component } from 'react';
import Card from './Card.jsx';

import { log, err } from './logerr.js';

import { socket } from './socket.js';

class RenderCardArr extends Component {
    render() {
        const dt = this.props.dt;
        const ooe = this.props.ooe;

        const hoverable = this.props.hoverable || "false";

        const dragable = this.props.dragable || "false";
        const dropable = this.props.dropable || "false";

        const arr = this.props.arr;
        // log('arr >>', ooe, dt, arr);

        var rArr = [];
        if (typeof arr !== "number") {
            // rArr = arr.map((card) => 
            //     <Card key={y.cid} fOb="front" type={x} />
            // );
            for (let x in arr) {
                let y = arr[x];
                if (y !== null)
                    rArr.push(
                        <Card fOb="front" type={y.type}
                            hoverable={hoverable}
                            dragable={dragable} dropable={dropable}
                            key={ooe + '-' + dt + '-' + y.cid} />
                    );
                else
                    rArr.push(
                        <Card fOb="front" type="" hoverable={hoverable}
                            hoverable={hoverable} dragable="false" dropable={dropable}
                            key={ooe + '-' + dt + '-' + x.toString()} />
                    );
            }
        } else {
            for (let x = 0; x < arr; x++) {
                rArr.push(
                    <Card fOb="back" type="" hoverable={hoverable}
                        hoverable={hoverable} dragable="false" dropable="false"
                        key={ooe + '-' + dt + '-' + x.toString()} />
                )
            }
        }
        // log('rArr >>', ooe, dt, rArr);

        return (
            <div>{rArr}</div>
        );
    }
}

class DeckHand extends Component {
    render() {
        const cards = this.props.cards;
        const ooe = this.props.ooe;

        return (
            <div className="deck-hand" ooe={ooe}>
                <RenderCardArr arr={cards} dt="hand" ooe={ooe}
                    hoverable={ooe === "own" && "true"}
                    dragable={ooe === "own" && "true"}
                    dropable={ooe === "own" && "true"} />
            </div>
        );
    }
}

class DeckField extends Component {
    render() {
        const cards = this.props.cards;
        const ooe = this.props.ooe;

        return (
            <div className="deck-field" ooe={ooe}>
                <RenderCardArr arr={cards} dt="field" ooe={ooe}
                    hoverable="dynamic"
                    dragable={ooe === "own" && "true"}
                    dropable="true" />
            </div>
        );
    }
}

class DeckBlock extends Component {
    render() {
        const cards = this.props.cards;
        const ooe = this.props.ooe;

        return (
            <div className="deck-block" ooe={ooe}>
                <RenderCardArr arr={cards} dt="block" ooe={ooe}
                    hoverable="false"
                    dragable="false"
                    dropable="false" />
            </div>
        );
    }
}

class GameDeck extends Component {
    render() {
        const P = this.props.p;
        const ooe = this.props.ooe;

        return (
            <div className="deck" ooe={ooe}>
                <DeckBlock cards={P.deck.inBlock} ooe={ooe} />
                <DeckHand cards={P.deck.onHand} ooe={ooe} />
                <DeckField cards={P.deck.onField} ooe={ooe} />
            </div>
        );
    }
}

class Game extends Component {
    constructor(props) {
        super(props);
        this.state = {
            g: {},
            show_menu: false
        };

        this.handleShowMenuToggle = this.handleShowMenuToggle.bind(this);

        const dis = this;
        socket.on('game', function (g) {
            log('game >>', g);
            dis.setState({
                g: g
            });
        });
        socket.emit('getGame');
    }

    handleShowMenuToggle(event) {
        event.preventDefault();

        this.setState({
            show_menu: !this.state.show_menu
        });
    }

    componentDidMount() {
        // THIS LOOP CAN BE DISABLED, WHEN THE CARD-MOVING-SYSTEM IS SOMEWHAT RUNNING!
        this.timerID = setInterval(
            () => this.tick(),
            10000000000
            // 250
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    tick() {
        socket.emit('getGame');
    }

    render() {
        const username = this.props.username;
        const g = this.state.g;
        log('g2 >>', g);
        if (!g.hasOwnProperty('gid'))
            return null;

        const iAmNr = g.Players[0].User.name === username ? 0 : 1;
        return (
            <div className="App-game">
                <a href="#Menu-toggle" className="App-game-menu-toggle" onClick={(e) => this.handleShowMenuToggle(e)}>Menu</a>
                <div className={"App-game-decks show-menu-" + this.state.show_menu}>
                    <GameDeck p={g.Players[(iAmNr === 0 ? 1 : 0)]} ooe="enemy" />
                    <GameDeck p={g.Players[iAmNr]} ooe="own" />
                </div>
            </div>
        );
    }
}

export default Game;