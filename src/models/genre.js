const mongoose = require('mongoose');

const { Schema } = mongoose;

const GenreSchema = new Schema({
    name: { type:String, required:true, unique:true, trim:true }
});
    
module.exports = mongoose.model('Genre', GenreSchema);