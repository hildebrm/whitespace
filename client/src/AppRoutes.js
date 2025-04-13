import TextEditor from "./components/TextEditor";
import DocumentsHome from "./components/DocumentsHome";
import Login from "./components/Login";
import Register from "./components/Register";
import { useEffect, useState, useContext } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Profile from "./components/Profile";
import { UserContext } from "./context/userContext";

function AppRoutes() {
  const { user } = useContext(UserContext);
  const redirectUrl = `/documents/${uuidv4()}`;
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const location = useLocation();

  const createNewDocument = () => {
    window.location.href = `/documents/${uuidv4()}`;
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("https://whitespace-je8t.onrender.com/api/documents");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError("Failed to load documents. Please try again later.");
      }
    };

    fetchDocuments();
  }, []);

  const isTextEditor = location.pathname.startsWith("/documents/") && location.pathname.length > 11;

  return (
    <>
      {!isTextEditor && (
        <nav className="headerContainer">
          <Link to={"/documents"} className="headerLink">
            <img src="/resources/logo2.png" alt="logo" className="logo" />
          </Link>
          <div className="nav-right">
            {user ? (
              <Link to="/profile" className="profile-link">
                <img 
                  src={user.profilePicture || "/resources/profiledefault.jpg"} 
                  alt="Profile" 
                  className="profile-image-small" 
                />
              </Link>
            ) : (
              <Link to="/login" className="login-link">Login</Link>
            )}              
              <p className="welcomeText">Welcome to your workspace</p>
          </div>
        </nav>
      )}

      <Routes>
        <Route path="/documents" element={<DocumentsHome />} />
        <Route path="/" element={<Navigate to={redirectUrl} replace />} />
        <Route path="/documents/:id" element={<TextEditor />} />
        <Route path="/login" element={user ? <Navigate to="/documents" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/documents" /> : <Register />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/auth-callback" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default AppRoutes;