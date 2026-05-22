import { useState, useEffect } from 'react';
import api from '../services/api';

export default function InventoryManager() {
    const [inventory, setInventory] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        unit: 'pcs',
        lowStockThreshold: '',
        boxSize: ''
    });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/ingredients'); 
            setInventory(response.data);
        } catch (error) {
            console.error("Failed to load inventory");
        } finally {
            setLoading(false);
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
                quantity: parseFloat(formData.quantity),
                unit: formData.unit,
                lowStockThreshold: parseFloat(formData.lowStockThreshold),
                boxSize: parseFloat(formData.boxSize)
            };

            if (editingId) {
                await api.put(`/ingredients/${editingId}`, payload);
                setEditingId(null);
            } else {
                await api.post('/ingredients', payload);
            }
            
            setFormData({ name: '', quantity: '', unit: 'pcs', lowStockThreshold: '', boxSize: '' });
            fetchInventory();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to save inventory item.';
            alert(errorMsg);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.ingredientId); 
        setFormData({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            lowStockThreshold: item.lowStockThreshold,
            boxSize: item.boxSize
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
        try {
            await api.delete(`/ingredients/${id}`);
            fetchInventory();
        } catch (error) {
            alert('Failed to delete.');
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', quantity: '', unit: '', lowStockThreshold: '', boxSize: '' });
    };

    return (
        <div className="card">
            <h3>{editingId ? 'Edit Inventory Item' : 'Add New Stock'}</h3>
            
            <form onSubmit={handleSubmit} style={{ marginBottom: '25px' }}>
                <div className="inline-form" style={{ flexWrap: 'wrap', gap: '15px' }}>
                    <input 
                        type="text" name="name" placeholder="Item Name" 
                        value={formData.name} onChange={handleChange} required 
                        style={{ minWidth: '200px' }}
                    />
                    
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input 
                            type="number" name="quantity" placeholder="Current Qty" step="1"
                            value={formData.quantity} onChange={handleChange} required 
                            title="Current Quantity" style={{ width: '120px' }}
                        />
                        <select name="unit" value={formData.unit} onChange={handleChange} required>
                            <option value="pcs">Pieces</option>
                            <option value="g">Grams</option>
                            <option value="ml">Milliliters</option>
                        </select>
                    </div>

                    <input 
                        type="number" name="lowStockThreshold" placeholder="Low Stock Alert At" step="1"
                        value={formData.lowStockThreshold} onChange={handleChange} required 
                        title="Alert threshold" style={{ width: '150px' }}
                    />

                    <input 
                        type="number" name="boxSize" placeholder="Units per Box" step="1"
                        value={formData.boxSize} onChange={handleChange} required 
                        title="Box Size" style={{ width: '130px' }}
                    />

                    <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add Item'}</button>
                    {editingId && <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>}
                </div>
            </form>

            {loading ? <p>Loading inventory...</p> : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Current Stock</th>
                            <th>Box Size</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map(item => {
                            const isLowStock = item.quantity <= item.lowStockThreshold;
                            
                            return (
                                <tr key={item.ingredientId} style={{ backgroundColor: isLowStock ? '#fef2f2' : 'transparent' }}>
                                    <td style={{ fontWeight: '500' }}>{item.name}</td>
                                    <td>
                                        <strong style={{ color: isLowStock ? '#dc2626' : 'inherit' }}>
                                            {item.quantity} {item.unit}
                                        </strong>
                                    </td>
                                    <td>{item.boxSize} {item.unit}/box</td>
                                    <td>
                                        {isLowStock ? (
                                            <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                                                Low Stock (≤ {item.lowStockThreshold})
                                            </span>
                                        ) : (
                                            <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                                                In Stock
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            <button className="btn-secondary" onClick={() => handleEdit(item)}>Edit</button>
                                            <button className="btn-danger" onClick={() => handleDelete(item.ingredientId)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {inventory.length === 0 && (
                            <tr><td colSpan="5" className="text-center">No inventory items found.</td></tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}