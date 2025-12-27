import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppRoutes from './routes/AppRoutes';
import './styles.css';

export default function App(){
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <AppRoutes />
      </main>
    </BrowserRouter>
  )
}
