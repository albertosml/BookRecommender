import React, { Component } from 'react';
import { render } from 'react-dom';

import Menu from './Menu';
import Footer from './Footer';

class Detalles extends Component {
    render() {
        return (
            <div>
                <Menu/>

                <h3 className="center-align">Detalles</h3>
                
                <div className="row" style={{ marginTop: '3%'}}>
                    <div className="col s5 offset-s1">
                        <p><strong>Nombre:</strong> Alberto Silvestre Montes Linares</p>
                        <p><strong>Correo:</strong> albertosml@correo.ugr.es / bookrecommender0@gmail.com</p>
                        <p><strong>Cuenta de Github:</strong> albertosml</p> 
                        <p><strong>Tutor del proyecto:</strong> Juan Manuel Fernández Luna</p>   
                    </div>
                    <img className="col s3 offset-s1 circle responsive-img" src="images/albertosml.png" />
                </div>

                <div className="row">
                    <p className="col s10 offset-s1"><strong>Descripción del proyecto:</strong></p>
                    <p className="col s10 offset-s1">Este proyecto es un "Trabajo Fin de Grado" que tiene como objetivo el desarrollo de una plataforma web que permita 
                    a los usuarios registrados poder dar de alta libros que hayan leído, valorarlos y comentarlos y ponerlos a disposición 
                    de otros usuarios, que a su vez, podrán realizar las mismas acciones sobre ellos. Además, tendrá prestaciones de búsqueda 
                    de libros y recomendación de nuevos a los usuarios del sistema. El desarrollo se realizará tanto para la Web como para 
                    dispositivos móviles en forma de aplicación.</p>
                </div>
                
                <Footer/>
            </div>
        )
    }
}

render(<Detalles/>, document.getElementById('base'));
