import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/userContext';

const Register = () => {
    const { setUser } = useContext(UserContext);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validate passwords match
        if (password !== confirmPassword) {
          return setError('Passwords do not match');
        }
        
        setIsLoading(true);
    
        try { 
            const response = await fetch("https://whitespace-je8t.onrender.com/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Registration failed");
            }

            const data = await response.json();
            localStorage.setItem("token", data.token);
            setUser(data.user);
            navigate("/documents");
        }
        catch (err) {
            console.error("Registration error:", err);
            setError(err.message || "Registration failed. Please try again.");
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
                <h2>Register</h2>
                {error && <p className="error">{error}</p>}
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Registering...' : 'Register'}
                </button>
            </form>
            <p>Already have an account? <Link to="/login">Login</Link></p>
            <button onClick={handleGoogleLogin} className="googleLoginButton">Login with Google</button>
        </div>
    )
}
export default Register;