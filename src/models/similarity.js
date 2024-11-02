const mongoose = require('mongoose');

const { Schema } = mongoose;

const SimilaritySchema = new Schema({
    user1: { type:Schema.Types.ObjectId, required:true, ref:'User 1' },
    user2: { type:Schema.Types.ObjectId, required:true, ref:'User 2' },
    sim: { type:String, required:true }
});
    
module.exports = mongoose.model('Similarity', SimilaritySchema);