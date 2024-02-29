const express = require('express');
const bcrypt = require('bcrypt');
const morgan = require('morgan');
const dotenv = require('dotenv').config({path: './config.env'});
const router = require('./routes/sevenzenroutes.js');
const path = require('path');

const app = express();

app.use(morgan('tiny'));
app.use(express.urlencoded({extended: false}));

app.use(express.json());

app.use('/', router);

app.listen(process.env.PORT, (err) => {
    if (err) return console.log(err);

    console.log(`Server is running on port ${process.env.PORT}`);
});