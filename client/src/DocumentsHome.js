import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

function DocumentsHome() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState("");

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

  const createNewDocument = () => {
    window.location.href = `/documents/${uuidv4()}`;
  };

  const handleTitleClick = (id, currentTitle, e) => {
    e.preventDefault();
    setEditingId(id);
    setNewTitle(currentTitle);
  };

  const handleTitleChange = (e) => {
    setNewTitle(e.target.value);
  };

  const saveTitle = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/documents/${id}/title`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        throw new Error("Failed to update title");
      }

      const updatedDoc = await response.json();
      setDocuments(documents.map(doc => (doc._id === id ? updatedDoc : doc)));
      setEditingId(null);
    } catch (err) {
      console.error("Error updating title:", err);
    }
  };

  const handleBlurOrEnter = (e, id) => {
    if (e.type === "blur" || (e.type === "keydown" && e.key === "Enter")) {
      saveTitle(id);
    }
  };

  if (loading) return (
    <div className="loadContainer">
      <div className="loader"></div>
    </div>
  );

  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;

  return (
    <div>
      {documents.length === 0 ? (
        <div className="noDocsContainer">
          <div className="text-center p-10 bg-gray-50 rounded-lg">
            <p className="mb-4 text-xl font-semibold text-gray-700">Let's get started...</p>
            <button 
              onClick={createNewDocument}
              className="noDocsNewDocButton"
            >
              Create Your First Document
            </button>
          </div>
        </div>
      ) : (
        <div className='homeContainer'>
        <div className="documentsListContainer">
          <img src="/resources/whatWriting.png" alt="writing" className="writingImage" />
        </div>
          <div className='documentGrid'>
          {documents.map(doc => (
            <div key={doc._id} className="documentItem">
                <Link 
                to={`/documents/${doc._id}`} 
                className="documentLink" 
                onClick={(e) => {
                    if (editingId === doc._id) {
                    e.preventDefault();
                    }
                }}
                >
                {editingId === doc._id ? (
                    <input 
                    type="text" 
                    value={newTitle} 
                    onChange={handleTitleChange} 
                    onBlur={(e) => handleBlurOrEnter(e, doc._id)}
                    onKeyDown={(e) => handleBlurOrEnter(e, doc._id)}
                    autoFocus
                    className="titleInput"
                    onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div 
                    className="docTitle"
                    onClick={(e) => { 
                        handleTitleClick(doc._id, doc.title, e); 
                    }}
                    title="Click to edit"
                    >
                    {doc.title || "Untitled Document"}
                    </div>
                )}

                <p className="docDate">Last edited: {new Date(doc.updatedAt).toLocaleString()}</p>
                </Link>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>

  );

}

export default DocumentsHome;

