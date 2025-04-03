import TextEditor from "./TextEditor"
import DocumentsHome from "./DocumentsHome"
import AppRoutes from "./AppRoutes"
import { useEffect, useState } from "react"
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link
} from "react-router-dom"
import { v4 as uuidv4 } from 'uuid';

function App() {
  const redirectUrl = `/documents/${uuidv4()}`;
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          setLoading(false);
        } catch (err) {
          console.error('Error fetching documents:', err);
          setError('Failed to load documents. Please try again later.');
          setLoading(false);
        }
      };
  
      fetchDocuments();
    }, []);
  
  return (
    <Router>
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </Router>
  )
}
export default App
