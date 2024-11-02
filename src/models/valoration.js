const mongoose = require('mongoose');

const { Schema } = mongoose;

const ValorationSchema = new Schema({
    description: { type:String, required:true },
    note: { type:Number, required:true },
    datetime: { type:Date, default:Date.now },
    book: { type:Schema.Types.ObjectId, required:true, ref:'Book' },
    user: { type:Schema.Types.ObjectId, required:true, ref:'User' },
    likes: [
        { user: { type:Schema.Types.ObjectId, ref:'Users Likes Valoration'} }
    ],
    dislikes: [
        { user: { type:Schema.Types.ObjectId, ref:'Users Dislikes Valoration'} }
    ]
});
    
module.exports = mongoose.model('Valoration', ValorationSchema);