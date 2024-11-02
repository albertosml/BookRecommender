import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

import Chips, { Chip } from 'react-chips';

class NewUser extends Component {
    constructor() {
        super();
        this.state = {
          chips: [],
          suggestions: [], 
          username: '',
          name: '',
          surname: '',
          email: '',
          password: '',
          confirmpassword: ''
        }
        this.handleChange = this.handleChange.bind(this);
        this.newUser = this.newUser.bind(this);
    }

    componentWillMount() {
        fetch('/verifysession',{
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg == 'SI') location.href = "/index.html";
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
                // Preparo array de géneros de sugerencia
                let array = [];
                data.map(d => {
                    array.push(d.name);
                }); 

                // Inserto array de géneros de sugerencia
                this.setState({
                    suggestions: array
                });
            })   
            .catch(err => console.log(err));
    }

    newUser(e) {
        e.preventDefault();
        fetch('/users/signup',{
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
                    M.toast({ html: 'Usuario registrado con éxito' });

                    // Espera a la redirección para que se vea el mensaje de arriba
                    setTimeout(() => location.href = 'index.html', 1000);
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
        return (
            <div>
                <Menu/>

                <h3 className="center-align">Nuevo Usuario</h3>
                
                <div className="row">
                    <div className="col s8 offset-s2 card light-green lighten-3">
                        <form onSubmit={this.newUser}>
                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="username">Nombre de usuario</label>
                                    <input placeholder="" type="text" name="username" className="materialize-textarea" value={this.state.username} onChange={this.handleChange} /> 
                                </div>
                            </div>

                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="name">Nombre</label>
                                    <input placeholder="" type="text" name="name" className="materialize-textarea" value={this.state.name} onChange={this.handleChange} /> 
                                </div>
                            </div>

                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="surname">Apellidos</label> 
                                    <input placeholder="" type="text" name="surname" className="materialize-textarea" value={this.state.surname} onChange={this.handleChange} /> 
                                </div>
                            </div>

                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="email">Correo Electrónico</label> 
                                    <input placeholder="" type="email" name="email" className="materialize-textarea" value={this.state.email} onChange={this.handleChange} /> 
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="password">Contraseña</label> 
                                    <input placeholder="" type="password" name="password" className="materialize-textarea" value={this.state.password} onChange={this.handleChange} />  
                                </div>
                            </div>

                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="confirmpassword">Confirmar contraseña</label> 
                                    <input placeholder="" type="password" name="confirmpassword" className="materialize-textarea" value={this.state.confirm_password} onChange={this.handleChange} /> 
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="col s12">
                                    <label htmlFor="genres">Géneros Favoritos</label> 
                                    <Chips value={this.state.chips} placeholder="Añada un género literario que le guste" onChange={chips => this.setState({ chips })} suggestions={this.state.suggestions} />
                                    <span className="helper-text" data-error="wrong" data-success="right">Busque su género en el autocompletado y selecciónelo con el ratón. Si no aparece, introdúzcalo manualmente y pulse la tecla de la coma (",").</span>
                                </div>
                            </div>

                            <button style={{marginBottom: '4%', color: 'black'}} className="btn waves-effect waves-light light-green lighten-4" type="submit">
                                Registrar
                            </button>
                        </form>
                    </div>
                </div>
                
                <Footer/>
            </div>
        )
    }
}

render(<NewUser/>, document.getElementById('base'));
