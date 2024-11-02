import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

import StarRatings from 'react-star-ratings';
import Pagination from 'react-js-pagination';
import ReactTooltip from 'react-tooltip';
import Chart from "react-google-charts";

class BookDetails extends Component {
    constructor() {
        super();
        this.state = {
            rating: 0,
            isbn: '',
            isbn13: '',
            isbn10: '',
            titulo: '',
            author: '',
            url: '',
            numpages: 0,
            publicationdate: '',
            publisher: '',
            language: '',
            genres: [],
            type: '',
            username: '',
            valoraciones: [],
            activePageValoration: 1,
            num_total_valoraciones: 0,
            puede_valorar: false,
            title: '',
            description: '',
            response: '',
            temas: [],
            activePageTheme: 1,
            num_total_temas: 1,
            media: 0,
            datos_val: [],
            image: null
        };

        // Funciones .bind si tienen que leer algo de state
        this.handleChange = this.handleChange.bind(this);
        this.addValoration = this.addValoration.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.addLike = this.addLike.bind(this);
        this.addDislike = this.addDislike.bind(this);
        this.addPendingBook = this.addPendingBook.bind(this);
        this.addReadedBook = this.addReadedBook.bind(this);
        this.addTheme = this.addTheme.bind(this);
        this.addComment = this.addComment.bind(this);
        this.handlePageThemeChange = this.handlePageThemeChange.bind(this);
    }

    componentWillMount() {
        fetch('/book/data',{
            method: 'POST',
            body: JSON.stringify({ isbn: window.location.search.split("=")[1] }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => { 
                if(data.data == undefined) location.href = '/index.html';

                if(data.data[0].publicationdate == undefined) this.setState({ publicationdate: "" });
                else if(data.data[0].publicationdate.includes("T")) this.setState({ publicationdate: data.data[0].publicationdate.split("T")[0] });
                else this.setState({ publicationdate: data.data[0].publicationdate }); 

                this.setState({
                    titulo: data.data[0].title,
                    isbn: data.data[0].isbn,
                    isbn10: data.data[0].isbn.length == 10 ? data.data[0].isbn : "No encontrado",
                    isbn13: data.data[0].isbn.length == 13 ? data.data[0].isbn : (data.data[0].isbn13 != undefined ? data.data[0].isbn13 : "No encontrado"),
                    author: data.data[0].authors,
                    numpages: data.data[0].numpages,
                    genres: data.genres,
                    type: data.data[0].type,
                    url: data.data[0].url,
                    publisher: data.data[0].publisher == undefined ? "" : data.data[0].publisher,
                    language: data.data[0].language,
                    image: data.data[0].image
                });
            })  
        .catch(err => console.log(err));

        fetch('/user',{
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) this.setState({username: data.username });
                this.getValorations();
                this.getThemes();
            })
            .catch(err => console.log(err));

        fetch('/canvalorate',{
            method: 'POST',
            body: JSON.stringify({ isbn: window.location.search.split("=")[1] }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ puede_valorar: data.canvalorate });
            })
            .catch(err => console.log(err));
    }

    changeRating(newRating) {
        this.setState({
          rating: newRating
        });
    }

    handleChange(e) {
        const { name, value } = e.target;
        this.setState({ [name] : value });
    }

    handlePageChange(pageNumber) {
        this.setState({ activePageValoration: pageNumber });
        this.getValorations(pageNumber);
    }

    addPendingBook() {
        fetch('/newpendingbook',{
            method: 'POST',
            body: JSON.stringify({ isbn: this.state.isbn }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) M.toast({html: 'Libro añadido como pendiente de leer'});
                else M.toast({html: data.msg});
            })
            .catch(err => console.log(err));
    }

    addReadedBook() {
        fetch('/addreadedbook',{
            method: 'POST',
            body: JSON.stringify({ isbn: this.state.isbn }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) {
                    M.toast({html: 'Libro añadido como leído'});

                    // Espera a la redirección para que se vea el mensaje de arriba
                    setTimeout(() => location.href = '/book_details.html?isbn=' + this.state.isbn, 1000);
                }
                else M.toast({html: data.msg});
            })
            .catch(err => console.log(err));
    }

    addValoration(e) {
        e.preventDefault();

        fetch('/valoration/signup',{
            method: 'POST',
            body: JSON.stringify({ description: this.state.description, note: this.state.rating, isbn: this.state.isbn }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) {
                    M.toast({html: 'Valoración añadida'});
                    this.setState({
                        description: '',
                        rating: 0,
                        puede_valorar: false
                    });
                    this.getValorations();
                }
                else M.toast({html: data.msg});
            })
            .catch(err => console.log(err));
    }

    getValorations(pageNumber = this.state.activePageValoration){
        fetch('/valorations',{
            method: 'POST',
            body: JSON.stringify({ username: null, isbn: window.location.search.split("=")[1], currentPage: pageNumber }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.countValorations > 0) {
                    // Media
                    var m = 0;

                    // Datos de las valoraciones
                    var datos = [ ['Nota', 'Número de valoraciones'] ];

                    for(let i=1;i<=5;i++) {
                        m += data.num_valo[i-1] * i;
                        datos.push([i.toString(), data.num_valo[i-1]]);
                    }

                    this.setState({ valoraciones: data.array, num_total_valoraciones: data.countValorations, media: Math.round((m/data.countValorations)*100)/100, datos_val:datos });
                }
                else this.setState({ valoraciones: data.array, num_total_valoraciones: data.countValorations });
            })
            .catch(err => console.log(err));
    }

    addLike(id) {
        fetch('/givelike',{
            method: 'POST',
            body: JSON.stringify({ like: true, valorationid: id }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) {
                    M.toast({html: 'Le ha dado a \'Me gusta\' esta valoración'});
                    this.getValorations();
                }
                else M.toast({html: data.msg});
            })
            .catch(err => console.log(err));
    }

    addDislike(id) {
        fetch('/givelike',{
            method: 'POST',
            body: JSON.stringify({ like: false, valorationid: id }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) {
                    M.toast({html: 'Le ha dado a \'No Me gusta\' esta valoración'});
                    this.getValorations();
                }
                else M.toast({html: data.msg});
            })
            .catch(err => console.log(err));
    }

    handlePageThemeChange(pageNumber) {
        this.setState({ activePageTheme: pageNumber });
        this.getThemes(pageNumber);
    }

    getThemes(pageNumber = this.state.activePageTheme){
        fetch('/themes',{
            method: 'POST',
            body: JSON.stringify({ currentPage: pageNumber, book: window.location.search.split("=")[1] }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ temas: data.array, num_total_temas: data.countThemes  });
            })
            .catch(err => console.log(err));
    }

    addTheme(e){
        e.preventDefault();

        fetch('/theme/signup',{
            method: 'POST',
            body: JSON.stringify({ title: this.state.title, description: this.state.description, isbn: this.state.isbn }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) {
                    M.toast({html: 'Tema Creado'});
                    this.setState({
                        title: '',
                        description: ''
                    });
                    this.getThemes();
                }
                else M.toast({html: data.msg});
            })
            .catch(err => console.log(err));
    }

    addComment(e) {
        e.preventDefault();

        fetch('/comment/signup',{
            method: 'POST',
            body: JSON.stringify({ temaid: e.target.temaId.value, response: this.state.response}),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) {
                    M.toast({html: 'Comentario Realizado'});
                    this.setState({
                        response: ''
                    });
                    this.getThemes();
                }
                else M.toast({html: data.msg});
            })
            .catch(err => console.log(err));
    }

    render() {
        return (
            <div>
                <Menu/>
                
                <div id="normal" className="row" style={{marginTop:'2%'}}>
                    <div className="col s4 offset-s2">
                        <img style={{width:'100px', height:'150px'}} src={this.state.image} alt="No hay imagen" />    
                    </div>

                    <div className="col s6">
                        <h3>
                            {this.state.titulo}
                            &nbsp;
                            {(() => {
                                if(this.state.username != "admin") {
                                    return (
                                        <a href={"book_edit.html?isbn=" + this.state.isbn} className="tooltipped" data-position="right" data-delay="50" data-tooltip="Modificar Libro"><i className="material-icons">book</i></a> 
                                    )
                                }
                            })()}
                        </h3>

                        {(() => {
                            if(this.state.username.length > 0 && this.state.username != "admin") {
                                return (
                                    <div className="row">
                                        <button onClick={this.addPendingBook} className="btn waves-effect waves-light" type="submit">Agregar a Pendientes</button> 
                                        &nbsp; &nbsp; &nbsp;
                                        <button onClick={this.addReadedBook} className="btn waves-effect waves-light" type="submit">Agregar a Leídos</button>  
                                    </div>
                                )
                            }
                        })()}
                       
                        <div className="row">
                            <button className="btn waves-effect waves-light" onClick={() => alert(" - ISBN-10: " + this.state.isbn10 + "\n - ISBN-13: " + this.state.isbn13 + "\n - Autores: " + this.state.author + "\n - Número de páginas: " + this.state.numpages + "\n - Fecha de publicación: " + this.state.publicationdate + "\n - URL: " + this.state.url + "\n - Editorial: " + this.state.publisher + "\n - Idioma: " + this.state.language + "\n - Géneros: " + this.state.genres)} type="submit" id="buttonDetalles">Datos del libro</button>
                            &nbsp; &nbsp; &nbsp;
                            <a className="btn waves-effect waves-light" href={this.state.url}>Ver más detalles del libro</a>
                        </div>
                    </div>
                </div>

                <div id="responsive" className="row" style={{marginTop:'2%'}}>
                    <div className="row">
                        <h4 className="center-align">
                            {this.state.titulo}
                            &nbsp;
                            {(() => {
                                if(this.state.username != "admin") {
                                    return (
                                        <a href={"book_edit.html?isbn=" + this.state.isbn} className="tooltipped" data-position="right" data-delay="50" data-tooltip="Modificar Libro"><i className="material-icons">book</i></a> 
                                    )
                                }
                            })()} 
                        </h4>
                    </div>
                        <div className="row center-align">
                            <img style={{width:'100px', height:'150px'}} src={this.state.image} alt="No hay imagen" />    
                        </div>    

                        {(() => {
                            if(this.state.username.length > 0 && this.state.username != "admin") {
                                return (
                                    <div>
                                        <div className="row center-align">
                                            <button onClick={this.addPendingBook} className="btn waves-effect waves-light" type="submit">Agregar a Pendientes</button>  
                                        </div>

                                        <div className="row center-align">
                                            <button onClick={this.addReadedBook} className="btn waves-effect waves-light" type="submit">Agregar a Leídos</button>  
                                        </div>
                                    </div>
                                )
                            }
                        })()}

                        <div className="row center-align">
                            <button className="btn waves-effect waves-light" onClick={() => alert(" - ISBN-10: " + this.state.isbn10 + "\n - ISBN-13: " + this.state.isbn13 + "\n - Autores: " + this.state.author + "\n - Número de páginas: " + this.state.numpages + "\n - Fecha de publicación: " + this.state.publicationdate + "\n - URL: " + this.state.url + "\n - Editorial: " + this.state.publisher + "\n - Idioma: " + this.state.language + "\n - Géneros: " + this.state.genres)} type="submit" id="buttonDetalles">Datos del libro</button>
                        </div>

                        <div className="row center-align">
                            <a className="btn waves-effect waves-light" href={this.state.url}>Ver más detalles del libro</a>
                        </div>
                </div>

                <div className="row">
                    <div className="col s8">
                        <ul className="tabs">
                            <li className="tab col s5 offset-s2"><a className="active green-text" href="#valoraciones">Valoraciones</a></li>
                            <li className="tab col s5"><a className="green-text" href="#comentarios">Comentarios</a></li>
                        </ul>
                    </div>
                    <div id="comentarios" className="col s10 offset-s1 green" style={{marginTop:"1%"}}>
                        <div className="row">
                            {
                                this.state.temas.map(tema => {
                                    return (
                                        <details className="col s8 offset-s2 card orange lighten-2" key={tema.id}>
                                            <summary className="card-content white-text">{tema.title}</summary>

                                            {(() => {
                                                if(tema.paginatema == 1) {
                                                    tema.comments_mostrados = tema.comments.slice(0,1);

                                                    return (
                                                        <div>
                                                            <p>&nbsp; &nbsp; &nbsp; &nbsp;<strong>{tema.user} abrió el tema el día {tema.fecha} a las {tema.hora}:</strong></p> 
                                                            <div className="row">
                                                                <p className="col s10 offset-m1">&nbsp; &nbsp; &nbsp; &nbsp; {tema.description}</p>
                                                            </div>
                                                        </div>   
                                                    );
                                                }
                                            })()}

                                            {
                                                tema.comments_mostrados.map(comment => {
                                                    return ( 
                                                        <div key={comment.fecha + comment.hora}>
                                                            <p>&nbsp; &nbsp; &nbsp; &nbsp;<strong>{comment.user} respondió al tema el día {comment.fecha} a las {comment.hora}:</strong></p> 
                                                            <div className="row">
                                                                <p className="col s10 offset-m1">&nbsp; &nbsp; &nbsp; &nbsp; {comment.description}</p>
                                                            </div>
                                                        </div>       
                                                    )
                                                })
                                            }

                                            <div className="row center-align">
                                                <Pagination
                                                    activePage={tema.paginatema}
                                                    itemsCountPerPage={2}
                                                    totalItemsCount={tema.comments.length+1}
                                                    pageRangeDisplayed={((tema.comments.length+1) / 2) +1}
                                                    onChange={(pageNumber) => {
                                                        tema.paginatema = pageNumber;
                                                        let item = (tema.paginatema-1)*2;
                                                        if(tema.paginatema == 1) tema.comments_mostrados = tema.comments.slice(0,1);
                                                        else tema.comments_mostrados = tema.comments.slice(item-1, item+1);
                                                        this.forceUpdate();
                                                    }}
                                                />
                                            </div>

                                            {(() => {
                                                if(this.state.username.length > 0 && this.state.username != "admin") {
                                                    return (
                                                        <div className="col s10 offset-s1 card light-green lighten-3">
                                                            <p className="center"><strong>Comentario</strong></p>
                                                            <form onSubmit={this.addComment}>
                                                                <div className="row">
                                                                    <div className="input-field col s12">
                                                                        <label className="active" htmlFor="response">Respuesta</label> 
                                                                        <textarea name="response" className="materialize-textarea" placeholder={" "} value={this.state.response} onChange={this.handleChange} rows="3" cols="50"></textarea> 
                                                                    </div>
                                                                </div>

                                                                <input type="hidden" name="temaId" value={tema.id} />
                                                                    
                                                                <button style={{marginBottom: '4%', color: 'black'}} className="btn waves-effect waves-light light-green lighten-4" type="submit">
                                                                    Comentar
                                                                </button>
                                                            </form>
                                                        </div>
                                                    );
                                                }
                                            })()}                               
                                        </details>
                                    )
                                })
                            }
                        </div>

                        {(() => {
                            if(this.state.temas.length > 0) {
                                return (
                                    <div className="row center-align">
                                        <Pagination
                                            activePage={this.state.activePageTheme}
                                            itemsCountPerPage={2}
                                            totalItemsCount={this.state.num_total_temas}
                                            pageRangeDisplayed={(this.state.num_total_temas / 2) +1}
                                            onChange={this.handlePageThemeChange}
                                        />
                                    </div>
                                )
                            }
                            else return <h3 className="row white-text center-align">No hay comentarios para este libro</h3>
                        })()}

                        {(() => {
                            if(this.state.username.length > 0 && this.state.username != "admin") {
                                return (
                                    <div className="row">
                                        <div className="col s8 offset-s2 card light-green lighten-3">
                                            <p className="center"><strong>Nuevo Tema</strong></p>
                                            <form onSubmit={this.addTheme}>
                                                <div className="row">
                                                    <div className="input-field col s12">
                                                        <label className="active" htmlFor="title">Título</label>
                                                        <input type="text" name="title" placeholder={" "} className="materialize-textarea" value={this.state.title} onChange={this.handleChange}/> 
                                                    </div>
                                                </div>

                                                <div className="row">
                                                    <div className="input-field col s12">
                                                        <label className="active" htmlFor="description">Descripción</label> 
                                                        <textarea name="description" placeholder={" "} className="materialize-textarea" value={this.state.description} onChange={this.handleChange} rows="3" cols="50"></textarea> 
                                                    </div>
                                                </div>

                                                <button style={{marginBottom: '4%', color: 'black'}} className="btn waves-effect waves-light light-green lighten-4" type="submit">
                                                    Crear
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )
                            }
                        })()}

                    </div>
                    <div id="valoraciones" className="col s10 offset-s1 green"  style={{marginTop:"1%"}}>
                        
                        {(() => {
                            if(this.state.media > 0) {
                                return (
                                    <Chart style={{margin:'2% auto'}} chartType="Bar" data={this.state.datos_val}
                                           options={{ chart: { title: 'Valoraciones libro: ' + this.state.titulo, subtitle: 'Nota media de las valoraciones: ' + 
                                           this.state.media } }} />
                                )
                            }
                        })()}

                        <p className="white-text center-align">IMPORTANTE: Un libro solo se podrá valorar si se ha registrado como leído.</p>

                        {
                            this.state.valoraciones.map((valoracion) => {
                                return (
                                    <div className="row">
                                        <div className="col s8 offset-s2 card orange lighten-2" style={{marginTop:"2%"}}>
                                            <p className="white-text center-align">{this.state.titulo}</p>

                                            <p>&nbsp; &nbsp; &nbsp; &nbsp;<strong>{valoracion.user} realizó esta valoración el día {valoracion.fecha} a las {valoracion.hora}:</strong></p> 
                                            
                                            <div className="row">
                                                <p className="col s10 offset-m1">&nbsp; &nbsp; &nbsp; &nbsp; {valoracion.description}</p>
                                            </div>

                                            <p>&nbsp; &nbsp; &nbsp; &nbsp;<strong>Nota:</strong> &nbsp; <StarRatings rating={valoracion.note} starRatedColor="yellow" starDimension="20px" starSpacing="5px"/></p>

                                            {(() => {
                                                if(this.state.username.length > 0 && this.state.username != "admin") {
                                                    return (
                                                        <div>
                                                            <a style={{color: 'black'}} onClick={() => this.addLike(valoracion.id)} data-tip="De 'Me gusta' a esta valoración" className="left btn waves-effect waves-light light-green lighten-4">
                                                                <i className="material-icons">thumb_up</i>
                                                            </a>
                                                            <ReactTooltip place="left" type="dark" effect="solid"/>
                                                            &nbsp; &nbsp; &nbsp;
                                                            <a style={{color: 'black'}} onClick={() => this.addDislike(valoracion.id)} data-tip="De 'No me gusta' a esta valoración" className="btn waves-effect waves-light light-green lighten-4">
                                                                <i className="material-icons">thumb_down</i>
                                                            </a>
                                                        </div>
                                                    )
                                                }
                                            })()}
                                            
                                            <p className="right">&nbsp; &nbsp; &nbsp; &nbsp; <i className="material-icons">thumb_up</i> {valoracion.likes} &nbsp; &nbsp; <i className="material-icons">thumb_down</i> {valoracion.dislikes}</p>
                                        </div>
                                    </div>
                                )
                            })
                        } 

                        {(() => {
                            if(this.state.valoraciones.length > 0) {
                                return (
                                    <div className="row center-align">
                                        <Pagination
                                            activePage={this.state.activePageValoration}
                                            itemsCountPerPage={2}
                                            totalItemsCount={this.state.num_total_valoraciones}
                                            pageRangeDisplayed={(this.state.num_total_valoraciones / 2) +1}
                                            onChange={this.handlePageChange}
                                        />
                                    </div>
                                )
                            }
                            else return <h3 className="row white-text center-align">No hay valoraciones para este libro</h3>
                        })()}
                            
                        {(() => {
                            if(this.state.username.length > 0 && this.state.puede_valorar && this.state.username != "admin") {
                                return (
                                    <div className="col s8 offset-s2 card light-green lighten-3">
                                        <p className="center"><strong>Valoración</strong></p>
                                        <form onSubmit={this.addValoration}>
                                            <div className="row">
                                                <div className="input-field col s12">
                                                    <label className="active" htmlFor="description">Descripción</label> 
                                                    <textarea name="description" placeholder={" "} className="materialize-textarea" value={this.state.description} onChange={this.handleChange} rows="3" cols="50"></textarea> 
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="input-field col s12">
                                                    <label htmlFor="note">Nota</label> 
                                                </div>
                                                &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                                <StarRatings rating={this.state.rating} starRatedColor="yellow" starDimension="20px" starSpacing="5px" 
                                                changeRating={(rating) => this.changeRating(rating)} starEmptyColor="black" starHoverColor="yellow" numberOfStars={5} name='rating' />
                                            </div>

                                            <button style={{marginBottom: '4%', color: 'black'}} className="btn waves-effect waves-light light-green lighten-4" type="submit">
                                                Valorar
                                            </button>
                                        </form>
                                    </div>
                                )
                            }   
                        })()}
                    </div>
                </div>
        
                <Footer/>
            </div>
        )
    }
}

render(<BookDetails/>, document.getElementById('base'));
