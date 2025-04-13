const { Schema, model } = require('mongoose');
const mongoose = require('mongoose');

const Document = new Schema({
    _id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: 'Untitled Document'
    },
    data: {
      type: Object,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Optional for backward compatibility
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

Document.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = model('Document', Document);