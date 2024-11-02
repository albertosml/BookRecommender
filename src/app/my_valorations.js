import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

import StarRatings from 'react-star-ratings';
import Pagination from 'react-js-pagination';

class MyValorations extends Component {
    constructor() {
        super();
        this.state = {
            username: '',
            valoraciones: [],
            activePageValoration: 1,
            num_total_valoraciones: 1
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
                    this.getValorations();
                }
                else location.href = "/index.html";
            })
            .catch(err => console.log(err));
    }

    handlePageChange(pageNumber) {
        this.setState({ activePageValoration: pageNumber });
        this.getValorations(pageNumber);
    }

    getValorations(pageNumber = this.state.activePageValoration){
        fetch('/valorations',{
            method: 'POST',
            body: JSON.stringify({ username: this.state.username, isbn: null, currentPage: pageNumber }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ valoraciones: data.array, num_total_valoraciones: data.countValorations  });
            })
            .catch(err => console.log(err));
    }

    render() {
        return (
            <div>
                <Menu/>
                <h3 className="center-align">Mis valoraciones</h3>
                <div className="row">
                    {
                        this.state.valoraciones.map((valoracion) => {
                            return (
                                <div className="row" key={valoracion.id} >
                                    <div className="col s8 offset-s2 card orange lighten-2">
                                        <p className="white-text center-align">{valoracion.book}</p>

                                        <p>&nbsp; &nbsp; &nbsp; &nbsp;<strong>{valoracion.user} realizó esta valoración el día {valoracion.fecha} a las {valoracion.hora}:</strong></p> 
                                            
                                        <div className="row">
                                            <p className="col s10 offset-m1">&nbsp; &nbsp; &nbsp; &nbsp; {valoracion.description}</p>
                                        </div>

                                        <p>&nbsp; &nbsp; &nbsp; &nbsp;<strong>Nota:</strong> &nbsp; <StarRatings rating={valoracion.note} starRatedColor="yellow" starDimension="20px" starSpacing="5px"/></p>
                                        
                                        <p className="right">&nbsp; &nbsp; &nbsp; &nbsp; <i className="material-icons">thumb_up</i> {valoracion.likes} &nbsp; &nbsp; <i className="material-icons">thumb_down</i> {valoracion.dislikes}</p>
                                    </div>
                                </div>
                            )
                        })
                    } 
                </div>
                             
                {(() => {
                    if(this.state.valoraciones.length > 0) {
                        console.log("jlgrñj");
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
                    else return <h4 className="row center-align green-text" style={{marginBottom: '3%'}}>No ha realizado ninguna valoración</h4>;
                })()}

                <Footer/>
            </div>
        )
    }
}

render(<MyValorations/>, document.getElementById('base'));
