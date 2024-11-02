import React, { Component } from 'react';

export default class Footer extends Component {
    render() {
        return (
            <div>
                <footer className="page-footer green">
                    <div id="footer_normal" className="container">
                        TFG realizado por Alberto Silvestre Montes Linares
                        <a className="grey-text text-lighten-4 right" href="details.html">Detalles del proyecto</a>
                    </div>
                    <div id="footer_responsive">
                        <div className="row center-align">TFG realizado por Alberto Silvestre Montes Linares</div> 
                        <div className="row center-align"><a className="grey-text text-lighten-4" href="details.html">Detalles del proyecto</a></div>
                    </div>
                </footer>
            </div>
        )    
    }
}
