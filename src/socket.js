import io from 'socket.io-client';
import { log, err } from './logerr.js';
import { s_address } from './addresses.js';

var socket = io(s_address);
socket.on('err', err);
socket.on('log', log);

export { socket };