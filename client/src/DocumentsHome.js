import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

function DocumentsHome() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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

  const showDeleteConfirm = (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirmId(id);
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirmId(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${days[date.getDay()]} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const confirmDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`http://localhost:3001/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      setDocuments(documents.filter(doc => doc._id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Error deleting document:", err);
      setError("Failed to delete document. Please try again.");
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
          <div className="documentListView">
            <div className="listHeader">
              <div className="headerTitle">Title</div>
              <div className="headerDate">Last modified</div>
              <div className="headerActions">Actions</div>
            </div>
            
            {documents.map(doc => (
              <div key={doc._id} className="documentListItem">
                <div className="docListContent">
                  <div className="listItemIcon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8B6B4C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  </div>
                  
                  <div className="listItemTitle">
                    {editingId === doc._id ? (
                      <input 
                        type="text" 
                        value={newTitle} 
                        onChange={handleTitleChange} 
                        onBlur={(e) => handleBlurOrEnter(e, doc._id)}
                        onKeyDown={(e) => handleBlurOrEnter(e, doc._id)}
                        autoFocus
                        className="titleInput"
                      />
                    ) : (
                      <Link 
                        to={`/documents/${doc._id}`}
                        className="docTitleLink"
                      >
                        <span 
                          className="docTitle"
                          onClick={(e) => { 
                            if (deleteConfirmId === doc._id) {
                              e.preventDefault();
                            } else {
                            }
                          }}
                          title="Click to edit"
                        >
                          {doc.title || "Untitled Document"}
                        </span>
                      </Link>
                    )}
                  </div>
                  <div>
                    <svg className='editTitleIcon' xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "auto", padding: "1px", margin: "2px" }} viewBox="0 0 24 24" fill="none" stroke="#8B6B4C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" onClick={(e) => {
                      if (editingId === doc._id) {
                        saveTitle(doc._id);
                      } else {
                        handleTitleClick(doc._id, doc.title, e);
                      }
                    }
                    }>
                    <path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"></path>
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L9 19l-4 1 1-4L17 3z"></path>
                    <line x1="12" y1="11" x2="16" y2="11"></line>
                    <line x1="12" y1="15" x2="14" y2="15"></line>
                    </svg>
                  </div>
                  
                  <div className="listItemDate">
                    {formatDate(doc.updatedAt)}
                  </div>
                  
                  <div className="listItemActions">
                    {deleteConfirmId === doc._id ? (
                      <div className="listDeleteConfirm">
                        <span>Delete?</span>
                        <button 
                          onClick={(e) => confirmDelete(doc._id, e)}
                          className="confirmDeleteBtn"
                        >
                          Yes
                        </button>
                        <button 
                          onClick={cancelDelete}
                          className="cancelDeleteBtn"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => showDeleteConfirm(doc._id, e)}
                        className="listDeleteBtn"
                        title="Delete document"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="createNewDocButtonContainer">
            <button 
              onClick={createNewDocument}
              className="listViewNewDocButton"
            >
              + New Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentsHome;

