import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';
import Pagination from 'react-js-pagination';

class FreeThemes extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            title: '',
            description: '',
            response: '',
            temas: [],
            activePageTheme: 1,
            num_total_temas: 1
        };

        this.handleChange = this.handleChange.bind(this);
        this.addTheme = this.addTheme.bind(this);
        this.addComment = this.addComment.bind(this);
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
                this.getThemes();
            })
            .catch(err => console.log(err));
    }

    handlePageChange(pageNumber) {
        this.setState({ activePageTheme: pageNumber });
        this.getThemes(pageNumber);
    }

    getThemes(pageNumber = this.state.activePageTheme){
        fetch('/themes',{
            method: 'POST',
            body: JSON.stringify({ currentPage: pageNumber, book: null }),
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
            body: JSON.stringify({ title: this.state.title, description: this.state.description, isbn: null }),
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

    handleChange(e) {
        const { name, value } = e.target;
        this.setState({ [name] : value });
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
        let theme_form;

        if(this.state.username.length > 0 && this.state.username != "admin") {
            theme_form = <div className="row">
                            <div className="col s8 offset-s2 card light-green lighten-3">
                                <p className="center"><strong>Nuevo Tema</strong></p>
                                <form onSubmit={this.addTheme}>
                                    <div className="row">
                                        <div className="input-field col s12">
                                            <label className="active" htmlFor="title">Título</label>
                                            <input placeholder="" type="text" name="title" className="materialize-textarea" value={this.state.title} onChange={this.handleChange}/> 
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="input-field col s12">
                                            <label className="active" htmlFor="description">Descripción</label> 
                                            <textarea placeholder="" name="description" className="materialize-textarea" value={this.state.description} onChange={this.handleChange} rows="3" cols="50"></textarea> 
                                        </div>
                                    </div>

                                    <button style={{marginBottom: '4%', color: 'black'}} className="btn waves-effect waves-light light-green lighten-4" type="submit">
                                        Crear
                                    </button>
                                </form>
                            </div>
                        </div>;
        }

        return (
            <div>
                <Menu/>
                <h3 className="center-align">Temas</h3>
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
                                        if(this.state.username.length > 0  && this.state.username != "admin") {
                                            return (
                                                <div className="col s10 offset-s1 card light-green lighten-3">
                                                    <p className="center"><strong>Comentario</strong></p>
                                                    <form onSubmit={this.addComment}>
                                                        <div className="row">
                                                            <div className="input-field col s12">
                                                                <label className="active" htmlFor="response">Respuesta</label> 
                                                                <textarea placeholder="" name="response" className="materialize-textarea" value={this.state.response} onChange={this.handleChange} rows="3" cols="50"></textarea> 
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
                    if(this.state.num_total_temas > 0) {
                        return (
                            <div className="row center-align">
                                <Pagination
                                    activePage={this.state.activePageTheme}
                                    itemsCountPerPage={2}
                                    totalItemsCount={this.state.num_total_temas}
                                    pageRangeDisplayed={(this.state.num_total_temas / 2) +1}
                                    onChange={this.handlePageChange}
                                />
                            </div>
                        )
                    }
                    else return <h4 className="row center-align green-text" style={{marginBottom: '3%'}}>No hay temas disponibles</h4>;
                })()}

                { theme_form }

                <Footer/>
            </div>
        )
    }
}

render(<FreeThemes/>, document.getElementById('base'));
