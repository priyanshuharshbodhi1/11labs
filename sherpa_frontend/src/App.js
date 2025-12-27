import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CityMap from './components/CityMap';
import LandingPage from './components/LandingPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<CityMap />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
