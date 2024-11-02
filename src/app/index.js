import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';
import Pagination from 'react-js-pagination';
import ReactTooltip from 'react-tooltip';

class Inicio extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            noticias: [],
            noticias_mostradas: [],
            activePageNotice: 1
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

        fetch('/news',{
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                this.setState({ noticias: data.array });
                this.setState({ noticias_mostradas: this.state.noticias.slice(0,2) });
            })
            .catch(err => console.log(err));

        M.toast({ html: '<a href="books.html">Pinche aquí para ver los libros añadidos más recientemente.</a>'})
    }

    handlePageChange(pageNumber) {
        let item = (pageNumber-1)*2;
        this.setState({ 
            activePageNotice: pageNumber,
            noticias_mostradas: this.state.noticias.slice(item, item+2)
        });
    }

    removeNews(id) {
        fetch('/removenews',{
            method: 'POST',
            body: JSON.stringify({ id: id }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) {
                    this.setState({ noticias: data.array });
                    this.setState({ noticias_mostradas: this.state.noticias.slice(0,2) });
                    this.setState({ activePageNotice: 1 });
                    M.toast({ html: 'Noticia eliminada'}); 
                } 
                else M.toast({ html: data.msg });  
            })
            .catch(err => console.log(err));
    }

    render() {
        // Inicio conectado
        if(this.state.username.length > 0) {
            return (
                <div>
                    <Menu/>
                    <h3 className="center-align">Noticias</h3>
                    <div className="row">
                        {
                            this.state.noticias_mostradas.map((noticia) => {
                                return (
                                    <div className="row" key={noticia.id}>
                                        <div className="col s8 offset-s2 card orange lighten-2">
                                            <p className="white-text center-align">Administrador</p>

                                            <div className="row">
                                                <p className="col s10 offset-m1">&nbsp; &nbsp; &nbsp; &nbsp; {noticia.description}</p>
                                            </div>

                                            {(() => {
                                                if(this.state.username == "admin") {
                                                    return (
                                                        <div className="right">
                                                            <a onClick={() => this.removeNews(noticia.id)} data-tip="Eliminar esta noticia"><i className="material-icons">remove</i></a>
                                                            <ReactTooltip place="left" type="dark" effect="solid"/>
                                                        </div>
                                                    )
                                                }
                                            })()}
                                                
                                        </div>
                                    </div>
                                )
                            })
                        } 

                        {(() => {
                            if(this.state.noticias.length > 0) {
                                return (
                                    <div className="row center-align">
                                        <Pagination
                                            activePage={this.state.activePageNotice}
                                            itemsCountPerPage={2}
                                            totalItemsCount={this.state.noticias.length}
                                            pageRangeDisplayed={(this.state.noticias.length / 2) +1}
                                            onChange={this.handlePageChange}
                                        />
                                    </div>
                                )
                            }
                            else return <h4 className="row center-align green-text" style={{marginBottom: '3%'}}>No hay ninguna noticia dada por el administrador</h4>;
                        })()}

                    </div>

                    <Footer/>
                </div>
            )
        }
        else {
            return (
                <div>
                    <Menu/>

                    <h3 className="center-align">BookRecommender</h3>
                    
                    <div className="row" style={{ marginTop: '3%', marginBottom: '5%'}}>
                        <div className="col s5 offset-s1">
                            <p>En esta plataforma podrá expresar sus opiniones y valoraciones sobre aquellos libros
                                 que se haya leído y debatir con otros acerca de ellos o de cualquier otro tema relacionado 
                                 con la lectura. Además, se le posibilitará el descubrimiento de nuevas obras mediante 
                                 la búsqueda y la recomendación de libros realizada por la propia plataforma. Esta estará disponible en 
                                 su versión web y móvil, en forma de aplicación en ambos casos.</p>   
                        </div>
                        <img className="col s3 offset-s1 responsive-img" src="images/favicon.png" />
                    </div>

                    <Footer/>
                </div>
            )
        }
    }
}

render(<Inicio/>, document.getElementById('base'));
