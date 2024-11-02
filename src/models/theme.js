const mongoose = require('mongoose');

const { Schema } = mongoose;

const ThemeSchema = new Schema({
    title: { type:String, required:true },
    description: { type:String, required:true },
    datetime: { type : Date, required:true, default: Date.now  },
    comments: [
        {  description: { type:String, required:true },
           datetime: { type:Date, default: Date.now },
           user: { type: Schema.Types.ObjectId, ref:'User Comment', required:true }
        }
    ],
    user: { type:Schema.Types.ObjectId, ref:'User Theme', required : true },
    book: { type:Schema.Types.ObjectId, ref:'Book Theme' }
});
    
module.exports = mongoose.model('Theme', ThemeSchema);