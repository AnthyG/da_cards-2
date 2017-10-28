import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import io from 'socket.io-client';

var log = function log(...m) {
    console.log('\n' + Date().toString() + ':\n', m);
};

const socket = io('http://localhost:3000');

class FormLogin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            password: ''
        };

        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleUsernameChange(event) {
        this.props.handleUsernameChange(event.target.value);
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    handleSubmit(event) {
        event.preventDefault();

        const username = this.props.username;
        const password = this.state.password;

        if (username && password)
            this.props.handleLogin(password);
    }

    render() {
        const username = this.props.username;

        return (
            <form onSubmit={this.handleSubmit}>
                <label>
                    Username:
                    <input name="username" type="text" value={username} onChange={this.handleUsernameChange} />
                </label>
                <label>
                    Password:
                    <input name="password" type="password" value={this.state.password} onChange={this.handleInputChange} />
                </label>
                <input type="submit" value="Log in" />
            </form>
        );
    }
}

class Login extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const username = this.props.username;

        return (
            <div className="App-login">
                <p className="App-intro">
                    A cool new multiplayer browsergame, based on NodeJS and socket.io
            </p>
                <FormLogin username={username} handleUsernameChange={this.props.handleUsernameChange} handleLogin={this.props.handleLogin} />
            </div>
        );
    }
}

class MainMenu extends Component {
    constructor(props) {
        super(props);

        this.handleLogout = this.handleLogout.bind(this);
        this.handleMatchSearch = this.handleMatchSearch.bind(this);
    }

    handleLogout(event) {
        event.preventDefault();

        this.props.handleLogout();
    }

    handleMatchSearch(event) {
        event.preventDefault();

        this.props.handleMatchSearch();
    }

    render() {
        const username = this.props.username;
        const state = this.props.state;
        const stateText = (state === 'lobby' ? 'Start search' : (state === 'searching' ? 'Stop search' : (state === 'inGame' ? 'Give up' : 'Current state: ' + state)));

        return (
            <div className="App-mainMenu">
                <p>Welcome back, {username}! <a href="" onClick={this.handleLogout}>Log out</a></p>
                <br />
                <a href="" onClick={this.handleMatchSearch}>{stateText}</a>
            </div>
        );
    }
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            isLoggedIn: false,
            state: 'lobby'
        };

        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handleLogin = this.handleLogin.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleMatchSearch = this.handleMatchSearch.bind(this);

        const dis = this;
        socket.on('loginProcessed', function (err) {
            log('loginProcessed >>', 'Errors: ', err);

            dis.setState({
                isLoggedIn: (err.length === 0 ? true : false)
            });
        });
        socket.on('stateChanged', function (state) {
            dis.setState({
                state: state
            });
        });
    }

    handleUsernameChange(username) {
        this.setState({
            username: username
        });
    }

    handleLogin(password) {
        const state = this.state;

        log('logging in >> ', state, password);

        socket.emit('logIn', {
            username: state.username,
            password: password
        });
    }

    handleLogout() {
        this.setState({
            isLoggedIn: false
        });

        socket.emit('logOut');
    }

    handleMatchSearch() {
        const state = this.state.state;
        const nstate = (state === 'lobby' ? 'searching' : (state === 'searching' ? 'lobby' : (state === 'inGame' ? 'giveUp' : state)));

        socket.emit('toggleMatchSearch', nstate);
    }

    render() {
        const isLoggedIn = this.state.isLoggedIn;
        const username = this.state.username;
        const state = this.state.state;

        let CurScreen = null;
        if (isLoggedIn)
            CurScreen = <MainMenu username={username} state={state} handleLogout={this.handleLogout} handleMatchSearch={this.handleMatchSearch} />;
        else
            CurScreen = <Login username={username} handleUsernameChange={this.handleUsernameChange} handleLogin={this.handleLogin} />;

        return (
            <div className="App">
                <header className="App-header">
                    {/* <img src={logo} className="App-logo" alt="logo" /> */}
                    <h1 className="App-title">Da_Cards</h1>
                </header>
                {CurScreen}
            </div>
        );
    }
}

export default App;
