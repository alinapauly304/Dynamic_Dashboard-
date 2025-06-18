import React, { useState } from "react";
import './Login.css';
import { useNavigate } from "react-router-dom";
import { login_endpoint } from '../config';

function Login({ setUser }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const login = async () => {
    try {
      const res = await fetch(login_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.access_token) {
        setMsg("Login successful! Redirecting...");
        setMsgType("success");
        localStorage.setItem("user_obj", JSON.stringify(data));

        // Redirect after a brief delay to show success message
        setTimeout(() => {
          if (data.role_id === 2) {
            navigate("/adminpanel");
          } else {
            navigate("/userpanel");
          }
        }, 1000);
      } else {
        setMsg("Login failed: " + (data.detail || "Invalid credentials"));
        setMsgType("error");
      }
    } catch (error) {
      setMsg("Network error. Please try again.");
      setMsgType("error");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      login();
    }
  };

  const goToRegister = () => {
    navigate("/register");
  };

  return (
     <div className="authpage">
    <div className="login-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome to Dynamic Dashboard</h1>

          <button className="signup-link" onClick={goToRegister}>
            Create New Account
          </button>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="form-section">
        <h2>Sign In</h2>
        
        
        <div className="input-field">
          <input
            name="username"
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            required
          />
        </div>

        <div className="input-field">
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            required
          />
        </div>

        <button className="login-btn" onClick={login}>
          Sign In
        </button>

        {msg && (
          <div className={`form-msg ${msgType}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default Login;