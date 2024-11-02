import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

class NewSuggestion extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            description: ''
        };

        this.handleChange = this.handleChange.bind(this);
        this.addSuggestion = this.addSuggestion.bind(this);
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

                document.title = this.state.username == "admin" ? "Añadir Noticia" : "Añadir Sugerencia";
            })
            .catch(err => console.log(err));
    }

    addSuggestion(e){
        e.preventDefault();

        fetch('/suggestion/signup',{
            method: 'POST',
            body: JSON.stringify(this.state),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) {
                    if(this.state.username == "admin") M.toast({html: 'Noticia creada'});
                    else M.toast({html: 'Sugerencia realizada. Gracias por comentarnos.'});
                    
                    this.setState({ description: '' });
                }
                else M.toast({html: data.msg});
            })
            .catch(err => console.log(err));
    }

    handleChange(e) {
        const { name, value } = e.target;
        this.setState({ [name] : value });
    }

    render() {
        let word = this.state.username == "admin" ? "Noticia" : "Sugerencia";

        return (
            <div>
                <Menu/>
                <h3 className="center-align">Añadir { word }</h3>
                    
                <div className="row">
                    <div className="col s8 offset-s2 card light-green lighten-3">
                        <p className="center"><strong>Nueva { word }</strong></p>
                        <form onSubmit={this.addSuggestion}>
                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="description">Descripción</label> 
                                    <textarea placeholder="" name="description" className="materialize-textarea" value={this.state.description} onChange={this.handleChange} rows="7" cols="50"></textarea> 
                                    
                                    {(() => {
                                        if(this.state.username == "admin") return <span className="helper-text" data-error="wrong" data-success="right">Aquí se puede comentar cualquier sugerencia sobre el uso de la web o novedad sobre ella.</span> 
                                        else return <span className="helper-text" data-error="wrong" data-success="right">Aquí se puede comentar cualquier sugerencia, duda, problema o arreglo sobre esta web, con el objetivo de hacer mejorar este proyecto.</span>; 
                                    })()}
                                </div>
                            </div>

                            <button style={{marginBottom: '4%', color: 'black'}} className="btn waves-effect waves-light light-green lighten-4" type="submit">
                                Realizar
                            </button>
                        </form>
                    </div>
                </div>

                <Footer/>
            </div>
        )
    }
}

render(<NewSuggestion/>, document.getElementById('base'));
