import io from 'socket.io-client';
import {log, err} from './logerr.js';

var socket = io('http://localhost:3000');
socket.on('err', err);
socket.on('log', log);

export {socket};