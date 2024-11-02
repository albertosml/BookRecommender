import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

import Pagination from 'react-js-pagination';
import ReactTooltip from 'react-tooltip';

class Books extends Component {
    constructor() {
        super();
        this.state = {
            username: '',
            books: [],
            books_mostrados: [],
            activePage: 1,
            booksperpage: 5
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
                if(data.msg.length == 0) this.setState({username: data.username });
            })
            .catch(err => console.log(err));

        fetch('/books',{
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ books: data.array.reverse() });
                this.setState({ books_mostrados: this.state.books.slice(0,this.state.booksperpage) });
            })
            .catch(err => console.log(err));
    }

    handlePageChange(pageNumber) {
        let item = (pageNumber-1)*this.state.booksperpage;
        this.setState({ 
            activePage: pageNumber,
            books_mostrados: this.state.books.slice(item, item+this.state.booksperpage)
        });
    }

    removeBook(isbn) {
        fetch('/removebook',{
            method: 'POST',
            body: JSON.stringify({ isbn: isbn }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                M.toast({ html: 'Libro eliminado'});
                
                // Espera a la redirección para que se vea el mensaje de arriba
                setTimeout(() => location.href = 'books.html', 1000);
            })
            .catch(err => console.log(err));
    }

    render() {
        return (
            <div>
                <Menu/>
                
                <h3 className="center-align">Libros</h3>

                {
                    this.state.books_mostrados.map((p) => {
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
                                            {(() => {
                                                if(this.state.username == "admin") {
                                                    return (
                                                        <a onClick={() => this.removeBook(p.isbn)} data-tip="Quitar libro"><i className="material-icons">remove</i></a>
                                                    
                                                    )
                                                }
                                            })()}
                                        </div>
                                    </p>  
                                </div>
                            </div>
                        )
                    })
                }
                    
                {(() => {
                    if(this.state.books.length > 0) {
                        return (
                            <div className="row center-align">
                                <Pagination
                                    activePage={this.state.activePage}
                                    itemsCountPerPage={this.state.booksperpage}
                                    totalItemsCount={this.state.books.length}
                                    pageRangeDisplayed={(this.state.books.length / this.state.booksperpage) +1}
                                    onChange={this.handlePageChange}
                                />
                            </div>
                        )
                    }
                    else return <h4 className="row center-align green-text" style={{marginBottom: '3%'}}>No hay ningún libro dado de alta</h4>;
                })()}
               
                <Footer/>
            </div>
        )
    }
}

render(<Books/>, document.getElementById('base'));
