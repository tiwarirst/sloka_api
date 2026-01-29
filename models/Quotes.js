const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
    sloka: {
        type: String,
        required: true},
    translation: String,
    transliteration: String,
    source: String

});
module.exports = mongoose.model('Quote', QuoteSchema);