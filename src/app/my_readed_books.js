import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

import Pagination from 'react-js-pagination';
import ReactTooltip from 'react-tooltip';

class ReadedBooks extends Component {
    constructor() {
        super();
        this.state = {
            username: '',
            readedBooks: [],
            readedBooks_mostrados: [],
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

        fetch('/readedbooks',{
            method: 'POST',
            body: JSON.stringify({ user: this.state.username }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ readedBooks: data.array });
                this.setState({ readedBooks_mostrados: this.state.readedBooks.slice(0,2) });
            })
            .catch(err => console.log(err));
    }

    handlePageChange(pageNumber) {
        let item = (pageNumber-1)*2
        this.setState({ 
            activePage: pageNumber,
            readedBooks_mostrados: this.state.readedBooks.slice(item, item+2)
        });
    }

    render() {
        return (
            <div>
                <Menu/>
                
                <h3 className="center-align">Mis libros leídos</h3>

                {
                    this.state.readedBooks_mostrados.map((p) => {
                        let tip, icon;
                        if(p.valorado) {
                            tip = "Más detalles del libro";
                            icon = <i className="material-icons">add</i>;
                        }
                        else {
                            tip = "Valorar libro";
                            icon = <i className="material-icons">book</i>;
                        }

                        return (
                            <div className="row" key={p.isbn}>
                                <div className="col s8 offset-s2 card orange lighten-2">
                                    <p>
                                        {p.title} - {p.isbn}
                                        &nbsp;
                                        <div className="right">
                                            <a onClick={() => location.href = "/book_details.html?isbn=" + p.isbn } data-tip={tip}>{icon}</a>
                                            <ReactTooltip place="left" type="dark" effect="solid"/>
                                        </div>
                                    </p>  
                                </div>
                            </div>
                        )
                    })
                }
                    
                {(() => {
                    if(this.state.readedBooks.length > 0) {
                        return (
                            <div className="row center-align">
                                <Pagination
                                    activePage={this.state.activePage}
                                    itemsCountPerPage={2}
                                    totalItemsCount={this.state.readedBooks.length}
                                    pageRangeDisplayed={(this.state.readedBooks.length / 2) +1}
                                    onChange={this.handlePageChange}
                                />
                            </div>
                        )
                    }
                    else return <h4 className="row center-align green-text" style={{marginBottom: '3%'}}>No tiene libros leídos</h4>;
                })()}
               
                <Footer/>
            </div>
        )
    }
}

render(<ReadedBooks/>, document.getElementById('base'));
