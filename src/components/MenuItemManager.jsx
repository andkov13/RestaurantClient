// src/components/MenuItemManager.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function MenuItemManager() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        categoryId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [itemsRes, catsRes] = await Promise.all([
                api.get('/menuitems'),
                api.get('/categories')
            ]);
            setItems(itemsRes.data);
            setCategories(catsRes.data);
        } catch (error) {
            console.error("Failed to load menu data");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                name: formData.name,
                price: parseFloat(formData.price),
                categoryId: parseInt(formData.categoryId, 10) 
            };

            if (editingId) {
                await api.put(`/menuitems/${editingId}`, payload);
                setEditingId(null);
            } else {
                await api.post('/menuitems', payload);
            }
            
            setFormData({ name: '', price: '', categoryId: '' });
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to save menu item.';
            alert(errorMsg);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.menuItemId); 
        setFormData({
            name: item.name,
            price: item.price,
            categoryId: item.categoryId
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this menu item?')) return;
        try {
            await api.delete(`/menuitems/${id}`);
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message
            alert(errorMsg);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', price: '', categoryId: '' });
    };

    return (
        <div className="card">
            <h3>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
            <form onSubmit={handleSubmit} className="inline-form" style={{ marginBottom: '20px' }}>
                <input 
                    type="text" name="name" placeholder="Item Name" 
                    value={formData.name} onChange={handleChange} required 
                />
                <input 
                    type="number" name="price" placeholder="Price (₴)" step="1"
                    value={formData.price} onChange={handleChange} required style={{ maxWidth: '100px' }}
                />
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                    <option value="" disabled>Select Category</option>
                    {categories.map(c => (
                        <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                    ))}
                </select>
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'}</button>
                {editingId && <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>}
            </form>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => {
                        const cat = categories.find(c => c.categoryId === item.categoryId);
                        return (
                            <tr key={item.menuItemId}>
                                <td>{item.name}</td>
                                <td>₴ {item.price.toFixed(2)}</td>
                                <td><span className="badge cashier">{cat ? cat.name : 'Unknown'}</span></td>
                                <td>
                                    <div className="actions-cell">
                                        <button className="btn-secondary" onClick={() => handleEdit(item)}>Edit</button>
                                        <button className="btn-danger" onClick={() => handleDelete(item.menuItemId)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}