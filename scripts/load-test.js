const axios = require('axios');
const { io } = require('socket.io-client');

const URL = 'http://localhost:3001';
const CONCURRENT_USERS = 50;

async function simulateUser(id) {
    const socket = io(URL);

    socket.on('connect', () => {
        // console.log(`User ${id}: Socket Connected`);
    });

    try {
        // Login Mock (simulating auth flow)
        await axios.post(`${URL}/api/auth/login`, { email: 'admin', password: 'admin' });

        // Fetch Data
        await axios.get(`${URL}/api/tickets`);
        await axios.get(`${URL}/api/contacts`);

        // console.log(`User ${id}: Interactions Success`);
    } catch (e) {
        console.error(`User ${id}: Failed`, e.message);
    } finally {
        socket.disconnect();
    }
}

async function runLoadTest() {
    console.log(`Starting Load Test with ${CONCURRENT_USERS} users...`);
    const promises = [];
    for (let i = 0; i < CONCURRENT_USERS; i++) {
        promises.push(simulateUser(i));
    }

    const start = Date.now();
    await Promise.all(promises);
    const end = Date.now();

    console.log(`Load Test Complete. Took ${end - start}ms`);
}

runLoadTest();
