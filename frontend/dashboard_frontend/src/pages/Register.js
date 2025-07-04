import React, { useState, useEffect } from "react";
import './Register.css';
import { useNavigate } from "react-router-dom";
import { register_endpoint } from '../config';

function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role_id: 1, 
    organization_id: 1,
  });

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: "" });
    }

    // Real-time validation
    if (name === 'username') {
      validateUsername(value);
    } else if (name === 'email') {
      validateEmailField(value);
    } else if (name === 'password') {
      validatePassword(value);
      validatePasswordField(value);
    }
  };

  const validateUsername = (username) => {
    if (!username.trim()) {
      setFieldErrors(prev => ({ ...prev, username: "Username is required" }));
    } else if (username.length < 3) {
      setFieldErrors(prev => ({ ...prev, username: "Username must be at least 3 characters long" }));
    } else {
      setFieldErrors(prev => ({ ...prev, username: "" }));
    }
  };

  const validateEmailField = (email) => {
    if (!email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: "Email is required" }));
    } else if (!validateEmail(email)) {
      setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
    } else {
      setFieldErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const validatePasswordField = (password) => {
    if (!password) {
      setFieldErrors(prev => ({ ...prev, password: "Password is required" }));
    } else {
      const passwordValid = Object.values(passwordValidation).every(valid => valid);
      if (!passwordValid) {
        setFieldErrors(prev => ({ ...prev, password: "Please enter a strong password" }));
      } else {
        setFieldErrors(prev => ({ ...prev, password: "" }));
      }
    }
  };

  const validatePassword = (password) => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      // Updated to match backend validation - broader set of special characters
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordValidation(validation);
  };

  const validateEmail = (email) => {
    // More comprehensive email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!form.username.trim()) {
      setMsg("Username is required.");
      setMsgType("error");
      return false;
    }

    if (form.username.length < 3) {
      setMsg("Username must be at least 3 characters long.");
      setMsgType("error");
      return false;
    }

    if (!validateEmail(form.email)) {
      setMsg("Please enter a valid email address.");
      setMsgType("error");
      return false;
    }

    const passwordValid = Object.values(passwordValidation).every(valid => valid);
    if (!passwordValid) {
      setMsg("Please ensure your password meets all requirements.");
      setMsgType("error");
      return false;
    }

    return true;
  };

  // Check if form is valid whenever form data changes
  useEffect(() => {
    const passwordValid = Object.values(passwordValidation).every(valid => valid);
    const usernameValid = form.username.trim().length >= 3;
    const emailValid = validateEmail(form.email);
    const formValid = usernameValid && emailValid && passwordValid;
    
    setIsFormValid(formValid);
  }, [form, passwordValidation]);

  const register = async () => {
    if (!validateForm()) return;
    
    try {
      setMsg("Creating your account...");
      setMsgType("info");
      
      const res = await fetch(register_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.message) {
        setMsg("Account created successfully! You can now sign in.");
        setMsgType("success");
        
        // Reset form after successful registration
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else if (Array.isArray(data.detail)) {
        setMsg(data.detail[0].msg); 
        setMsgType("error");
      } else {
        setMsg(data.detail || data.message || "Registration failed. Please try again.");
        setMsgType("error");
      }
    } catch (err) {
      setMsg("Error connecting to server. Please check your connection.");
      setMsgType("error");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isFormValid) {
      register();
    }
  };

  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="authpage">
    <div className="register-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1>Register here </h1>
          <p>
            Already have an account? Sign in to access your personalized dashboard 
            and continue.
          </p>
          <button className="signin-link" onClick={goToLogin}>
            Sign In 
          </button>
        </div>
      </div>

      {/* Register Form Section */}
      <div className="form-section">
        <h2>Create Account</h2>
       
        <div className="input-field">
          <input
            name="username"
            type="text"
            placeholder="Username "
            value={form.username}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            required
          />
          {fieldErrors.username && (
            <div className="field-error">{fieldErrors.username}</div>
          )}
        </div>

        <div className="input-field">
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            required
          />
          {fieldErrors.email && (
            <div className="field-error">{fieldErrors.email}</div>
          )}
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
          {fieldErrors.password && (
            <div className="field-error">{fieldErrors.password}</div>
          )}
        </div>

        <button 
          className="register-btn" 
          onClick={register}
          disabled={!isFormValid}
        >
          Create Account
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

export default Register;