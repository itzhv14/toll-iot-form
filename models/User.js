const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  vno: {
    type: String,
    required: true
  },

  tagid: {
    type: String,
    required: true
  },

  balance: {
    type: Number,
    required: true
  },

  ctype: {
    type: Number,
    required: true
  }

});

const User = mongoose.model('User', UserSchema);

module.exports = User;
