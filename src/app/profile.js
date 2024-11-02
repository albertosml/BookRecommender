import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

import Chips from 'react-chips';

class Perfil extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chips: [],
            suggestions: [], 
            name: '',
            surname: '',
            email: '',
            password: '',
            confirmpassword: '',
            chips_old: [],
            name_old: '',
            surname_old: '',
            email_old: '',
            username: '',
            username_old: ''
        }
        this.handleChange = this.handleChange.bind(this);
        this.editUser = this.editUser.bind(this);
    }

    handleChange(e) {
        const { name, value } = e.target;
        this.setState({ [name] : value });
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
                if(data.msg == 'NO') location.href = "/index.html";
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

        fetch('/user/data',{
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => { 
                this.setState({
                    chips: data.generos,
                    name: '',
                    surname: '',
                    email: '',
                    chips_old: data.generos,
                    name_old: data.user.name,
                    surname_old: data.user.surname,
                    email_old: data.user.email,
                    username_old: data.user.username
                });
            })   
            .catch(err => console.log(err));
    }

    editUser(e) {
        e.preventDefault();
        fetch('/user/profile',{
            method: 'POST',
            body: JSON.stringify(this.state),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => { 
                if(data.close != undefined) {
                    M.toast({ html: 'Se va a cerrar su sesión, vuelva a iniciar sesión para confirmar el cambio de nombre de usuario' });

                    // Espera a la redirección para que se vea el mensaje de arriba
                    setTimeout(() => location.href = 'index.html', 2000);
                }

                if(data.msg.length == 0) M.toast({html: 'Usuario editado'}); 
                else M.toast({html: data.msg});

                // Actualizo los cambios en el formulario
                if(this.state.name.length >0) this.setState({ name: '', name_old: this.state.name });
                if(this.state.surname.length >0) this.setState({ surname: '', surname_old: this.state.surname });
                if(this.state.email.length >0) this.setState({ email: '', email_old: this.state.email });

                // Vacío los campos relacionados con la contraseña
                this.setState({ password: '', confirmpassword: ''});
            })   
            .catch(err => console.log(err));
    }

    render() {
        return (
            <div>
                <Menu/>

                <h3 className="center-align">Perfil</h3>
                
                <div className="row">
                    <div className="col s8 offset-s2 card light-green lighten-3">
                        <p className="center">Rellene los campos que quiera modificar</p>
                        <form onSubmit={this.editUser}>
                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="username">Nombre de usuario</label>
                                    <input placeholder="" type="text" name="username" className="materialize-textarea" value={this.state.username} onChange={this.handleChange} /> 
                                    <span className="helper-text" data-error="wrong" data-success="right">Nombre de usuario actual: {this.state.username_old}</span>
                                </div>
                            </div>

                            <div className="row">
                                <div className="input-field col s12">    
                                    <label className="active" htmlFor="name">Nombre</label>
                                    <input placeholder="" type="text" name="name" className="materialize-textarea" value={this.state.name} onChange={this.handleChange} /> 
                                    <span className="helper-text" data-error="wrong" data-success="right">Nombre actual: {this.state.name_old}</span>
                                </div>
                            </div>

                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="surname">Apellidos</label> 
                                    <input placeholder="" type="text" name="surname" className="materialize-textarea" value={this.state.surname} onChange={this.handleChange} /> 
                                    <span className="helper-text" data-error="wrong" data-success="right">Apellidos actuales: {this.state.surname_old}</span>
                                </div>
                            </div>

                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="email">Correo Electrónico</label> 
                                    <input placeholder="" type="email" name="email" className="materialize-textarea" value={this.state.email} onChange={this.handleChange} /> 
                                    <span className="helper-text" data-error="wrong" data-success="right">Email actual: {this.state.email_old}</span>
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="password">Contraseña</label> 
                                    <input placeholder="" type="password" name="password" className="materialize-textarea" value={this.state.password} onChange={this.handleChange} />  
                                    <span className="helper-text" data-error="wrong" data-success="right">Para modificar la contraseña, introduzca una nueva y confirmela.</span>
                                </div>
                            </div>

                            <div className="row">
                                <div className="input-field col s12">
                                    <label className="active" htmlFor="confirmpassword">Confirmar contraseña</label> 
                                    <input placeholder="" type="password" name="confirmpassword" className="materialize-textarea" value={this.state.confirmpassword} onChange={this.handleChange} /> 
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="col s12">
                                    <label className="active" htmlFor="genres">Géneros Favoritos</label> 
                                    <Chips value={this.state.chips} placeholder="Añada un género literario que le guste" onChange={chips => this.setState({ chips })} suggestions={this.state.suggestions} />
                                    <span className="helper-text" data-error="wrong" data-success="right">Busque su género en el autocompletado y selecciónelo con el ratón. Si no aparece, introdúzcalo manualmente y pulse la tecla de la coma (",").</span>
                                </div>
                            </div>

                            <button style={{marginBottom: '4%', color: 'black'}} className="btn waves-effect waves-light light-green lighten-4" type="submit">
                                Modificar
                            </button>
                        </form>
                    </div>
                </div>

                <Footer/>
            </div>
        )
    }
}

render(<Perfil/>, document.getElementById('base'));
