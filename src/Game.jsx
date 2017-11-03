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
                        <Card fOb="front"
                            ooe={ooe} dt={dt} position={x}
                            rc={y} type={y.type}
                            hoverable={hoverable}
                            dragable={dragable} dropable={dropable}
                            key={ooe + '-' + dt + '-' + y.cid}
                            movecard={this.props.movecard} />
                    );
                else
                    rArr.push(
                        <Card fOb="front"
                            ooe={ooe} dt={dt} position={x}
                            type=""
                            hoverable={hoverable}
                            dragable="false" dropable={dropable}
                            key={ooe + '-' + dt + '-' + x}
                            movecard={this.props.movecard} />
                    );
            }
        } else {
            for (let x = 0; x < arr; x++) {
                rArr.push(
                    <Card fOb="back"
                        ooe={ooe} dt={dt} position={x}
                        type=""
                        hoverable={hoverable}
                        dragable="false" dropable="false"
                        key={ooe + '-' + dt + '-' + x}
                        movecard={this.props.movecard} />
                )
            }
        }
        // log('rArr >>', ooe, dt, rArr);

        return (
            <div>{rArr}</div>
        );
    }
}

class DeckOnHand extends Component {
    render() {
        const cards = this.props.cards;
        const ooe = this.props.ooe;

        return (
            <div className="deck-onHand" ooe={ooe}>
                <RenderCardArr arr={cards} dt="onHand" ooe={ooe}
                    hoverable={ooe === "own" && "true"}
                    dragable={ooe === "own" && "true"}
                    dropable={ooe === "own" && "true"}
                    movecard={this.props.movecard} />
            </div>
        );
    }
}

class DeckOnField extends Component {
    render() {
        const cards = this.props.cards;
        const ooe = this.props.ooe;

        return (
            <div className="deck-onField" ooe={ooe}>
                <RenderCardArr arr={cards} dt="onField" ooe={ooe}
                    hoverable="dynamic"
                    dragable={ooe === "own" && "true"}
                    dropable="true"
                    movecard={this.props.movecard} />
            </div>
        );
    }
}

class DeckInBlock extends Component {
    render() {
        const cards = this.props.cards;
        const ooe = this.props.ooe;

        return (
            <div className="deck-inBlock" ooe={ooe}>
                <Card fOb="back" type="" dt="inBlock" position="0" ooe={ooe}
                    hoverable="false"
                    dragable="false" dropable="false"
                    movecard={this.props.movecard} />
                <span className="deck-inBlock-nr">{cards}</span>
            </div>
        );
    }
}

class PlayerInfo extends Component {
    render() {
        const P = this.props.p;
        const ooe = this.props.ooe;

        return (
            <div className="PlayerInfo" ooe={ooe}>
                <span className="PlayerName">{P.User.name}</span>&nbsp;
                <span className="MP">{P.MP}</span>&nbsp;
                <span className="HP">{P.HP}</span>&nbsp;
                {P.roundsOff > 0 &&
                    <span className="roundsOff">{P.roundsOff}&nbsp;</span>
                }
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
                <PlayerInfo p={P} ooe={ooe} />
                <DeckInBlock cards={P.deck.inBlock} ooe={ooe}
                    movecard={this.props.movecard} />
                <DeckOnHand cards={P.deck.onHand} ooe={ooe}
                    movecard={this.props.movecard} />
                <DeckOnField cards={P.deck.onField} ooe={ooe}
                    movecard={this.props.movecard} />
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
        this.moveCard = this.moveCard.bind(this);
        this.nextRound = this.nextRound.bind(this);

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

    moveCard(c1toc2) {
        log('moveCard >>', c1toc2);
        socket.emit('moveCard', c1toc2);
    }

    nextRound(event) {
        event.preventDefault();

        log('nextRound >>');
        socket.emit('nextRound');
    }

    componentDidMount() {
        // THIS LOOP CAN BE DISABLED, WHEN THE CARD-MOVING-SYSTEM IS SOMEWHAT RUNNING!
        // this.timerID = setInterval(
        //     () => this.tick(),
        //     10000000000
        //     // 250
        // );
    }

    componentWillUnmount() {
        // clearInterval(this.timerID);
    }

    tick() {
        // socket.emit('getGame');
    }

    render() {
        const username = this.props.username;
        const g = this.state.g;
        log('g2 >>', g);
        if (!g.hasOwnProperty('gid'))
            return null;

        const iAmNr = g.Players[0].User.name === username ? 0 : 1;
        return (
            <div className={"App-game show-menu-" + this.state.show_menu}>
                <a href="#Menu-toggle" className="App-game-menu-toggle" onClick={(e) => this.handleShowMenuToggle(e)}>Menu</a>

                <div className="App-game-info">
                    <span className="Creationdate">Creationdate: {g.Creationdate}</span><br />
                    <span className="roundLength">roundLength: {g.roundLength}</span><br />
                    <span className="timeRunning">timeRunning: {g.timeRunning}</span><br />
                    <span className="roundNumber">roundNumber: {g.roundNumber}</span><br />
                    <span className="currentPlayer">currentPlayer: {g.currentPlayer}</span><br />
                    <span className="Winner">Winner: {g.Winner}</span><br />
                    <span className="WinCause">WinCause: {g.WinCause}</span>
                </div>

                <div className="App-game-decks">
                    {username === g.currentPlayer ?
                        <a href="#nextRound" className="currentPlayer" onClick={(e) => this.nextRound(e)}>Finish turn</a> :
                        <a className="currentPlayer">Enemies turn</a>
                    }

                    <GameDeck p={g.Players[(iAmNr === 0 ? 1 : 0)]} ooe="enemy" movecard={this.moveCard} />
                    <GameDeck p={g.Players[iAmNr]} ooe="own" movecard={this.moveCard} />
                </div>
            </div>
        );
    }
}

export default Game;