const mongoose = require('mongoose');

const dbCountersSchema = new mongoose.Schema({
    
    _id: String,
    sequence_value: Number,

}, { timestamps: true });

module.exports = mongoose.model('DBCounters', dbCountersSchema);
