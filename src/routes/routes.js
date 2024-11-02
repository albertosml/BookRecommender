const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const bayes = require('bayes');
const schedule = require('node-schedule');
const SolrNode = require('solr-node');
const client = new SolrNode({
    host: '35.180.69.250',
    port: '8983',
    core: 'books',
    protocol: 'http'
});

// Models
const Genre = require('../models/genre');
const User = require('../models/user');
const Book = require('../models/book');
const Theme = require('../models/theme');
const Valoration = require('../models/valoration');
const Suggestion = require('../models/suggestion');
const Similarity = require('../models/similarity');
const Classifier = require('../models/classifier');

// Se actualiza el índice cada día a las 3 de la mañana
var cron = schedule.scheduleJob('0 3 * * *', async function () {
    let books = await Book.find();

    // Elimino todos los campos
    for(let i=0; i<books.length; i++) {
        client.delete('id:' + books[i]._id, function(err, result) {
            if (err) {
                console.log(err);
                return;
            }
            console.log('Response:', result);
        });
    }

    // Indexo el contenido
    var genres;
    for(let i=0; i<books.length; i++) {
        genres = [];
        for(let j=0;j<books[i].genres.length;j++) {
            var genre = await Genre.findOne({ _id: books[i].genres[j]._id });
            genres.push(genre.name);
        }
                
        var data = {
           'id': books[i]._id.toString(),
           'isbn': books[i].isbn,
           'isbn13': books[i].isbn13 != undefined ? books[i].isbn13 : '',
           'title': books[i].title,
           'authors': books[i].authors,
           'publisher': books[i].publisher != undefined ? books[i].publisher: '',
           'language': books[i].language != undefined ? books[i].language: '',
           'genres': genres,
           'polarity': books[i].polarity 
        };

        client.update(data, function(err, result) {
            if (err) {
                console.log(err);
                return;
            }
            console.log('Response:', result);  
        });
    }
});

// Functions
function filtrarAcentos(nombre) {
    // Filtro acentos
    nombre = nombre.replace(/á/gi,"a");
    nombre = nombre.replace(/é/gi,"e");
    nombre = nombre.replace(/í/gi,"i");
    nombre = nombre.replace(/ó/gi,"o");
    nombre = nombre.replace(/ú/gi,"u");
    nombre = nombre.replace(/ü/gi,"u");
    nombre = nombre.replace(/Á/gi,"A");
    nombre = nombre.replace(/É/gi,"E");
    nombre = nombre.replace(/Í/gi,"I");
    nombre = nombre.replace(/Ó/gi,"O");
    nombre = nombre.replace(/Ú/gi,"U");
    nombre = nombre.replace(/Ü/gi,"U");

    return nombre;
}

function filtrarGenero(nombre) {
    // Filtro mayúsculas y minúsculas
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();

    return filtrarAcentos(nombre);
}

function calculaSimilitud(ar1, ar2) {
    if(ar1.length == 0) return 0;
    else if(ar1.length == 1) {
        var diferencia = Math.abs(ar1[0] - ar2[0]);
        if(diferencia == 0) return 1;
        else if(diferencia == 1) return 0.5;
        else if(diferencia == 2) return 0;
        else if(diferencia == 3) return -0.5;
        else return -1;
    }
    else {
        // Calculo correlación pearson

        // 1) Calculo medias ar1 y ar2
        var media1 = 0;
        var media2 = 0;

        for(let i in ar1) {
            media1 += ar1[i];
            media2 += ar2[i];
        } 

        media1 /= ar1.length;
        media2 /= ar2.length;

        // 2) Calculo numerador correlación pearson
        var num = 0;
        for(let i in ar1) num += ((ar1[i] - media1)*(ar2[i]- media2));

        // 3) Calculo denominador correlación pearson
        var den1 = 0;
        var den2 = 0;
        for(let i in ar1) {
            den1 += Math.pow(ar1[i] - media1, 2);
            den2 += Math.pow(ar2[i] - media2, 2);
        }
        
        var den = Math.sqrt(den1) * Math.sqrt(den2);

        // 4) Calculo resultado correlación pearson
        var resultado = num/den;

        if(isNaN(resultado)) {
            // Si es NaN, procedo a calcular la correlación pearson
            
            // 1) Calculo numerador
            num = 0;

            for(let i in ar1) num += (ar1[i] * ar2[i]);

            // 2) Calcula denominador
            den1 = 0;
            den2 = 0;

            for(let i in ar1) {
                den1 += Math.pow(ar1[i], 2);
                den2 += Math.pow(ar2[i], 2);
            }

            den = Math.sqrt(den1) * Math.sqrt(den2);

            // 3) Calculo resultado
            return num/den;
        }
        else return resultado;
    }
}

async function obtenerComunes(id1, id2) {
    var ar1 = await Valoration.find({ user: id1 });
    var ar2 = await Valoration.find({ user: id2 });

    var array1 = [];
    var array2 = [];

    // Obtenemos las valoraciones comunes
    for(let i in ar1) {
        for(let j=(parseInt(i)+1);j<ar2.length;j++) {
            if(ar1[i].book.toString() == ar2[j].book.toString()) {
                array1.push(ar1[i].note);
                array2.push(ar2[i].note);
            }
        }
    }

    return { 'array1': array1, 'array2': array2 };
}

async function obtenerSimilitudes(usuarios, user_id) {
    for(let i in usuarios) {
        var obj = await obtenerComunes(user_id, usuarios[i]._id);

        let simi = await Similarity.findOne({ $or: [ { user1: user_id, user2: usuarios[i]._id }, { user2: user_id, user1: usuarios[i]._id } ] });
        if(simi == null) {
            let sim_new = new Similarity();
            sim_new.user1 = user_id;
            sim_new.user2 = usuarios[i]._id;
            sim_new.sim = calculaSimilitud(obj.array1, obj.array2);

            await sim_new.save();
        }
        else {
            simi.sim = calculaSimilitud(obj.array1, obj.array2);
            await simi.save();
        }
    }
}

async function obtenerLibrosRecomendados(usuario_activo, vecinos) {
    var valoraciones_ua = await Valoration.find({ user: usuario_activo });
    
    var libros_no_comunes = [];
    var media_vecinos = [];
    var c = 0; // Constante c predicción

    // Obtengo libros no comunes
    for(let i in vecinos) {
        c += Math.abs(vecinos[i].sim);
        
        let vecino_id = vecinos[i].user1.toString() == usuario_activo.toString() ? vecinos[i].user2 : vecinos[i].user1;
        let valoraciones_vecino = await Valoration.find({ user: vecino_id });
        
        media_vecinos[vecino_id] = 0;
        
        for(let j in valoraciones_vecino) {
            var encontrado = valoraciones_ua.find(function(element) {
                return element.book.toString() == valoraciones_vecino[j].book.toString();
            });

            // Si ese libro no ha sido leído por el usuario activo, lo añado
            if(encontrado == undefined) {
                let book = valoraciones_vecino[j].book.toString();
                if(libros_no_comunes[book] == undefined) {
                    libros_no_comunes[book] = [{ note: valoraciones_vecino[j].note, similitud: vecinos[i].sim, vecino: vecino_id }];
                }
                else libros_no_comunes[book].push({ note: valoraciones_vecino[j].note, similitud: vecinos[i].sim, vecino: vecino_id }); 
            }

            media_vecinos[vecino_id] += valoraciones_vecino[j].note;
        }

        media_vecinos[vecino_id] /= valoraciones_vecino.length;
    }
     
    c = 1/c;

    // Para cada ítem, calculo la predicción
    var libros = [];

    // Media valoraciones usuario activo
    var media_u = 0;
    for(let k in valoraciones_ua) media_u += valoraciones_ua[k].note;
    media_u /= valoraciones_ua.length;

    for(let i in libros_no_comunes) {
        var sum = 0;

        for(let j in libros_no_comunes[i]) {
            sum += (libros_no_comunes[i][j].similitud * (libros_no_comunes[i][j].note - media_vecinos[libros_no_comunes[i][j].vecino])); 
        }

        var estimacion = media_u + c * sum;

        if(estimacion > 4 && !libros.includes(i)) libros.push(i);
    }

    return libros;
}

async function devolverRecomendacion(user, libros, res) {
    // Añado el libro a la lista de recomendados (hasta 3 libros)
    let cont = 0;

    for(let i in libros) {
        let pert = await User.findOne({ _id: user._id, $or: [ { readed_books: {$elemMatch: {_id: libros[i]} } }, { pending_books: {$elemMatch: {_id: libros[i]} } }, { recomended_books: {$elemMatch: {_id: libros[i]} } } ] });
        if(cont == 3) break;
        else if(pert == null) {
            user.recomended_books.push(libros[i]);
            await user.save();

            cont++;
        }
    }

    if(res != null) {
        // Devuelvo los libros recomendados del usuario
        var array = [];

        for(let i in user.recomended_books) {
            var book = await Book.findOne({ _id: user.recomended_books[i]._id});

            if(book != null) {
                array.push({ 
                    isbn: book.isbn,
                    title: book.title
                });
            }
        }

        res.json({ array: array, cont: cont, msg: '' });
    }
}

async function recomendacionPorGeneros(user, res = null) {
    // Obtengo libros recomendados
    var libros = [];

    // Preparo consulta
    var consulta = 'q=genres: ( ';
    for(let i in user.favouritesgenres) {
        let genre = await Genre.findOne({ _id: user.favouritesgenres[i]._id });
        if(genre != null) consulta += ('\"' + genre.name + '\" '); 
    }

    consulta += ')&rows=30';

    client.search(consulta, async function(err, result) {
        if(err) {
            console.log(err);
            res.json({ msg: 'Problema al hacer la recomendación' });
            return;
        }

        for(let i in result.response.docs) {
            libros.push(result.response.docs[i].id);
        }

        // Devuelvo los libros recomendados del usuario
        var array = [];

        devolverRecomendacion(user, libros, res);
    });
}

// Routes
router.post('/book/data', async(req, res) => {
    const book = await Book.find({isbn: req.body.isbn});

    if(book.length == 0) res.json({ data: null, genres: null});
    else {
        const array = [];
        // Me recorro los géneros y obtengo los nombres
        for(let i in book[0].genres) {
            const genero = await Genre.findById(book[0].genres[i]._id);
            if(genero != null) array.push(genero.name);
        }

        res.json({ data: book, genres: array});
    }
});

router.post('/book/edit', async (req,res) => {
    // Obtengo el usuario de la sesión
    const book = await Book.findOne({ isbn: req.body.isbn });
    if(book != null) {
        // Si se introduce un título distinto, se actualiza
        if(req.body.title.length > 0 && req.body.title != req.body.title_old) book.title = req.body.title;
      
        // Si se introduce unos autores distintos, se actualizan
        if(req.body.chips_author.length > 0 && req.body.chips_author != req.body.chips_author_old) book.authors = req.body.chips_author;

        // Si se introduce un número de páginas distinto, se actualiza
        if(req.body.numpages.length > 0 && req.body.numpages != req.body.numpages_old) book.numpages = req.body.numpages;
        
        // Si se introduce una fecha de publicación distinta, se actualiza
        if(req.body.publicationdate.length > 0 && req.body.publicationdate != req.body.publicationdate_old) book.publicationdate = req.body.publicationdate;

        // Si se introduce una URL distinta, se actualiza
        if(req.body.url.length > 0 && req.body.url != req.body.url_old) book.url = req.body.url;

        // Si se introduce una editorial distinta, se actualiza
        if(req.body.publisher.length > 0 && req.body.publisher != req.body.publisher_old) book.publisher = req.body.publisher;

        // Si se introduce un idioma distinto, se actualiza
        if(req.body.language.length > 0 && req.body.language != req.body.language_old) book.language = req.body.language;

        // Si se ha modificado los géneros, los actualizamos
        if(req.body.chips != req.body.chips_old) {
            book.genres = [];
            for(let i in req.body.chips) {
                var nombre = filtrarGenero(req.body.chips[i]);
                const genero = await Genre.find({name: nombre});
                if(genero.length > 0) {
                    // Obtengo id y lo inserto
                    await book.genres.push(genero[0]._id);
                }
                else {
                    // Creo el género
                    var g = new Genre();
                    g.name = nombre;

                    await g.save();

                    // Obtengo el id y lo inserto
                    const genero = await Genre.find({name: nombre});
                    if(genero.length > 0) await book.genres.push(genero[0]._id);
                }
            }        
        }        
        
        // Si se modificado la imagen, se actualiza
        if(req.body.image != undefined) book.image = req.body.image;
        
        await book.save();
               
        res.json({msg: ''});      
    }
    else res.json({ msg: 'ISBN no encontrado'});
});

router.post('/book/signup', async (req,res) => {
    // https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s13.html
    // Comprobar ISBN-10 o ISBN-13
    var regex = new RegExp("^(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$");
    if(regex.test(req.body.isbn)) {
        var is = req.body.isbn.replace(/-/g,"");
        // Compruebo si existe un libro con ese ISBN
        const isbn = await Book.find({ $or : [ {isbn: is}, {isbn13: is} ] });
        if(isbn.length == 0) {
            // Compruebo si se han introducido los géneros del libro
            if(req.body.chips.length > 0) {
                fetch('https://www.googleapis.com/books/v1/volumes?q=isbn:' + is,{
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                    .then(res => res.json())
                    .then(async data => {
                        const libro = new Book(); // Creo libro
                        if(data.totalItems == 0) {
                            if(req.body.chips_author.length == 0 || req.body.title.length == 0) res.json({ msg: 'No se han podido obtener los datos del libro con ese ISBN, por favor introduzcalos'});
                            else {
                                // Meto ya los datos obtenidos
                                libro.isbn = is;
                                libro.isbn13 = "";
                                libro.title = req.body.title;
                                libro.authors = req.body.chips_author;
                                libro.numpages = req.body.numpages != undefined && req.body.numpages != null && req.body.numpages.length > 0 ? req.body.numpages : 0;

                                // Se inserta la fecha de publicación, si se ha introducido
                                libro.publicationdate = req.body.publicationdate;

                                // Se inserta una url de referencia, si se ha introducido
                                libro.url = req.body.url;

                                // Se inserta la editorial, si se ha introducido
                                libro.publisher = req.body.publisher;

                                // Se inserta el idioma, si se ha introducido
                                libro.language = req.body.language;

                                // Si se han introducido géneros, se insertan 
                                if(req.body.chips.length > 0) {
                                    libro.genres = [];
                                    for(let i in req.body.chips) {
                                        var nombre = filtrarGenero(req.body.chips[i]);
                                        const genero = await Genre.find({name: nombre});
                                        if(genero.length > 0) {
                                            // Obtengo id y lo inserto
                                            await libro.genres.push(genero[0]._id);
                                        }
                                        else {
                                            // Creo el género
                                            var g = new Genre();
                                            g.name = nombre;
                        
                                            await g.save();
                        
                                            // Obtengo el id y lo inserto
                                            const genero = await Genre.find({name: nombre});
                                            if(genero.length > 0) await libro.genres.push(genero[0]._id);
                                        }    
                                    }   
                                }

                                // Si se ha subido una imagen, la almaceno
                                libro.image = req.body.image;

                                // Guardo el libro
                                await libro.save();
                            }
                        }
                        else {
                            var isb;

                            // ISBN
                            if(data.items[0].volumeInfo.industryIdentifiers[0].type == "ISBN_10") {
                                libro.isbn = data.items[0].volumeInfo.industryIdentifiers[0].identifier;
                                libro.isbn13 = data.items[0].volumeInfo.industryIdentifiers[1].identifier;
                                isb = libro.isbn;
                            }
                            else if(data.items[0].volumeInfo.industryIdentifiers[0].type == "ISBN_13") {
                                libro.isbn13 = data.items[0].volumeInfo.industryIdentifiers[0].identifier;
                                libro.isbn = data.items[0].volumeInfo.industryIdentifiers[1].identifier;
                                isb = libro.isbn;
                            }
                            else {
                                libro.isbn = is;
                                isb = libro.isbn;
                            }

                            // Título
                            libro.title = req.body.title.length > 0 ? req.body.title : data.items[0].volumeInfo.title;
                                    
                            // Autores
                            libro.authors = [];
                            if(req.body.chips_author.length > 0) libro.authors = req.body.chips_author;
                            else for(let i in data.items[0].volumeInfo.authors) await libro.authors.push(data.items[0].volumeInfo.authors[i]);
                                    
                            // Número de páginas
                            libro.numpages = req.body.numpages != undefined && req.body.numpages != null && req.body.numpages.length > 0 ? req.body.numpages : (data.items[0].volumeInfo.pageCount != undefined ? data.items[0].volumeInfo.pageCount : 0);

                            // Fecha de publicación
                            libro.publicationdate = req.body.publicationdate.length == 0 ? data.items[0].volumeInfo.publishedDate : req.body.publicationdate;

                            // URL
                            libro.url = req.body.url.length > 0 ? req.body.url : data.items[0].volumeInfo.previewLink;

                            // Editorial
                            libro.publisher = req.body.publisher.length > 0 ? req.body.publisher : data.items[0].volumeInfo.publisher;

                            // Idioma
                            libro.language = req.body.language.length > 0 ? req.body.language : data.items[0].volumeInfo.language.toUpperCase();

                            // Si se han introducido géneros, se insertan 
                            libro.genres = [];                      
                            if(req.body.chips.length > 0) {
                                for(let i in req.body.chips) {
                                    var nombre = filtrarGenero(req.body.chips[i]);
                                    const genero = await Genre.find({name: nombre});
                                    if(genero.length > 0) {
                                        // Obtengo id y lo inserto
                                        await libro.genres.push(genero[0]._id);
                                    }
                                    else {
                                        // Creo el género
                                        var g = new Genre();
                                        g.name = nombre;
                    
                                        await g.save();
                    
                                        // Obtengo el id y lo inserto
                                        const genero = await Genre.find({name: nombre});
                                        if(genero.length > 0) await libro.genres.push(genero[0]._id);
                                    }    
                                }   
                            }

                            // Si se ha subido una imagen, la almaceno
                            libro.image = req.body.image;
                                    
                            // Guardo el libro
                            await libro.save();
                        }

                        // Recomiendo este libro a usuarios aleatorios
                        var users = await User.aggregate([{ $sample: {size: 5} }]);
                        var user = req.session.username != undefined ? req.session.username : req.body.username;
                        
                        if(user != undefined) {
                            var ses = await User.findOne({ username: user }); // No se le debe recomendar este libro al usuario actual, ya que se supone que está interesado
                            for(let i in users) {
                                var u = await User.findById(users[i]._id);

                                if(u.username != "admin" && u.username != ses.username) {
                                    await u.recomended_books.push(libro._id);
                                    await u.save();
                                } 
                            }
                        }
                        else {
                            for(let i in users) {
                                var u = await User.findById(users[i]._id);
                                
                                if(u.username != "admin") {
                                    await u.recomended_books.push(libro._id);
                                    await u.save();
                                } 
                            }
                        }

                        res.json({ isbn: data.totalItems == 0 ? is : isb, msg: '' });
                    })
                    .catch(err => console.log(err));
            }
            else res.json({ msg: 'Introduzca los géneros del libro' });
        }
        else res.json({ msg: 'El libro con ese ISBN se encuentra ya registrado' });
    }
    else res.json({ msg: 'ISBN no introducido o no tiene el formato correcto' });
});

router.get('/users/signout', async (req,res) => {
    req.session.username = '';
    res.json({msg: 'Sesión cerrada con éxito'})
});

router.get('/verifysession', async (req,res) => {
    if(req.session.username === undefined || req.session.username.length == 0) res.json({msg: 'NO'});
    else res.json({msg: 'SI'});
});

router.get('/user', async (req,res) => {
    const username = await User.find({username: req.session.username});
    if(username.length > 0) {
        res.json({
            msg: '',
            username: username[0].username,
            name: username[0].name + " " + username[0].surname
        });
    }
    else res.json({ msg: 'Usuario no encontrado'})
});

router.post('/user/data', async (req,res) => {
    var usuario = req.session.username != undefined ? req.session.username : req.body.username;
    const username = await User.find({username: usuario});
    if(username.length > 0) {
        const array = [];
        // Me recorro los géneros y obtengo los nombres
        for(let i in username[0].favouritesgenres) {
            const genero = await Genre.findById(username[0].favouritesgenres[i]._id);
            if(genero != null) array.push(genero.name);
        }

        res.json({
            msg: '',
            user: username[0],
            generos: array
        });
    }
    else res.json({ msg: 'Usuario no encontrado'})
});

router.post('/user/profile', async (req,res) => {
    var usuario_sesion = req.session.username != undefined ? req.session.username : req.body.username_old;

    // El usuario administrador no puede cambiarse el nombre de usuario, lo comprobamos 
    if(req.body.username_old == "admin" && req.body.username.length > 0) return res.json({ msg: 'El administrador no puede cambiarse el nombre de usuario'});

    var cambiado = false;
    // Obtengo el usuario de la sesión
    const user = await User.findOne({username: usuario_sesion});
    if(user != null) {
        // Si se ha introducido un nombre de usuario distinto, se actualiza si se puede
        if(req.body.username.length > 0 && req.body.username != req.body.username_old) {
            // Comprobamos si existe el nuevo nombre de usuario, si existe no se podrá reemplazar
            var usuario = await User.findOne({username: req.body.username});
            if(usuario == null) {// Compruebo si ha introducido la contraseña
                if(req.body.password.length > 0 && req.body.password == req.body.confirmpassword) {
                    user.username = req.body.username;
                    req.session.username = '';
                    cambiado = true;
                }
                else return res.json({ msg: 'Para cambiar el nombre de usuario hay que introducir la contraseña y confirmarla'});
            }
            else return res.json({ msg: 'Nombre de usuario ya existente, pruebe con otro nombre de usuario'});
        }

        // Si se introduce un nombre distinto, se actualiza
        if(req.body.name.length > 0 && req.body.name != req.body.name_old) user.name = req.body.name;
      
        // Si se introduce unos apellidos distintos, se actualizan
        if(req.body.surname.length > 0 && req.body.surname != req.body.surname_old) user.surname = req.body.surname;

        // Si se introduce un email distinto, se actualiza
        if(req.body.email.length > 0 && req.body.email != req.body.email_old) user.email = req.body.email;

        // Compruebo que se haya introducido la contraseña
        if(req.body.password.length > 0) {
            if(req.body.password == req.body.confirmpassword) {
                user.password = crypto.createHmac('sha1', user.username).update(req.body.password).digest('hex');
            }
            else return res.json({ msg: 'Las contraseñas no son iguales'});
        }
                            
        // Si se ha modificado los géneros, los actualizamos
        if(req.body.chips != req.body.chips_old) {
            user.favouritesgenres = [];
            for(let i in req.body.chips) {
                var nombre = filtrarGenero(req.body.chips[i]);
                const genero = await Genre.find({name: nombre});
                if(genero.length > 0) {
                    // Obtengo id y lo inserto
                    await user.favouritesgenres.push(genero[0]._id);
                }
                else {
                    // Creo el género
                    var g = new Genre();
                    g.name = nombre;

                    await g.save();

                    // Obtengo el id y lo inserto
                    const genero = await Genre.find({name: nombre});
                    if(genero.length > 0) await user.favouritesgenres.push(genero[0]._id);
                }    
            }           
        }                   
        
        await user.save();
               
        if(cambiado) res.json({msg: '', close: 'si'}); 
        else res.json({msg: ''});      
    }
    else res.json({ msg: 'Nombre de usuario no encontrado'});
});

router.post('/users/signin', async (req,res) => {
    if(req.body.username.length > 0) { // Comprobar username
        // Compruebo si existe ese nombre de usuario, en caso afirmativo, se sigue comprobando
        const u = await User.findOne({ $or : [ {username: req.body.username}, {email: req.body.username} ] });
        if(u != null) {
            // Compruebo que se haya introducido la contraseña
            if(req.body.password.length > 0) { 
                // Comprobamos que la contraseña es la correcta, si lo es, redireccionamos a la página de inicio, si no, notificamos el error
                if(crypto.createHmac('sha1', u.username).update(req.body.password).digest('hex') === u.password) {
                    req.session.username = u.username;
                    
                    // Las sesiones se mantendrán almacenadas como mucho 1 hora
                    req.session.cookie.expires = new Date(Date.now() + 3600000);
                    req.session.cookie.maxAge = 3600000;
                    
                    res.json({msg: '', username: u.username});
                }
                else res.json({msg: 'Nombre de usuario/Email y/o contraseña incorrectos'});
            }
            else res.json({msg: 'Contraseña no introducida'});
        }
        else res.json({msg: 'Nombre de usuario/Email y/o contraseña incorrectos'});
    }
    else res.json({msg: 'Nombre de usuario o email no introducido'});
});

router.post('/users/signup', async (req,res) => {
    if(req.body.username.length > 0) { // Comprobar username
        // Compruebo si existe ese nombre de usuario
        const username = await User.find({username: req.body.username});
        if(username.length == 0) {
            if(req.body.name.length > 0) { // Compruebo nombre
                if(req.body.surname.length > 0) { // Compruebo apellidos
                    if(req.body.email.length > 0) { // Compruebo email
                        // Compruebo que se haya introducido la contraseña
                        if(req.body.password.length > 0) { 
                            // Compruebo que ambas contraseñas sean iguales
                            if(req.body.password == req.body.confirmpassword) {
                                const data =  { 
                                    username: req.body.username,
                                    name: req.body.name,
                                    surname: req.body.surname,
                                    email: req.body.email,
                                    password: crypto.createHmac('sha1', req.body.username).update(req.body.password).digest('hex')
                                };
                                
                                var usuario = new User(data);

                                for(let i in req.body.chips) {
                                    var nombre = filtrarGenero(req.body.chips[i]);
                                    const genero = await Genre.find({name: nombre});
                                    if(genero.length > 0) {
                                        // Obtengo id y lo inserto
                                        await usuario.favouritesgenres.push(genero[0]._id);
                                    }
                                    else {
                                        // Creo el género
                                        var g = new Genre();
                                        g.name = nombre;
                    
                                        await g.save();
                    
                                        // Obtengo el id y lo inserto
                                        const genero = await Genre.find({name: nombre});
                                        if(genero.length > 0) await usuario.favouritesgenres.push(genero[0]._id);
                                    }    
                                }   
                                
                                await usuario.save();

                                // Una vez registrado el usuario, calculamos las similitudes entre este usuario y el resto
                                var users_filter = await User.find({ _id: { $ne: usuario._id }, username: { $ne: "admin" } });
                                obtenerSimilitudes(users_filter, usuario._id);

                                // Recomendación por géneros
                                if(req.body.chips.length > 0) {
                                    recomendacionPorGeneros(usuario);
                                }

                                res.json({ msg: ''});   
                            }
                            else res.json({ msg: 'Las contraseñas no son iguales'});
                        }
                        else res.json({ msg: 'No se ha introducido la contraseña'});
                    }
                    else res.json({ msg: 'Email no introducido'});
                }
                else res.json({ msg: 'Apellidos no introducidos'});
            }
            else res.json({ msg: 'Nombre no introducido'});
        }
        else res.json({ msg: 'Nombre de usuario ya existente'});
    }
    else res.json({ msg: 'Nombre de usuario no introducido'});
});

router.post('/theme/signup', async (req,res) => {
    if(req.body.title.length > 0) { // Compruebo si aparece el título
        if(req.body.description.length > 0) { // Compruebo si aparece la descripción
            // Busco el usuario que ha creado el tema
            var user = req.session.username != undefined ? req.session.username : req.body.username;
            const usuario = await User.findOne({username: user});

            // Creo el tema e inserto los datos
            const tema = new Theme();
            tema.title = req.body.title;
            tema.description = req.body.description;
            tema.user = usuario._id;
            
            if(req.body.isbn == null) tema.book = null;
            else {
                let b = await Book.findOne({ isbn: req.body.isbn });
                tema.book = b._id;
            }

            await tema.save();
                                
            res.json({ msg: ''});                   
        }
        else res.json({ msg: 'Descripción no introducida'});
    }
    else res.json({ msg: 'Título no introducido'});
});

router.post('/comment/signup', async (req,res) => {
    if(req.body.response.length > 0) { // Compruebo si aparece la respuesta
        const tema = await Theme.findById(req.body.temaid);

        // Obtengo objeto usuario
        var usuario = req.session.username != undefined ? req.session.username : req.body.username;
        const user = await User.findOne({ username: usuario });

        if(tema != null && user != null) {
            tema.comments.push({
                description: req.body.response,
                user: user._id
            });

            await tema.save();
                                    
            res.json({ msg: ''}); 
        }
        else res.json({ msg: 'Problema al añadir el tema'});    
    }
    else res.json({ msg: 'Respuesta no introducida'});
});

router.post('/valoration/signup', async (req,res) => {
    if(req.body.description.length > 0) { // Compruebo si aparece la descripción
        if(req.body.note > 0) {
            // Obtengo objeto libro
            var book = await Book.findOne({ isbn: req.body.isbn});

            // Obtengo objeto usuario
            var usuario = req.session.username != undefined ? req.session.username : req.body.username;
            var user = await User.findOne({ username: usuario });

            if(book != null && user != null) {
                var valoration = new Valoration();
                valoration.description = req.body.description;
                valoration.note = req.body.note;
                valoration.book = book._id;
                valoration.user = user._id;

                await valoration.save();

                // Una vez guardada la valoración, recalculamos las similitudes entre este usuario y el resto
                var users_filter = await User.find({ _id: { $ne: user._id }, username: { $ne: "admin" } });
                obtenerSimilitudes(users_filter, user._id);

                // También, actualizamos la polaridad del librp
                var cl_json = await Classifier.findOne({});
                var cl = bayes.fromJson(cl_json.json);

                var sentimiento = cl.categorize(valoration.description);

                if(sentimiento == 'positive') book.polarity++;
                else if(sentimiento == 'negative') book.polarity--;

                await book.save();
                                                    
                res.json({ msg: ''}); 
            }
            else res.json({ msg: 'Problema al añadir la valoración'});   
        }
        else res.json({ msg: 'La nota de la valoración debe estar entre 1 y 5'})
    }
    else res.json({ msg: 'Respuesta no introducida'});
});

router.post('/canvalorate', async (req,res) => {
    // Puede valorar si ha registrado el libro como leído
    var b = await Book.findOne({ isbn: req.body.isbn });
    var usuario = req.session.username != undefined ? req.session.username : req.body.username;
    var user = await User.findOne({ username: usuario, readed_books: {$elemMatch: {_id: b._id}} });
    
    if(user == null) res.json({ canvalorate: false });
    else {
        // Compruebo si el usuario ya ha valorado ese libro
        user = await User.findOne({ username: usuario });
        var val = await Valoration.findOne({ book: b._id, user: user._id });
        
        if(val == null) res.json({ canvalorate: true });
        else res.json({ canvalorate: false });
    }
});

router.post('/valorations', async (req,res) => {
    const array = [];
    var num_valo = [];

    var valorations, numValorations;
    // Distingo para obtener las valoraciones de un libro o de un usuario
    if(req.body.isbn == null) {
        var usuario = req.session.username != undefined ? req.session.username : req.body.username;
        var user = await User.findOne({ username: usuario });
        
        if(req.body.currentPage == undefined) {
            valorations = await Valoration.find({ user: user._id }).sort({ datetime: -1});
    
            // Cuento el número de valoraciones totales
            numValorations = valorations.length;
        }
        else {
            valorations = await Valoration.find({ user: user._id }).sort({ datetime: -1}).skip(parseInt((req.body.currentPage-1)*2)).limit(2);
    
            // Cuento el número de valoraciones totales
            numValorations = await Valoration.find({ user: user._id }).countDocuments();
        }
    }
    else {
        var book = await Book.findOne({isbn: req.body.isbn });
        
        if(req.body.currentPage == undefined) {
            valorations = await Valoration.find({ book: book._id }).sort({ datetime: -1});
    
            // Cuento el número de valoraciones totales
            numValorations = valorations.length;
        }
        else {
            valorations = await Valoration.find({ book: book._id }).sort({ datetime: -1}).skip(parseInt((req.body.currentPage-1)*2)).limit(2);
    
            // Cuento el número de valoraciones totales
            numValorations = await Valoration.find({ book: book._id }).countDocuments();
        }

        for(let i=1;i<=5;i++) num_valo.push(await Valoration.find({ book: book._id, note:i }).countDocuments());
    }

    for(let i in valorations) {
        // Obtengo fecha
        let date = new Date(valorations[i].datetime);
        let minutos = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        let segundos = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();

        // Obtengo usuario
        const user = await User.findById(valorations[i].user);

        // Obtengo libro 
        const book = await Book.findById(valorations[i].book);

        array.push({ 
            id: valorations[i]._id, 
            fecha: date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear(), 
            hora: date.getHours() + ":" + minutos + ":" + segundos,
            note: valorations[i].note,
            description: valorations[i].description,
            user: user.username,
            likes: valorations[i].likes.length,
            dislikes: valorations[i].dislikes.length,
            book: book.title
        });
    }

    res.json({ array: array, countValorations: numValorations, num_valo: num_valo });
});

router.post('/recomendedbooks', async (req,res) => {
    var array = [];

    var usuario = req.session.username != undefined ? req.session.username : req.body.username;
    var user = await User.findOne({ username: usuario }); 

    for(let i in user.recomended_books) {
        var book = await Book.findOne({ _id: user.recomended_books[i]._id});

        if(book != null) {
            array.push({ 
                isbn: book.isbn,
                title: book.title
            });
        }
    }

    res.json({ array: array });
});

router.post('/removerecomendedbook', async (req,res) => {
    var array = [];

    var usuario = req.session.username != undefined ? req.session.username : req.body.username;
    var user = await User.findOne({ username: usuario }); 
    var b = await Book.findOne({ isbn: req.body.isbn });

    let pos;

    for(let i in user.recomended_books) {
        var book = await Book.findOne({ _id: user.recomended_books[i]._id});

        if(book != null) {
            if(b.isbn == book.isbn) pos = i;
            else {
                array.push({ 
                    isbn: book.isbn,
                    title: book.title
                });
            }
        }
    }

    user.recomended_books.splice(pos,1);
    await user.save();

    res.json({ array: array });
});

router.post('/readedbooks', async (req,res) => {
    var array = [];

    var usuario = req.session.username != undefined ? req.session.username : req.body.username;
    var user = await User.findOne({ username: usuario }); 

    for(let i in user.readed_books) {
        var book = await Book.findOne({ _id: user.readed_books[i]._id});

        if(book != null) {
            var valoracion = await Valoration.findOne({ book: book._id, user: user._id });

            array.push({ 
                isbn: book.isbn,
                title: book.title, 
                valorado: valoracion == null ? false : true
            });
        }
    }

    res.json({ array: array });
});

router.post('/pendingbooks', async (req,res) => {
    var array = [];

    var usuario = req.session.username != undefined ? req.session.username : req.body.username;
    var user = await User.findOne({ username: usuario }); 

    for(let i in user.pending_books) {
        var book = await Book.findOne({ _id: user.pending_books[i]._id});

        if(book != null) {
            array.push({ 
                isbn: book.isbn,
                title: book.title
            });
        }
    }

    res.json({ array: array });
});

router.post('/removependingbook', async (req,res) => {
    var array = [];

    var usuario = req.session.username != undefined ? req.session.username : req.body.username;              
    var user = await User.findOne({ username: usuario }); 
    var b = await Book.findOne({ isbn: req.body.isbn });

    let pos;

    for(let i in user.pending_books) {
        var book = await Book.findOne({ _id: user.pending_books[i]._id});

        if(book != null) {
            if(b.isbn == book.isbn) pos = i;
            else {
                array.push({ 
                    isbn: book.isbn,
                    title: book.title
                });
            }
        }
    }

    user.pending_books.splice(pos,1);
    await user.save();

    res.json({ array: array });
});

router.post('/addreadedbook', async (req,res) => {
    var book = await Book.findOne({ isbn: req.body.isbn });
    var usuario = req.session.username != undefined ? req.session.username : req.body.username;
    var user = await User.findOne({ username: usuario, pending_books: {$elemMatch: {_id: book._id}} });

    if(user == null) {
        user = await User.findOne({ username: usuario, readed_books: {$elemMatch: {_id: book._id}} });

        if(user == null) {
            user = await User.findOne({ username: usuario, recomended_books: {$elemMatch: {_id: book._id}} });

            if(user == null) {
                // Añado el libro como pendiente
                user = await User.findOne({ username: usuario });
                user.readed_books.push(book._id);
                await user.save();

                res.json({ msg: '' });
            }
            else res.json({ msg: 'El libro ya está recomendado por el sistema, cambiélo a pendiente'}); 
        }
        else res.json({ msg: 'El libro ya está marcado como leído'});
    }
    else res.json({ msg: 'El libro ya está añadido como pendiente de leer, cambiélo a leído'});
});

router.post('/themes', async (req,res) => {
    const array = [];

    var temas, numthemes;
    if(req.body.book == null) {
        if(req.body.currentPage == undefined) {
            temas = await Theme.find({ book: null }).sort({ datetime: -1});
    
            // Cuento el número de temas totales
            numthemes = temas.length;
        }
        else {
            temas = await Theme.find({ book: null }).sort({ datetime: -1}).skip(parseInt((req.body.currentPage-1)*2)).limit(2);
    
            // Cuento el número de temas totales
            numthemes = await Theme.find({ book: null }).countDocuments();
        }
    }
    else {
        var b = await Book.findOne({ isbn: req.body.book });

        if(req.body.currentPage == undefined) {
            temas = await Theme.find({ book: b._id }).sort({ datetime: -1});
    
            // Cuento el número de temas totales
            numthemes = temas.length;
        }
        else {
            temas = await Theme.find({ book: b._id }).sort({ datetime: -1}).skip(parseInt((req.body.currentPage-1)*2)).limit(2);
    
            // Cuento el número de temas totales
            numthemes = await Theme.find({ book: b._id }).countDocuments();
        }
    }

    for(let i in temas) {
        // Obtengo fecha
        let date = new Date(temas[i].datetime);
        let minutos = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        let segundos = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();

        // Obtengo usuario
        const user = await User.findById(temas[i].user);

        // Obtengo comentarios del tema
        let comentarios = [];

        if(temas[i].comments.length > 0) {
            for(let j in temas[i].comments) {
                if(j != '_parent') { // Me sale los detalles del tema que es el padre de los comentarios
                    // Obtengo fecha
                    let date = new Date(temas[i].comments[j].datetime);
                    let minutos = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
                    let segundos = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();

                    // Obtengo usuario
                    const user_c = await User.findById(temas[i].comments[j].user);

                    if(user_c != null) {
                        comentarios.push({
                            description: temas[i].comments[j].description,
                            fecha: date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear(), 
                            hora: date.getHours() + ":" + minutos + ":" + segundos,
                            user: user_c.username
                        });
                    }
                }
            }
        }

        array.push({ 
            id: temas[i]._id, 
            fecha: date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear(), 
            hora: date.getHours() + ":" + minutos + ":" + segundos,
            title: temas[i].title,
            description: temas[i].description,
            user: user.username,
            comments: comentarios,
            comments_mostrados: [],
            paginatema: 1
        });
    }

    res.json({ array: array, countThemes: numthemes });
});

router.post('/newpendingbook', async (req,res) => {
    var book = await Book.findOne({ isbn: req.body.isbn });
    var usuario = req.session.username != undefined ? req.session.username : req.body.username;
    var user = await User.findOne({ username: usuario, pending_books: {$elemMatch: {_id: book._id}} });

    if(user == null) {
        user = await User.findOne({ username: usuario, readed_books: {$elemMatch: {_id: book._id}} });

        if(user == null) {
            user = await User.findOne({ username: usuario, recomended_books: {$elemMatch: {_id: book._id}} });

            if(user == null) {
                // Añado el libro como pendiente
                user = await User.findOne({ username: usuario });
                user.pending_books.push(book._id);
                await user.save();

                res.json({ msg: '' });
            }
            else res.json({ msg: 'El libro ya está recomendado por el sistema, cambiélo a pendiente'}); 
        }
        else res.json({ msg: 'El libro ya está marcado como leído'});
    }
    else res.json({ msg: 'El libro ya está añadido como pendiente de leer'});
});

router.post('/givelike', async (req,res) => {
    // Compruebo si el usuario actual no es el mismo que ha hecho la valoración
    var val = await Valoration.findOne({ _id: req.body.valorationid }); 
    var user = await User.findOne({ _id: val.user });

    var usuario = req.session.username != undefined ? req.session.username : req.body.username;
                    
    if(user.username == usuario) {
        if(req.body.like) res.json({ msg: 'Un usuario no puede darle a \'Me gusta\' a una valoración creada por él/ella.'});
        else res.json({ msg: 'Un usuario no puede darle a \'No me gusta\' a una valoración creada por él/ella.'});
    }
    else {
        // Compruebo que el usuario no le haya dado a like o dislike a esta valoración
        user = await User.findOne({ username: usuario });

        var valo;
        if(req.body.like) valo = await Valoration.findOne({ _id: req.body.valorationid, likes: {$elemMatch: { _id: user._id}} });
        else valo = await Valoration.findOne({ _id: req.body.valorationid, dislikes: {$elemMatch: { _id: user._id}} });

        if(valo == null) {
            // Añado el like o dislike 
            if(req.body.like) val.likes.push(user._id);
            else val.dislikes.push(user._id);

            await val.save();

            res.json({ msg: '' });
        }
        else {
            if(req.body.like) res.json({ msg: 'Ya le ha dado a \'Me gusta\' esta valoración' });
            else res.json({ msg: 'Ya le ha dado a \'No me gusta\' esta valoración' });
        }
    }
});

router.get('/genrelist', async (req,res) => {
    const lista = await Genre.find();
    res.json(lista);
});

router.post('/rememberpassword', async (req,res) => {
    var user = await User.findOne({ $or : [ {username: req.body.username}, {email: req.body.username} ] });
    if(user == null) res.json({ msg: 'El nombre de usuario introducido no se ha encontrado'});
    else {
        // Genero contraseña temporal
        var caracteres = "abcdefghijkmnpqrtuvwxyzABCDEFGHIJKLMNPQRTUVWXYZ012346789";
        var temp_pass = "";
        for (let i=0; i<9; i++) temp_pass += caracteres.charAt(Math.floor(Math.random()*caracteres.length));

        // Envio email
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com", 
            auth: {
              user: 'bookrecommender0@gmail.com', 
              pass: 'QdYJDYCcUe' 
            }
        });
        
        let mailOptions = {
            from: '"Book Recommender" <bookrecommender0@gmail.com>', 
            to: user.email, 
            subject: "Solicitud recordatorio contraseña", 
            text: "La contraseña temporal que se le ha asignado es: " + temp_pass + "\nSe le aconseja que vaya a su perfil y cambie la contraseña.\nUn saludo, el equipo de BookRecommender.", 
        };

        await transporter.sendMail(mailOptions, async (err,data) => {
	    console.log(err);
	    console.log(data);
            if(err) res.json({ msg: 'Hubo un problema al enviar el mensaje, si persiste este problema, contacte con el administrador'});
            else {
                // Cambio la contraseña del usuario
                user.password = crypto.createHmac('sha1', user.username).update(temp_pass).digest('hex');
                await user.save();

                res.json({ msg: '', email: user.email});
            }
        });

    }
});

router.post('/suggestion/signup', async (req,res) => {
    if(req.body.description.length > 0) {
        var sug = new Suggestion();
        sug.description = req.body.description;

        if(req.body.username.length > 0) {
            var user = await User.findOne({ username: req.body.username });
            
            if(user != null) sug.user = user._id;
        }
        
        // Guardo la sugerencia
        await sug.save();

        res.json({ msg: '' });
    }
    else res.json({ msg: 'Descripción no introducida'});
});

router.post('/suggestions', async (req,res) => {
    var array = [];

    var user = await User.findOne({ username: "admin" });
    
    var suggestions;
    if(req.body.currentPage == undefined) suggestions = await Suggestion.find({ user: { $not: { $eq: user._id } } });
    else suggestions = await Suggestion.find({ user: { $not: { $eq: user._id } } }).skip(parseInt((req.body.currentPage-1)*2)).limit(2);
   
    // Cuento el número de valoraciones totales
    var numSuggestions = await Suggestion.find().countDocuments({ user: { $not: { $eq: user._id } } });

    for(let i in suggestions) {
        // Obtengo usuario
        let user = await User.findById(suggestions[i].user);

        array.push({ 
            id: suggestions[i]._id, 
            description: suggestions[i].description,
            user: user == null ? "Anónimo" : user.username
        });
    }

    res.json({ array: array, countSuggestions: numSuggestions });
});

router.post('/removesuggestion', async (req,res) => {
    var suggestion = await Suggestion.findByIdAndDelete(req.body.id);
   
    if(suggestion == null) res.json({ msg: 'No se ha podido encontrar la sugerencia por lo que se no ha podido eliminar' });
    else res.json({ msg: ''});
});

router.get('/books', async (req,res) => {
    var array = [];

    var libros = await Book.find(); 

    for(let i in libros) {
        array.push({ 
            isbn: libros[i].isbn,
            title: libros[i].title, 
        });
    }

    res.json({ array: array });
});

router.post('/removebook', async (req,res) => {
    var array = [];

    // Elimino libro
    var b = await Book.findOneAndDelete({ isbn: req.body.isbn });

    // Si algún usuario tiene ese libro como pendiente, leído o recomendado, lo elimino
    var users = await User.find({ pending_books: {$elemMatch: { _id: b._id}} });

    for(let i in users) 
        for(let j in users[i].pending_books) 
            if(b._id.equals(users[i].pending_books[j]._id)) {
                await users[i].pending_books.splice(j,1);
                await users[i].save();
                break;
            }
    
    users = await User.find({ readed_books: {$elemMatch: { _id: b._id}} });

    for(let i in users) 
        for(let j in users[i].readed_books) 
            if(b._id.equals(users[i].readed_books[j]._id)) {
                await users[i].readed_books.splice(j,1);
                await users[i].save();
                break;
            }

    users = await User.find({ recommended_books: {$elemMatch: { _id: b._id}} });

    for(let i in users) 
        for(let j in users[i].recommended_books) 
            if(b._id.equals(users[i].recommended_books[j]._id)) {
                await users[i].recommended_books.splice(j,1);
                await users[i].save();
                break;
            }

    // Elimino los temas de ese libro
    await Theme.deleteMany({ book: b._id });

    // Elimino las valoraciones de ese libro
    await Valoration.deleteMany({ book: b._id });

    var books = await Book.find();

    for(let i in books) {
        array.push({
            isbn: books[i].isbn,
            title: books[i].title
        });
    }

    res.json({ array: array });
});

router.post('/removegenre', async (req,res) => {
    // Elimino género
    var g = await Genre.findOneAndDelete({ name: req.body.name });

    // Si algún usuario tiene ese género como favorito, se elimina de su lista
    var users = await User.find({ favouritesgenres: {$elemMatch: { _id: g._id}} });

    for(let i in users) 
        for(let j in users[i].favouritesgenres) 
            if(g._id.equals(users[i].favouritesgenres[j]._id)) {
                await users[i].favouritesgenres.splice(j,1);
                await users[i].save();
                break;
            }
    
    // Si ese género pertenece a algún libro se elimina de su lista
    var books = await Book.find({ genres: {$elemMatch: { _id: g._id}} });

    for(let i in books) 
        for(let j in books[i].genres) 
            if(g._id.equals(books[i].genres[j]._id)) {
                await books[i].genres.splice(j,1);
                await books[i].save();
                break;
            }

    // Obtengo los géneros no eliminados
    genres = await Genre.find();

    res.json(genres);
});

router.get('/news', async (req,res) => {
    var array = [];

    var user = await User.findOne({ username: "admin" });
    var suggestions = await Suggestion.find({ user: user._id });
   
    // Cuento el número de valoraciones totales
    var numSuggestions = await Suggestion.find({ user: user._id }).countDocuments();

    for(let i in suggestions) {
        // Obtengo usuario
        let user = await User.findById(suggestions[i].user);

        array.push({ 
            id: suggestions[i]._id, 
            description: suggestions[i].description
        });
    }

    res.json({ array: array.reverse(), countSuggestions: numSuggestions });
});

router.post('/removenews', async (req,res) => {
    var suggestion = await Suggestion.findByIdAndDelete(req.body.id);
   
    if(suggestion == null) res.json({ msg: 'No se ha podido encontrar la sugerencia por lo que se no ha podido eliminar' });
    else {
        var array = [];

        var user = await User.findOne({ username: "admin" });
        var suggestions = await Suggestion.find({ user: user._id });
    
        // Cuento el número de valoraciones totales
        var numSuggestions = await Suggestion.find({ user: user._id }).countDocuments();

        for(let i in suggestions) {
            // Obtengo usuario
            let user = await User.findById(suggestions[i].user);

            array.push({ 
                id: suggestions[i]._id, 
                description: suggestions[i].description
            });
        }

        res.json({ msg: '', array: array.reverse(), countSuggestions: numSuggestions });
    }
});

router.post('/dorecommendation', async (req,res) => {
    // Obtengo id del usuario
    var usuario = req.session.username != undefined ? req.session.username : req.body.username;
    var user = await User.findOne({ username: usuario });

    // Tipo de recomendación
    switch(req.body.option) {
        case 1: // Filtrado colaborativo
            // Obtengo y ordeno las similitudes
            var similitudes = await Similarity.find({ $or: [ { user1: user._id }, { user2: user._id } ] });

            // Ordenar similitudes
            similitudes.sort(function (a,b) { 
                return b.sim - a.sim; 
            });

            // Obtenemos los k vecinos más similares (k=3)
            var vecinos = similitudes.slice(0,3);

            // Obtengo títulos recomendados
            var libros = await obtenerLibrosRecomendados(user._id, vecinos);

            devolverRecomendacion(user, libros, res);
            
            break;
        case 2: // Recomendación por géneros
            recomendacionPorGeneros(user, res);

            break;
        case 3: // Análisis de sentimientos
            // Obtengo libros recomendados
            var libros = [];

            client.search('q=*:*&sort=polarity desc&rows=30', async function(err, result) {
                if(err) {
                    console.log(err);
                    res.json({ msg: 'Problema al hacer la recomendación' });
                    return;
                }

                for(let i in result.response.docs) {
                    libros.push(result.response.docs[i].id);
                }

                // Devuelvo los libros recomendados del usuario
                var array = [];

                devolverRecomendacion(user, libros, res);
            });

            break;
        default: // Análisis de sentimientos teniendo en cuenta las preferencias del usuario
            // Obtengo libros recomendados
            var libros = [];

            // Preparo consulta
            var consulta = 'q=genres: ( ';
            for(let i in user.favouritesgenres) {
                let genre = await Genre.findOne({ _id: user.favouritesgenres[i]._id });
                if(genre != null) consulta += ('\"' + genre.name + '\" '); 
            }
        
            consulta += ')&sort=polarity desc&rows=30';

            client.search(consulta, async function(err, result) {
                if(err) {
                    console.log(err);
                    res.json({ msg: 'Problema al hacer la recomendación' });
                    return;
                }

                for(let i in result.response.docs) {
                    libros.push(result.response.docs[i].id);
                }

                // Devuelvo los libros recomendados del usuario
                var array = [];

                devolverRecomendacion(user, libros, res);
            });

            break;
    }
});

router.post('/dosearch', async (req,res) => {
    var search_text = req.body.text;

    if(search_text.length > 0) {
        var libros = [];

        // Filtro los acentos de la consulta, debido a un problema con la petición
        search_text = filtrarAcentos(search_text);

        var consulta = 'q=isbn:(' + search_text + ') OR isbn13:('  + search_text 
                        + ') OR title:(' + search_text + ') OR authors:(' + search_text 
                        + ') OR publisher:(' + search_text + ') OR genres:(' + search_text
                        + ') OR language:(' + search_text + ')';

        client.search(consulta, async function(err, result) {
            if(err) {
                console.log(err);
                var books = await Book.find({}, { title: 1, isbn: 1 });

                // Como máximo devuelvo 10 libros
                let cont = 0;
                for(let i=0;i<books.length;i++) {
                    if(books[i].title.toLowerCase().includes(search_text.toLowerCase())) {
                        libros.push({ label: books[i].title, value: books[i].isbn });
                        cont++;
                        if(cont == 10) break;
                    }
                }
            }
            else {
                for(let i in result.response.docs) {
                    libros.push({ label: result.response.docs[i].title, value: result.response.docs[i].isbn });
                }
            }

            res.json({ msg: '', libros: libros });
        });
    }
    else res.json({ msg: 'No se ha introducido un texto de búsqueda'});
});

module.exports = router;
