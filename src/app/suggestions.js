import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

import Pagination from 'react-js-pagination';
import ReactTooltip from 'react-tooltip';

class Suggestions extends Component {
    constructor() {
        super();
        this.state = {
            username: '',
            sugerencias: [],
            activePage: 1,
            num_total_sug: 1
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
                if(data.username == "admin") {
                    this.setState({ username: data.username });
                    this.getSuggestions();
                }
                else location.href = "/index.html";
            })
            .catch(err => console.log(err));
    }

    handlePageChange(pageNumber) {
        this.setState({ activePage: pageNumber });
        this.getSuggestions(pageNumber);
    }

    getSuggestions(pageNumber = this.state.activePage){
        fetch('/suggestions',{
            method: 'POST',
            body: JSON.stringify({ currentPage: pageNumber }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ sugerencias: data.array, num_total_sug: data.countSuggestions, activePage: 1 });
            })
            .catch(err => console.log(err));
    }

    removeSuggestion(id) {
        fetch('/removesuggestion',{
            method: 'POST',
            body: JSON.stringify({ id: id }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) M.toast({ html: 'Sugerencia eliminada'});
                else M.toast({ html: data.msg });

                this.getSuggestions(1);
            })
            .catch(err => console.log(err));
    }

    render() {
        return (
            <div>
                <Menu/>
                <h3 className="center-align">Sugerencias</h3>
                <div className="row">
                    {
                        this.state.sugerencias.map((sug) => {
                            return (
                                <div className="row" key={sug.id}>
                                    <div className="col s8 offset-s2 card orange lighten-2">
                                        <p className="white-text center-align">{sug.user}</p>

                                        <div className="row">
                                            <p className="col s10 offset-m1">&nbsp; &nbsp; &nbsp; &nbsp; {sug.description}</p>
                                        </div>

                                        <div className="right">
                                            <a onClick={() => this.removeSuggestion(sug.id)} data-tip="Eliminar esta sugerencia"><i className="material-icons">remove</i></a>
                                            <ReactTooltip place="left" type="dark" effect="solid"/>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    } 

                    {(() => {
                        if(this.state.sugerencias.length > 0) {
                            return (
                                <div className="row center-align">
                                    <Pagination
                                        activePage={this.state.activePage}
                                        itemsCountPerPage={2}
                                        totalItemsCount={this.state.num_total_sug}
                                        pageRangeDisplayed={(this.state.num_total_sug / 2) +1}
                                        onChange={this.handlePageChange}
                                    />
                                </div>
                            )
                        }
                        else return <h4 className="row center-align green-text" style={{marginBottom: '3%'}}>No hay ninguna sugerencia</h4>;
                    })()}
                        
                </div>

                <Footer/>
            </div>
        )
    }
}

render(<Suggestions/>, document.getElementById('base'));
