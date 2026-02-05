
import { initDatabase, prepare } from './server/models/database.js';
import bcrypt from 'bcryptjs';

async function test() {
    console.log('Testing bcrypt...');
    const hash = await bcrypt.hash('password123', 10);
    console.log('Bcrypt hash:', hash);

    console.log('Initializing DB...');
    await initDatabase();
    console.log('DB Initialized.');

    try {
        console.log('Testing insert...');
        const uniqueName = 'u_' + Date.now();
        const res = prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(uniqueName, uniqueName + '@e.com', 'pass');
        console.log('Insert result:', res);

        console.log('Testing select...');
        const user = prepare('SELECT * FROM users WHERE username = ?').get(uniqueName);
        console.log('Select result:', user);
    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
