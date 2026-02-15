const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
    sloka: {
        type: String,
        required: [true, 'Sloka text is required'],
        trim: true,
        maxlength: [1000, 'Sloka cannot exceed 1000 characters'],
    },
    translation: {
        type: String,
        trim: true,
        maxlength: [2000, 'Translation cannot exceed 2000 characters'],
    },
    transliteration: {
        type: String,
        trim: true,
        maxlength: [1000, 'Transliteration cannot exceed 1000 characters'],
    },
    source: {
        type: String,
        trim: true,
        maxlength: [200, 'Source cannot exceed 200 characters'],
        index: true, // Index for faster search queries
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Index for text search
QuoteSchema.index({ sloka: 'text', translation: 'text', source: 'text' });

module.exports = mongoose.model('Quote', QuoteSchema);