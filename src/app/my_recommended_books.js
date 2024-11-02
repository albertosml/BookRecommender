import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

import ReactTooltip from 'react-tooltip';
import Pagination from 'react-js-pagination';

class RecommendedBooks extends Component {
    constructor (props, context) {
        super(props, context);
        this.state = {
            username: '',
            recBooks: [],
            recBooks_mostrados: [],
            activePage: 1,
            option: 1
        };

        this.handlePageChange = this.handlePageChange.bind(this);
        this.requestRecommendation = this.requestRecommendation.bind(this);
    }

    componentWillMount() {
        fetch('/user',{
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) {
                    this.setState({username: data.username });
                }
                else location.href = "/index.html"
            })
            .catch(err => console.log(err));

        fetch('/recomendedbooks',{
            method: 'POST',
            body: JSON.stringify({ user: this.state.username }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ recBooks: data.array });
                this.setState({ recBooks_mostrados: this.state.recBooks.slice(0,2) });
            })
            .catch(err => console.log(err));
    }

    handlePageChange(pageNumber) {
        let item = (pageNumber-1)*2;
        this.setState({ 
            activePage: pageNumber,
            recBooks_mostrados: this.state.recBooks.slice(item, item+2)
        });
    }

    removeRecommendedBook(isbn) {
        fetch('/removerecomendedbook',{
            method: 'POST',
            body: JSON.stringify({ isbn: isbn }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ recBooks: data.array });
                this.setState({ recBooks_mostrados: this.state.recBooks.slice(0,2) });
                this.setState({ activePage: 1 });
                M.toast({ html: 'Libro eliminado de la lista de recomendados'});
            })
            .catch(err => console.log(err));
    }

    addPendingBook(isbn) {
        fetch('/removerecomendedbook',{
            method: 'POST',
            body: JSON.stringify({ isbn: isbn }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ recBooks: data.array });
                this.setState({ recBooks_mostrados: this.state.recBooks.slice(0,2) });
                this.setState({ activePage: 1 });

                fetch('/newpendingbook',{
                    method: 'POST',
                    body: JSON.stringify({ isbn: isbn }),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                    .then(res => res.json())
                    .then(data => {
                        M.toast({ html: 'Libro añadido como pendiente'});
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
        
    }

    requestRecommendation(e) {
        e.preventDefault();
        M.toast({'html': 'Realizando recomendación, espere un instante'});

        fetch('/dorecommendation',{
            method: 'POST',
            body: JSON.stringify({ option: this.state.option }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) {
                    this.setState({ recBooks: data.array });
                    this.setState({ recBooks_mostrados: this.state.recBooks.slice(0,2) });
                    this.setState({ activePage: 1 });
                    this.setState({ option: 1 });
                    M.toast({'html': 'Recomendación realizada, se han obtenido ' + data.cont + ' libro/libros nuevos'});
                }
                else M.toast({'html': data.msg });
            })
            .catch(err => console.log(err));
    }

    render() {
        return (
            <div>
                <Menu/>
                
                <h3 className="center-align">Mis libros recomendados</h3>
                
                {
                    this.state.recBooks_mostrados.map((p) => {
                        return (
                            <div className="row" key={p.isbn}>
                                <div className="col s8 offset-s2 card orange lighten-2">
                                    <p>
                                        {p.title} - {p.isbn}
                                        &nbsp;
                                        <div className="right">
                                            <a onClick={() => location.href = "/book_details.html?isbn=" + p.isbn } data-tip="Más detalles del libro"><i className="material-icons">search</i></a>
                                            <ReactTooltip place="left" type="dark" effect="solid"/>
                                            &nbsp; &nbsp; &nbsp; &nbsp;
                                            <a onClick={() => this.removeRecommendedBook(p.isbn)} data-tip="Quitar libro recomendado"><i className="material-icons">remove</i></a>
                                            &nbsp; &nbsp; &nbsp; &nbsp;
                                            <a onClick={() => this.addPendingBook(p.isbn)} data-tip="Añadir libro como pendiente"><i className="material-icons">add</i></a>
                                        </div>
                                    </p>  
                                </div>
                            </div>
                        )
                    })
                }
                    
                {(() => {
                    if(this.state.recBooks.length > 0) {
                        return (
                            <div className="row center-align">
                                <Pagination
                                    activePage={this.state.activePage}
                                    itemsCountPerPage={2}
                                    totalItemsCount={this.state.recBooks.length}
                                    pageRangeDisplayed={(this.state.recBooks.length / 2) +1}
                                    onChange={this.handlePageChange}
                                />
                            </div>
                        )
                    }
                    else return <h4 className="row center-align green-text" style={{marginBottom: '3%'}}>No tiene libros recomendados</h4>;
                })()}
                
                <div className="row">
                    <div className="col s8 offset-s2 card light-green lighten-3">
                        <p className="center-align">Seleccione el criterio en el que quiere que basemos sus recomendaciones</p>
                        <div className="row">
                            <form className="center-align" onSubmit={this.requestRecommendation}>
                                <p>
                                    <label>
                                        <input type="radio" value="1" checked={this.state.option === 1} onChange={() => this.setState({ option: 1 })} />
                                        <span>Basada en valoraciones</span>
                                    </label>
                                </p>

                                <p>
                                    <label>
                                        <input type="radio" value="2" checked={this.state.option === 2} onChange={() => this.setState({ option: 2 })} />
                                        <span>Basada en géneros favoritos</span>
                                    </label>
                                </p>

                                <p>
                                    <label>
                                        <input type="radio" value="3" checked={this.state.option === 3} onChange={() => this.setState({ option: 3 })} />
                                        <span>Basada en opiniones</span>
                                    </label>
                                </p>

                                <p>
                                    <label>
                                        <input type="radio" value="4" checked={this.state.option === 4} onChange={() => this.setState({ option: 4 })} />
                                        <span>Basada en opiniones y géneros favoritos</span>
                                    </label>
                                </p>
                                    
                                <div className="row">
                                    <div className="center-align">
                                        <button style={{color: 'black'}} className="btn waves-effect waves-light light-green lighten-4">
                                            Solicitar
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <Footer/>
            </div>
        )
    }
}

render(<RecommendedBooks/>, document.getElementById('base'));
