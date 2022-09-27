import React, { Component } from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Tokens from './Tokens';
import Footer from './Footer';
import Tickets from './Tickets';
import Winner from './Winner';
import Home from './Home';

class App extends Component {
    
    render() {
        return (
            <BrowserRouter basename='/'>
                <div className="App">
                    <div>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/tokens" element={<Tokens />} />
                            <Route path="/tickets" element={<Tickets />} />
                            <Route path="/winner" element={<Winner />} />
                            <Route path="*" element={<Home />} />
                        </Routes>
                    </div>
                    <Footer />
                </div>
            </BrowserRouter>
        );
    }

}

export default App;