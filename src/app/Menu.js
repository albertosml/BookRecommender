import React, { Component } from 'react';

export default class Menu extends Component {
    constructor(props){
        super(props);
        this.state = { username: '', name: '', options: [], value: '' };
        this.closeSession = this.closeSession.bind(this);
        this.doSearch = this.doSearch.bind(this);
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
                if(data.msg.length == 0) this.setState({username: data.username, name: data.name });
            })
            .catch(err => console.log(err));
    }

    closeSession() {
        fetch('/users/signout',{
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => { 
                location.href = "/index.html";
                this.forceUpdate();
            })
            .catch(err => console.log(err));
    }

    doSearch() {
        fetch('/dosearch',{
            method: 'POST',
            body: JSON.stringify({ text: this.state.value }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => { 
                console.log(data);
                if(data.msg.length == 0) {
                    this.setState({ options: data.libros });
                    if(data.libros.length == 0) M.toast({ 'html': 'No se han encontrado resultados'}); 
                } 
                else M.toast({ 'html': data.msg });
            })
            .catch(err => console.log(err));
    }

    render() {
        return (
            <div>
                <nav className="green" role="navigation">
                    <div className="nav-wrapper">
                        <a href="index.html" >BookRecommender</a>
                        <a href="#" data-target="slide-out" className="sidenav-trigger show-on-large"><i className="material-icons">menu</i></a>
                    </div>
                </nav>
        
                {(() => {
                    if(this.state.username == "admin") {
                        return (
                            <ul id="slide-out" className="sidenav">
                                <li>
                                    <div className="user-view">
                                        <div className="background"><img src="images/libros.jpg"/></div>
                                        <span className="white-text name">{this.state.username}</span>
                                        <span className="white-text email">{this.state.name}</span>
                                        <a href="" onClick={this.closeSession}>Abandonar Sesión</a>
                                    </div>
                                </li>
        
                                <li><a href="profile.html"><i className="material-icons">perm_identity</i>Perfil</a></li>
                                <li><a href="suggestions.html"><i className="material-icons">remove_red_eye</i>Ver Sugerencias</a></li>
                                <li><a href="books.html"><i className="material-icons">remove_red_eye</i>Ver Libros</a></li>
                                <li><a href="genres.html"><i className="material-icons">remove_red_eye</i>Ver Géneros</a></li>
                                <li><a href="new_suggestion.html"><i className="material-icons">edit</i>Nueva Noticia</a></li>
                                <li><div className="divider"></div></li>
                                <li>
                                    <div className="center">
                                        <input style={{ width: '80%', margin: '0'}} placeholder="Buscar libro..." type="text" value={this.state.value} onChange={(e) => this.setState({ value: e.target.value, options: [] })} />
                                    </div>
                                    <div className="center collection" style={{ margin: '0 auto', width: '80%'}}>
                                        {
                                            this.state.options.map(item => { 
                                                return <a href={"/book_details.html?isbn=" + item.value} key={item.value} className="collection-item">{item.label}</a>;
                                            })
                                        }
                                    </div>
                                    <div className="center">
                                        <button className="btn" onClick={() => this.doSearch()}><i className="material-icons">search</i></button> 
                                    </div>  
                                </li>
                                <li><div className="divider"></div></li>
                            </ul>
                        )
                    }
                    else if(this.state.username.length > 0) {
                        return (
                            <ul id="slide-out" className="sidenav">
                                <li>
                                    <div className="user-view">
                                        <div className="background"><img src="images/libros.jpg"/></div>
                                        <span className="white-text name">{this.state.username}</span>
                                        <span className="white-text email">{this.state.name}</span>
                                        <a href="" onClick={this.closeSession}>Abandonar Sesión</a>
                                    </div>
                                </li>
                                <li><a href="profile.html"><i className="material-icons">perm_identity</i>Perfil</a></li>
                                <li><a href="book_registration.html"><i className="material-icons">book</i>Registrar Libro</a></li>
                                <li><a href="new_suggestion.html"><i className="material-icons">edit</i>Nueva Sugerencia</a></li>
                                <li><a href="free_themes.html"><i className="material-icons">remove_red_eye</i>Temas Libres</a></li>
                                <li><a href="books.html"><i className="material-icons">remove_red_eye</i>Ver Libros Añadidos</a></li>
                                <li><div className="divider"></div></li>
                                <li>
                                    <div className="center">
                                        <input style={{ width: '80%', margin: '0'}} placeholder="Buscar libro..." type="text" value={this.state.value} onChange={(e) => this.setState({ value: e.target.value, options: [] })} />
                                    </div>
                                    <div className="center collection" style={{ margin: '0 auto', width: '80%'}}>
                                        {
                                            this.state.options.map(item => { 
                                                return <a href={"/book_details.html?isbn=" + item.value} key={item.value} className="collection-item">{item.label}</a>;
                                            })
                                        }
                                    </div>
                                    <div className="center">
                                        <button className="btn" onClick={() => this.doSearch()}><i className="material-icons">search</i></button> 
                                    </div>  
                                </li>
                                <li><div className="divider"></div></li>
                                <li><a href="my_valorations.html"><i className="material-icons">book</i>Mis Valoraciones</a></li>
                                <li><a href="my_pending_books.html"><i className="material-icons">book</i>Mis Libros Pendientes</a></li>
                                <li><a href="my_readed_books.html"><i className="material-icons">book</i>Mis Libros Leídos</a></li>
                                <li><a href="my_recommended_books.html"><i className="material-icons">book</i>Mis Libros Recomendados</a></li>
                            </ul>
                        )
                    }
                    else {
                        return (
                            <ul id="slide-out" className="sidenav">
                                <li>
                                    <div className="user-view">
                                        <div className="background"><img src="images/libros.jpg"/></div>
                                        <span className="white-text name">No conectado</span>
                                        <a href="start_session.html">Iniciar Sesión</a>
                                    </div>
                                </li>
        
                                <li><a href="user_registration.html"><i className="material-icons">perm_identity</i>Registrar Usuario</a></li>
                                <li><a href="book_registration.html"><i className="material-icons">book</i>Registrar Libro</a></li>
                                <li><a href="new_suggestion.html"><i className="material-icons">edit</i>Nueva Sugerencia</a></li>
                                <li><a href="free_themes.html"><i className="material-icons">remove_red_eye</i>Temas Libres</a></li>
                                <li><a href="books.html"><i className="material-icons">remove_red_eye</i>Ver Libros Añadidos</a></li>
                                <li><div className="divider"></div></li>
                                <li>
                                    <div className="center">
                                        <input style={{ width: '80%', margin: '0'}} placeholder="Buscar libro..." type="text" value={this.state.value} onChange={(e) => this.setState({ value: e.target.value, options: [] })} />
                                    </div>
                                    <div className="center collection" style={{ margin: '0 auto', width: '80%'}}>
                                        {
                                            this.state.options.map(item => { 
                                                return <a href={"/book_details.html?isbn=" + item.value} key={item.value} className="collection-item">{item.label}</a>;
                                            })
                                        }
                                    </div>
                                    <div className="center">
                                        <button className="btn" onClick={() => this.doSearch()}><i className="material-icons">search</i></button> 
                                    </div>   
                                </li>
                                <li><div className="divider"></div></li>
                            </ul> 
                        )
                    }
                })()}   
            </div>
        )
    }
}

