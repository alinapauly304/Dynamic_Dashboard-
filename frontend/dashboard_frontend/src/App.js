import React,{useEffect,useState} from 'react';
import axios from 'axios';
import './App.css';

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
    <div>
      <h1>DYNAMIC DASHBOARD </h1>
      <p>Backend Says {message}</p>
    </div>
  );
}

export default App;
