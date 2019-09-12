const express = require('express');
const connectDB = require('./config/db');

const app = express();

//Connect MongoDB
connectDB();

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000; //dis where port gonna be determined from (or default to 5000)

app.listen(PORT, () => console.log('Server started on port ${PORT}'));
