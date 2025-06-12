import React,{useEffect,useState} from 'react';
import axios from 'axios';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function App() {

const[message,setMessage] =useState('');

useEffect(() => {
    axios.get('http://127.0.0.1:8000/')
      .then(res => {
        setMessage(res.data.message);
      })
      .catch(err => {
        console.error('Error fetching from FastAPI:', err);
      });
  }, []);

  return (
    <Router>
      <div>

        

        <Link to="/login"><button>Login</button></Link>
        <Link to="/register"><button>Register</button></Link>

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/userpanel" element={<user_panel/>} />
          <Route path="/adminpanel" element={<admin__panel/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
