import React, { useState } from "react";

function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role_name: "", 
    organization_name: "",
  });

  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const register = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.message) {
        setMsg(data.message);
      } else if (Array.isArray(data.detail)) {
        setMsg(data.detail[0].msg); 
      } else {
        setMsg(data.detail || "Something went wrong.");
      }
    } catch (err) {
      setMsg("Error connecting to server.");
    }
  };

  return (
    <div className="box">
      <h2>Register</h2>

      <div>
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
        />
      </div>

        
      <div>
        <input
          name="email"
          type="email"
          placeholder="email"
          value={form.email}
          onChange={handleChange}
        />
      </div>
      <div>
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />
      </div>

      <div className="s1">
        <select name="role_name" value={form.role_name} onChange={handleChange}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <input
          name="organization_name"
          placeholder="Organization Name"
          value={form.organization_name}
          onChange={handleChange}
        />
      </div>

      <div>
        <button onClick={register}>Register</button>
      </div>

      <p>{msg}</p>
    </div>
  );
}

export default Register;
