import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // Replace with your backend IP if needed
export default socket;
