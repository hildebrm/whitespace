import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = ({setUser}) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch("https://whitespace-je8t.onrender.com/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            localStorage.setItem("token", response.data.token);
            setUser(response.data.user)
            navigate("/documents");
        } catch (err) {
            console.error("Login error:", err);
            setError("Invalid username or password.");
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleGoogleLogin = () => {
        window.location.href = "https://whitespace-je8t.onrender.com/api/auth/google";
    }

    return (
        <div className="loginContainer">
            <img src="/resources/logo2.png" alt="logo" className="logo" />
            <form onSubmit={handleSubmit} className="loginForm">
                <h2>Login</h2>
                {error && <p className="error">{error}</p>}
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                </button>
            </form>
            <button onClick={handleGoogleLogin} className="googleLoginButton">
                Login with Google
            </button>
            <Link to="/register" className="registerLink">Don't have an account? Register</Link>
        </div>
    )
}
export default Login;
