import TextEditor from "./TextEditor";
import DocumentsHome from "./DocumentsHome";
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

function AppRoutes() {
  const redirectUrl = `/documents/${uuidv4()}`;
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const location = useLocation(); // Now it works!

  const createNewDocument = () => {
    window.location.href = `/documents/${uuidv4()}`;
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/documents");

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
          {documents.length !== 0 ? (
            <button onClick={createNewDocument} className="createNewDocButton">
              <img src="/resources/newDoc.png" alt="new document" className="newDocImage" />
            </button>
          ) : (
            <p className="welcomeText">Welcome to your workspace</p>
          )}
        </nav>
      )}

      <Routes>
        <Route path="/documents" element={<DocumentsHome />} />
        <Route path="/" element={<Navigate to={redirectUrl} replace />} />
        <Route path="/documents/:id" element={<TextEditor />} />
      </Routes>
    </>
  );
}

export default AppRoutes;
