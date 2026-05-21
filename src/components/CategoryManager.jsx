import { useState, useEffect } from 'react';
import api from '../services/api';

export default function CategoryManager() {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch (error) {
            console.error("Failed to fetch categories");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/categories/${editingId}`, { name });
                setEditingId(null);
            } else {
                await api.post('/categories', { name });
            }
            setName('');
            fetchCategories();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to save category.';
            alert(errorMsg);
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.categoryId); 
        setName(category.name);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you whant to delete this category?')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error) {
            alert('Failed to delete category.');
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName('');
    };

    return (
        <div className="card">
            <h3>{editingId ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSubmit} className="inline-form" style={{ marginBottom: '20px' }}>
                <input 
                    type="text" 
                    placeholder="Category Name (e.g., Beverages)" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                />
                <button type="submit" className="btn-primary">
                    {editingId ? 'Update' : 'Add'}
                </button>
                {editingId && (
                    <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                )}
            </form>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(c => (
                        <tr key={c.categoryId}>
                            <td>{c.categoryId}</td>
                            <td>{c.name}</td>
                            <td>
                                <div className="actions-cell">
                                    <button className="btn-secondary" onClick={() => handleEdit(c)}>Edit</button>
                                    <button className="btn-danger" onClick={() => handleDelete(c.categoryId)}>Delete</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}