const express = require('express');
const connectDB = require('./config/db');

const app = express();

//Connect MongoDB
connectDB();

//Init Middleware
app.use(express.json({ extended: false })); //allows to get data from req.body transactions

app.get('/', (req, res) => res.send('API Running'));

//Define Routes -> mapping 1st param ('api/users') to definition in 2nd param (routes/api/users.js)
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 5000; //dis where port gonna be determined from (or default to 5000)

app.listen(PORT, () => console.log('Server started on port ' + PORT));
