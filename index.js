require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Quote = require('./models/Quotes');

const app = express();
app.use(cors());
app.use(express.json());

//connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB', err);
});

//routes to get random quotes
app.get('/quote/random', async (req, res) => {
    const count = await Quote.countDocuments();
    const random = Math.floor(Math.random() * count);
    const quote = await Quote.findOne().skip(random);
    res.json(quote);
});

//Route to get daily quote based on date
app.get('/quote/daily', async (req, res) => {
    const count = await Quote.countDocuments();
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const index = dayOfYear % count;
    const quote = await Quote.findOne().skip(index);
    res.json(quote);
});

const PORT = process.env.PORT || 3000;  
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
