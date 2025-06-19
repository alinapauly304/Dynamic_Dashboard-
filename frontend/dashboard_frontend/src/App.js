import React,{useEffect,useState} from 'react';
import axios from 'axios';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UserPanel from './pages/user_panel';
import AdminPanel from './pages/admin_panel';
import { backend_url } from './config';




function App() {

const[message,setMessage] =useState('');

 

   

useEffect(() => {
    axios.get(backend_url)
      .then(res => {
        setMessage(res.data.message);
      })
      .catch(err => {
        console.error('Error fetching from FastAPI:', err);
      });
  }, []);

  return (
        <Router>
      <div className="App">

        <Routes>
          <Route path="/" element={<Login />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
<Route path="/userpanel/*" element={<UserPanel />} />
<Route path="/adminpanel/*" element={<AdminPanel />} />

          <Route path="*" element={<h2>404 Not Found</h2>} />

        </Routes>

      </div>
    </Router>
  );
}

export default App;
