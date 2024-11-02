const mongoose = require('mongoose');

const { Schema } = mongoose;

const BookSchema = new Schema({
    isbn: { type:String, required:true, unique:true, trim:true },
    isbn13: { type:String, trim:true },
    title: { type:String, required:true, trim:true },
    authors: [String], 
    numpages: { type:Number },
    publicationdate: { type:Date },
    url: { type:String, trim:true },
    publisher: { type:String, trim:true },
    language: { type:String, trim:true },
    genres: [
        { genre: { type:Schema.Types.ObjectId, ref:'Genres' } }
    ],
    image: { type:String },
    polarity: { type:Number, default: 0}
});
    
module.exports = mongoose.model('Book', BookSchema);