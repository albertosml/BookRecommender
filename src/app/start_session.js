import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

class NewSession extends Component {
    constructor() {
        super();
        this.state = {
          username: '',
          password: ''
        }
        this.handleChange = this.handleChange.bind(this);
        this.startSession = this.startSession.bind(this);
        this.rememberPassword = this.rememberPassword.bind(this);
    }

    handleChange(e) {
	// Remove spaces from username/email
        const { name, value } = e.target;
        this.setState({ [name] : value.trim() });
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
    }

    startSession(e) {
        e.preventDefault();
        fetch('/users/signin',{
            method: 'POST',
            body: JSON.stringify(this.state),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if(data.msg.length == 0) location.href = "/index.html";
                else M.toast({html: data.msg});
                this.setState({ username: '', password: ''});
            })
            .catch(err => console.log(err));
    }

    rememberPassword() {
        if(this.state.username.length == 0) M.toast({ html: 'Introduzca el nombre del usuario en su campo correspondiente'});
        else {
            fetch('/rememberpassword',{
                method: 'POST',
                body: JSON.stringify({ username: this.state.username }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
                .then(res => res.json())
                .then(data => {
                    if(data.msg.length == 0) M.toast({ html: 'Correo enviado a: ' + data.email});
                    else M.toast({html: data.msg});
                })
                .catch(err => console.log(err));
        }
    }
    
    render() {
        return (
            <div>
                <Menu/>

                <h3 className="center-align">Iniciar Sesión</h3>
                
                <div className="row">
                    <div className="col s8 offset-s2 card light-green lighten-3">
                        <form onSubmit={this.startSession}>
                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="username">Nombre de usuario/Email</label>
                                    <input placeholder="" type="text" name="username" className="materialize-textarea" value={this.state.username} onChange={this.handleChange} /> 
                                </div>
                            </div>

                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="password">Contraseña</label> 
                                    <input placeholder="" type="password" name="password" value={this.state.password} onChange={this.handleChange} />  
                                </div>
                            </div>

                            <button style={{marginBottom: '4%', color: 'black'}} className="btn waves-effect waves-light light-green lighten-4" type="submit" id="button">
                                Iniciar Sesión
                            </button>
                        </form>
                        <div className="row">
                            <a className="right" onClick={this.rememberPassword}>Se me ha olvidado la contraseña</a>
                        </div>
                    </div>
                </div>
                
                <Footer/>
            </div>
        )
    }
}

render(<NewSession/>, document.getElementById('base'));
