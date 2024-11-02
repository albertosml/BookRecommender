const mongoose = require('mongoose');

const { Schema } = mongoose;

const ClassifierSchema = new Schema({
    json: { type:String, required:true }
});
    
module.exports = mongoose.model('Classifier', ClassifierSchema);