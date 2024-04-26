const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    unique_id: Number,
    email: String,
    username: String,
    password: String,
    passwordConf: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
