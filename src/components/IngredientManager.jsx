import { useState, useEffect } from 'react';
import api from '../services/api';
import InventoryForecast from './InventoryForecast'; 

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

    const handleExportToExcel = async () => {
        try {
            const response = await api.get('/Analytics/export-excel', { responseType: 'blob' });
            
            const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;

            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const timestamp = `${year}-${month}-${day}_${hours}-${minutes}`;

            link.setAttribute('download', `Inventory_Report_${timestamp}.xlsx`);
            
            document.body.appendChild(link);
            link.click();
            
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download Excel report", error);
            alert("Failed to download Excel report");
        }
    };

    return (
        <div className="inventory-container">
            <div className="card" style={{ marginBottom: '20px' }}>
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
                                type="number" name="quantity" placeholder="Current Qty" step="0.01"
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
                            type="number" name="lowStockThreshold" placeholder="Low Stock Alert At" step="0.01"
                            value={formData.lowStockThreshold} onChange={handleChange} required 
                            title="Alert threshold" style={{ width: '150px' }}
                        />

                        <input 
                            type="number" name="boxSize" placeholder="Units per Box" step="0.01"
                            value={formData.boxSize} onChange={handleChange} required 
                            title="Box Size" style={{ width: '130px' }}
                        />

                        <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add Item'}</button>
                        {editingId && <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>}
                    </div>
                </form>

                {loading ? <p>Loading inventory...</p> : (
                    <div style={{ marginTop: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>Current Stock</h3>
                            <button 
                                className="btn-secondary" 
                                onClick={handleExportToExcel}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                📊 Export to exel
                            </button>
                        </div>
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
                                                    <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                                        Low Stock (≤ {item.lowStockThreshold})
                                                    </span>
                                                ) : (
                                                    <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                                        In Stock
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="actions-cell" style={{ display: 'flex', gap: '8px' }}>
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
                    </div>
                )}
            </div>

            <InventoryForecast />

        </div>
    );
}