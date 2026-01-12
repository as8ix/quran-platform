require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
const path = require('path');
console.log('Absolute path of ./dev.db:', path.resolve('./dev.db'));
