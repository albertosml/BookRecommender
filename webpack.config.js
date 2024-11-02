module.exports = {
    entry: {
        inicio: './src/app/index.js',
        detalles: './src/app/details.js',
        perfil: './src/app/profile.js',
        nuevo_usuario: './src/app/new_user.js',
        iniciar_sesion: './src/app/start_session.js',
        nuevo_libro: './src/app/new_book.js',
        modificar_libro: './src/app/edit_book.js',
        mis_valoraciones: './src/app/my_valorations.js',
        mis_libros_pendientes: './src/app/my_pending_books.js',
        mis_libros_leidos: './src/app/my_readed_books.js',
        mis_libros_recomendados: './src/app/my_recommended_books.js',
        detalles_libro: './src/app/book_details.js',
        nueva_sugerencia: './src/app/new_suggestion.js',
        sugerencias: './src/app/suggestions.js',
        libros: './src/app/books.js',
        generos: './src/app/genres.js',
        temas_libres: './src/app/free_themes.js'
    },
    output: {
        path: __dirname + '/src/public',
        filename: '[name].js' 
    },
    module: {
        rules: [
            {
                use: 'babel-loader',
                test: /\.js/,
                exclude: /node_modules/
            }
        ]
    }
};