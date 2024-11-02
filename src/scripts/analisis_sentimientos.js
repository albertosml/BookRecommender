var bayes = require('bayes');
 
var classifier = bayes();

// Leo los datos de los csv y los clasifico
const csv = require('csv-parser');
const fs = require('fs');

// Db connection
const { mongoose } = require('../database');

const Classifier = require('../models/classifier');
const Book = require('../models/book');

async function obtainBooks() {
    return await Book.find();
}

obtainBooks()
    .then(async books => {
        // Ajusto las polaridades de todos los libros a 0
        for(let i in books) {
            books[i].polarity = 0;
            await books[i].save();
        }

        // Creo el clasificador
        fs.createReadStream('src/data/tweets_opinion_aviones/tweets_public.csv') 
            .pipe(csv())
            .on('data', function(data) {
                classifier.learn(data.text, data.airline_sentiment);
            })
            .on('end',function(){
                fs.readdir('src/data/SFU', function(err,files) {
                    for(let i in files) {
                        fs.readdir('src/data/SFU/' + files[i], function(err, archivos) {
                            for(let j in archivos) {
                                fs.readFile('src/data/SFU/' + files[i] + '/' + archivos[j], 'latin1' , function(err, buf) {
                                    if(archivos[j].indexOf('yes') > -1) classifier.learn(buf.toString(), 'positive');
                                    else classifier.learn(buf.toString(), 'negative');
                                });
                            }
                        });
                    }

                    fs.readFile('src/data/dic/negative_words_es.txt', function(err, buf) {
                        var elements = buf.toString().split("\r\n");
                        for(let i in elements) classifier.learn(elements[i], 'negative');
                                                
                        fs.readFile('src/data/dic/positive_words_es.txt', async function(err, buf) {
                            var elements = buf.toString().split("\r\n");
                            for(let i in elements) classifier.learn(elements[i], 'positive');

                            var clas = new Classifier();
                            clas.json = classifier.toJson();
                            await clas.save();
                                                
                            process.exit();
                        });
                    });
                });
            });                
    });

