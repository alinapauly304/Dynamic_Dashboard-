import React,{useEffect,useState} from 'react';
import axios from 'axios';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UserPanel from './pages/user_panel';
import AdminPanel from './pages/admin_panel';



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
      <div className="App">

        <Routes>
          <Route path="/" element={
            <div className="home-buttons">
              
              <Link to="/login"><button>Login</button></Link>
              <Link to="/register"><button>Register</button></Link>
            </div>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
<Route path="/userpanel" element={<UserPanel />} />
<Route path="/adminpanel" element={<AdminPanel />} />

          <Route path="*" element={<h2>404 Not Found</h2>} />

        </Routes>

      </div>
    </Router>
  );
}

export default App;
