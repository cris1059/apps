import './compartido/arranque.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { prepararIntro } from './components/Intro/estadoIntro';

// La intro de marca se marca antes de pintar, para que la página espere detrás.
prepararIntro();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
