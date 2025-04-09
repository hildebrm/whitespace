import { set } from "mongoose";
import React, { useState, useEffect } from "react";

const Profile = ({ user, setUser }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [documents, setDocuments] = useState([]);
    
    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setEmail(user.email || '');

            const fetchDocuments = async () => {
                try {
                    const response = await fetch(`https://whitespace-je8t.onrender.com/api/documents/${user._id}`);
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
            }

            if (newPassword) {
                updateData.currentPassword = newPassword;
                updateData.newPassword = newPassword;
            }

            const response = await fetch(`https://whitespace-je8t.onrender.com/api/users/${user._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update profile');
            }

            setUser(response.data.user);
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
                <form onSubmit={handleSubmit}>
                    <label>
                        Username:
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </label>
                    <label>
                        Email:
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </label>
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
                    <button type="submit">Save Changes</button>
                    <button type="button" onClick={handleCancelClick}>Cancel</button>
                </form>
            ) : (
                <div className="profileDetails">
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <button onClick={handleEditClick}>Edit Profile</button>
                </div>
            )}
            {documents.length > 0 && (
                <div className="documentsList">
                    <h2>Your Documents</h2>
                    {documents.map(doc => (
                        <div key={doc._id} className="documentItem">
                            {doc.title}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}