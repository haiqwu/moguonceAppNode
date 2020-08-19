const mongoose = require('mongoose');
const crypto = require('crypto');
const { v1: uuidv1 } = require('uuid');
const { ObjectId } = mongoose.Schema;

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        trim: true,
        required: true,
        maxlength: 32
    },
    last_name: {
        type: String,
        trim: true,
        required: true,
        maxlength: 32
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: 32
    },
    hashed_password: {
        type: String,
        required: true,
    },
    about: {
        type: String,
        trim: true,
    },
    salt: String, // encrypt key 
    role: {
        type: Number,
        default: 0,
    },
    history: [
        { type: String, ref: "Order" },
    ],
}, { timestamps: true });

// virtual field
userSchema.virtual('password')
.set(function(password) {
    this._password = password;
    this.salt = uuidv1();
    this.hashed_password = this.encryptPassword(password)
})
.get(function() {
    return this._password;
});

userSchema.virtual('fullname')
.get(function() {
    return this.first_name + ' ' + this.last_name;
});

userSchema.methods = {
    authenticate: function(plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    },
    encryptPassword: function(password) {
        if (!password) return '';
        try {
            return crypto.createHmac('sha1', this.salt)
                .update(password)
                .digest('hex');
        } catch (err) {
            return '';
        }
    }
}

module.exports = mongoose.model('User', userSchema);
