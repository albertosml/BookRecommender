const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema({
    username: { type:String, required:true, unique:true, trim:true },
    password: { type:String, required:true, trim:true },
    name: { type:String, required:true, trim:true },
    surname: { type:String, required:true, trim:true },
    email: { type:String, required:true, trim:true },
    favouritesgenres: [
        { genre: { type:Schema.Types.ObjectId, ref:'Favourite Genre' } }
    ],
    readed_books: [
        { readed_book: { type:Schema.Types.ObjectId, ref:'Readed Book' } }
    ],
    recomended_books: [
        { recomended_book: { type:Schema.Types.ObjectId, ref:'Recommended Book' } }
    ],
    pending_books: [
        { pending_book: { type:Schema.Types.ObjectId, ref:'Pending Book' } }
    ]
});
    
module.exports = mongoose.model('User', UserSchema);