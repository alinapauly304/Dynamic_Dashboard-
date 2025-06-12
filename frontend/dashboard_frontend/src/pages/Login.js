import React, { useState } from "react";
import './Login.css';
import { useNavigate } from "react-router-dom";


function Login({ setUser }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");
const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const login = async () => {
    const res = await fetch("http://127.0.0.1:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

if (data.access_token) {
  setMsg("Login successful");
  localStorage.setItem("user_obj", JSON.stringify(data));

  if (data.role_id === 2) {
    navigate("/admin_panel");
  } else {
    navigate("/user_panel");
  }
} else {
  setMsg("Login failed: " + data.detail);
}


  };

  return (
    <div className="box">
      <h2>Login</h2>
      <input name="username" placeholder="Username" onChange={handleChange} />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} />
      <button onClick={login}>Login</button>
      <p>{msg}</p>
    </div>
  );
}

export default Login;
