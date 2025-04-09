import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const { user, setUser, logout } = useContext(UserContext);
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [documents, setDocuments] = useState([]);
    const navigate = useNavigate();
    
    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setEmail(user.email || '');

            const fetchDocuments = async () => {
                try {
                    const response = await fetch(
                      `https://whitespace-je8t.onrender.com/api/documents/user/${user.id}`,
                      {
                        headers: {
                          Authorization: `Bearer ${user.token}`
                        }
                      }
                    );
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const data = await response.json();
                    setDocuments(data);
                } catch (err) {
                    console.error("Error fetching documents:", err);
                    setError("Failed to load documents. Please try again later.");
                }
            }
            fetchDocuments();
        }
    }, [user]);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setUsername(user.username || '');
        setEmail(user.email || '');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError(null);
    }

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword && newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        try {
            const updateData = {
                username,
                email
            };

            if (newPassword) {
                updateData.currentPassword = currentPassword;
                updateData.newPassword = newPassword;
            }

            const response = await fetch(`https://whitespace-je8t.onrender.com/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }

            const updatedUser = await response.json();
            setUser({
                ...updatedUser,
                token: user.token
            });
            
            setIsEditing(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setSuccess("Profile updated successfully.");
        } catch (error) {
            console.error('Profile update error:', error.message);
            setError(error.message || 'Failed to update profile');
        }
    }

    if (!user) {
        return <div>Please log in to view your profile.</div>;
    }

    return (
        <div className="profileContainer">
            <h1>User Profile</h1>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            
            {isEditing ? (
                <form onSubmit={handleSubmit} className="profile-form">
                    <label>
                        Username:
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </label>
                    <label>
                        Email:
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </label>
                    
                    {user.authType === 'local' && (
                        <>
                            <label>
                                Current Password:
                                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                            </label>
                            <label>
                                New Password:
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            </label>
                            <label>
                                Confirm New Password:
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            </label>
                        </>
                    )}
                    
                    <div className="button-group">
                        <button type="submit" className="save-button">Save Changes</button>
                        <button type="button" onClick={handleCancelClick} className="cancel-button">Cancel</button>
                    </div>
                </form>
            ) : (
                <div className="profileDetails">
                    <div className="profile-header">
                        <img 
                            src={user.profilePicture || "/resources/profiledefault.jpg"} 
                            alt="Profile" 
                            className="profile-image" 
                        />
                        <div className="profile-info">
                            <p><strong>Username:</strong> {user.username}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Account Type:</strong> {user.authType === 'google' ? 'Google' : 'Local'}</p>
                        </div>
                    </div>
                    
                    <div className="profile-actions">
                        <button onClick={handleEditClick} className="edit-button">Edit Profile</button>
                        <button onClick={handleLogout} className="logout-button">Logout</button>
                    </div>
                </div>
            )}
            
            {documents.length > 0 && (
                <div className="documentsList">
                    <h2>Your Documents</h2>
                    <div className="documents-grid">
                        {documents.map(doc => (
                            <a href={`/documents/${doc._id}`} key={doc._id} className="documentItem">
                                <div className="doc-icon">📄</div>
                                <div className="doc-title">{doc.title}</div>
                                <div className="doc-date">
                                    {new Date(doc.updatedAt).toLocaleDateString()}
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;