const mongoose = require('mongoose');

const { Schema } = mongoose;

const SuggestionSchema = new Schema({
    description: { type:String, required:true, trim:true },
    user: { type:Schema.Types.ObjectId, ref:'User' }
});
    
module.exports = mongoose.model('Suggestion', SuggestionSchema);