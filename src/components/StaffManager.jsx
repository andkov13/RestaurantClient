import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function StaffManager() {
    const { user } = useContext(AuthContext); 

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInactive, setShowInactive] = useState(false); 
    
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('Cashier');

    useEffect(() => {
        fetchUsers();
    }, [showInactive]); 

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/users?includeInactive=${showInactive}`);
            setUsers(response.data);
        } catch (err) {
            setError('Failed to load staff list.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterStaff = async (e) => {
        e.preventDefault();
        try {
            await api.post('/Auth/register', { 
                username: newUsername, 
                password: newPassword, 
                role: newRole 
            });
            setNewUsername('');
            setNewPassword('');
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create user.');
        }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this user?')) return;
        try {
            await api.put(`/users/${id}/deactivate`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to deactivate user.');
        }
    };

    const handleChangeRole = async (id, currentRole) => {
        const newTargetRole = currentRole === 'Admin' ? 'Cashier' : 'Admin';
        if (!window.confirm(`Change role to ${newTargetRole}?`)) return;
        
        try {
            await api.put(`/users/${id}/role`, { role: newTargetRole });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to change role.');
        }
    };

    return (
        <div className="tab-section">
            <header className="content-header">
                <h2>Staff Management</h2>
            </header>
            
            {error && <div className="error-banner">{error}</div>}

            <div className="card form-card">
                <h3>Register New Employee</h3>
                <form onSubmit={handleRegisterStaff} className="inline-form">
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={newUsername} 
                        onChange={(e) => setNewUsername(e.target.value)} 
                        required 
                        autoComplete="off"
                    />
                    <input 
                        type="password" 
                        placeholder="Temporary Password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        required 
                        autoComplete="new-password"
                    />
                    <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                        <option value="Cashier">Cashier</option>
                        <option value="Admin">Admin</option>
                    </select>
                    <button type="submit" className="btn-primary">Create User</button>
                </form>
            </div>

            <div className="card table-card">
                <div className="table-header-row">
                    <h3>Employee Directory</h3>
                    <label className="toggle-label">
                        <input 
                            type="checkbox" 
                            checked={showInactive} 
                            onChange={(e) => setShowInactive(e.target.checked)} 
                        />
                        Show Deactivated Staff
                    </label>
                </div>

                {loading ? <p>Loading staff...</p> : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.userId} className={!u.isActive ? 'inactive-row' : ''}>
                                    <td>{u.userId}</td>
                                    <td>{u.username}</td>
                                    <td>
                                        <span className={`badge ${u.role.toLowerCase()}`}>
                                            {u.role}
                                        </span>
                                        {!u.isActive && (
                                            <span className="badge inactive">Deactivated</span>
                                        )}
                                    </td>
                                    <td>
                                        {u.isActive && (
                                            <div className="actions-cell">
                                                <button 
                                                    className="btn-secondary"
                                                    onClick={() => handleChangeRole(u.userId, u.role)}
                                                    disabled={u.userId.toString() === user.userId} 
                                                >
                                                    Swap Role
                                                </button>
                                                <button 
                                                    className="btn-danger"
                                                    onClick={() => handleDeactivate(u.userId)}
                                                    disabled={u.userId.toString() === user.userId}
                                                >
                                                    Deactivate
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr><td colSpan="4" className="text-center">No staff found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}