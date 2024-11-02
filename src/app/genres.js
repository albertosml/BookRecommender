import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

import Pagination from 'react-js-pagination';
import ReactTooltip from 'react-tooltip';

class Genres extends Component {
    constructor() {
        super();
        this.state = {
            username: '',
            genres: [],
            genres_mostrados: [],
            activePage: 1,
            genresperpage: 5
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
                if(data.msg.length == 0 && data.username == "admin") this.setState({username: data.username });
                else location.href = "/index.html"
            })
            .catch(err => console.log(err));

        fetch('/genrelist',{
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ genres: data });
                this.setState({ genres_mostrados: this.state.genres.slice(0,this.state.genresperpage) });
            })
            .catch(err => console.log(err));
    }

    handlePageChange(pageNumber) {
        let item = (pageNumber-1)*this.state.genresperpage;
        this.setState({ 
            activePage: pageNumber,
            genres_mostrados: this.state.genres.slice(item, item+this.state.genresperpage)
        });
    }

    removeGenre(name) {
        fetch('/removegenre',{
            method: 'POST',
            body: JSON.stringify({ name: name }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                M.toast({ html: 'Género eliminado'});
                this.setState({ activePage: 1 });
                this.setState({ genres: data });
                this.setState({ genres_mostrados: this.state.genres.slice(0,this.state.genresperpage) });
            })
            .catch(err => console.log(err));
    }

    render() {
        return (
            <div>
                <Menu/>
                
                <h3 className="center-align">Géneros</h3>
                {
                    this.state.genres_mostrados.map((p) => {
                        return (
                            <div className="row" key={p.id}>
                                <div className="col s8 offset-s2 card orange lighten-2">
                                    <p>
                                        {p.name}
                                        &nbsp;
                                        <div className="right">
                                            <a onClick={() => this.removeGenre(p.name)} data-tip="Eliminar género"><i className="material-icons">remove</i></a>
                                            <ReactTooltip place="left" type="dark" effect="solid"/>
                                        </div>
                                    </p>  
                                </div>
                            </div>
                        )
                    })
                }
                    
                {(() => {
                    if(this.state.genres.length > 0) {
                        return (
                            <div className="row center-align">
                                <Pagination
                                    activePage={this.state.activePage}
                                    itemsCountPerPage={this.state.genresperpage}
                                    totalItemsCount={this.state.genres.length}
                                    pageRangeDisplayed={(this.state.genres.length / this.state.genresperpage) +1}
                                    onChange={this.handlePageChange}
                                />
                            </div>
                        )
                    }
                    else return <h4 className="row center-align green-text" style={{marginBottom: '3%'}}>No hay ningún género registrado</h4>;
                })()}
               
                <Footer/>
            </div>
        )
    }
}

render(<Genres/>, document.getElementById('base'));
