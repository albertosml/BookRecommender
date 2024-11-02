import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

import Pagination from 'react-js-pagination';
import ReactTooltip from 'react-tooltip';

class PendingBooks extends Component {
    constructor() {
        super();
        this.state = {
            username: '',
            pendBooks: [],
            pendBooks_mostrados: [],
            activePage: 1
        };

        this.handlePageChange = this.handlePageChange.bind(this);
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

        fetch('/pendingbooks',{
            method: 'POST',
            body: JSON.stringify({ user: this.state.username }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ pendBooks: data.array });
                this.setState({ pendBooks_mostrados: this.state.pendBooks.slice(0,2) });
            })
            .catch(err => console.log(err));
    }

    handlePageChange(pageNumber) {
        let item = (pageNumber-1)*2;
        this.setState({ 
            activePage: pageNumber,
            pendBooks_mostrados: this.state.pendBooks.slice(item, item+2)
        });
    }

    removePendingBook(isbn) {
        fetch('/removependingbook',{
            method: 'POST',
            body: JSON.stringify({ isbn: isbn }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ pendBooks: data.array });
                this.setState({ pendBooks_mostrados: this.state.pendBooks.slice(0,2) });
                this.setState({ activePage: 1 });
                M.toast({ html: 'Libro eliminado de la lista de libros pendientes'});
            })
            .catch(err => console.log(err));
    }

    addReadedBook(isbn) {
        fetch('/removependingbook',{
            method: 'POST',
            body: JSON.stringify({ isbn: isbn }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ pendBooks: data.array });
                this.setState({ pendBooks_mostrados: this.state.pendBooks.slice(0,2) });
                this.setState({ activePage: 1 });

                fetch('/addreadedbook',{
                    method: 'POST',
                    body: JSON.stringify({ isbn: isbn }),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                    .then(res => res.json())
                    .then(data => {
                        M.toast({ html: 'Libro añadido como leído'});
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
    }

    render() {
        return (
            <div>
                <Menu/>
                <h3 className="center-align">Mis libros pendientes</h3>
                
                {
                    this.state.pendBooks_mostrados.map((p) => {
                        return (
                            <div className="row" key={p.isbn}>
                                <div className="col s8 offset-s2 card orange lighten-2">
                                    <p>
                                        {p.title} - {p.isbn}
                                        &nbsp;
                                        <div className="right">
                                            <a onClick={() => location.href = "/book_details.html?isbn=" + p.isbn } data-tip="Más detalle del libro"><i className="material-icons">add</i></a>
                                            <ReactTooltip place="left" type="dark" effect="solid"/>
                                            &nbsp; &nbsp; &nbsp; &nbsp;
                                            <a onClick={() => this.removePendingBook(p.isbn)} data-tip="Quitar libro de la lista de libros pendientes"><i className="material-icons">remove</i></a>
                                            &nbsp; &nbsp; &nbsp; &nbsp;
                                            <a onClick={() => this.addReadedBook(p.isbn)} data-tip="Añadir libro como leído"><i className="material-icons">book</i></a>
                                        </div>
                                    </p>  
                                </div>
                            </div>
                        )
                    })
                }
                    
                {(() => {
                    if(this.state.pendBooks.length > 0) {
                        return (
                            <div className="row center-align">
                                <Pagination
                                    activePage={this.state.activePage}
                                    itemsCountPerPage={2}
                                    totalItemsCount={this.state.pendBooks.length}
                                    pageRangeDisplayed={(this.state.pendBooks.length / 2) +1}
                                    onChange={this.handlePageChange}
                                />
                            </div>
                        )
                    }
                    else return <h4 className="row center-align green-text" style={{marginBottom: '3%'}}>No tiene libros pendientes</h4>;
                })()}

                <Footer/>
            </div>
        )
    }
}

render(<PendingBooks/>, document.getElementById('base'));
