import { useState, useEffect } from 'react';
import api from '../services/api';

export default function RecipeManager() {
    const [menuItems, setMenuItems] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [selectedMenuId, setSelectedMenuId] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        ingredientId: '',
        quantityRequired: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [menuRes, invRes] = await Promise.all([
                api.get('/menuitems'),
                api.get('/ingredients')
            ]);
            setMenuItems(menuRes.data);
            setIngredients(invRes.data);
        } catch (error) {
            console.error("Failed to load recipe data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedMenuId) {
            alert("Please select a Menu Item first.");
            return;
        }

        try {
            const payload = {
                menuItemId: parseInt(selectedMenuId),
                ingredientId: parseInt(formData.ingredientId),
                quantityRequired: parseFloat(formData.quantityRequired)
            };

            if (editingId) {
                await api.put(`/menuitemingredients/${editingId}`, payload);
                setEditingId(null);
            } else {
                await api.post('/menuitemingredients', payload);
            }
            
            setFormData({ ingredientId: '', quantityRequired: '' });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save recipe ingredient.');
        }
    };

    const handleEdit = (recipeItem) => {
        setEditingId(recipeItem.menuItemIngredientId);
        setFormData({
            ingredientId: recipeItem.ingredientId,
            quantityRequired: recipeItem.quantityRequired
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this ingredient from the recipe?')) return;
        try {
            await api.delete(`/menuitemingredients/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to remove ingredient.');
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ ingredientId: '', quantityRequired: '' });
    };

    const activeMenuItem = menuItems.find(m => m.menuItemId === parseInt(selectedMenuId));
    const activeRecipe = activeMenuItem?.ingredients || [];

    if (loading) return <p>Loading Recipe Manager...</p>;

    return (
        <div className="card">
            <header className="content-header" style={{ marginBottom: '20px' }}>
                <h3>Recipe Builder</h3>
            </header>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#f3f4f6', borderRadius: '8px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                    1. Select Menu Item to Edit Recipe:
                </label>
                <select 
                    className="form-select"
                    value={selectedMenuId} 
                    onChange={(e) => {
                        setSelectedMenuId(e.target.value);
                        cancelEdit(); 
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                    <option value="" disabled>-- Choose a Menu Item --</option>
                    {menuItems.map(m => (
                        <option key={m.menuItemId} value={m.menuItemId}>{m.name}</option>
                    ))}
                </select>
            </div>

            {selectedMenuId && (
                <>
                    <form onSubmit={handleSubmit} style={{ marginBottom: '25px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <h4 style={{ marginTop: 0 }}>{editingId ? 'Edit Ingredient' : '2. Add Ingredient to Recipe'}</h4>
                        <div className="inline-form" style={{ flexWrap: 'wrap', gap: '15px' }}>
                            <select 
                                className="form-select"
                                name="ingredientId" 
                                value={formData.ingredientId} 
                                onChange={handleChange} 
                                required
                                disabled={editingId !== null} 
                            >
                                <option value="" disabled>-- Select Inventory Item --</option>
                                {ingredients.map(inv => (
                                    <option key={inv.ingredientId} value={inv.ingredientId}>
                                        {inv.name} (measured in {inv.unit})
                                    </option>
                                ))}
                            </select>

                            <input 
                                type="number" 
                                name="quantityRequired" 
                                placeholder="Quantity Required" 
                                step="1" 
                                value={formData.quantityRequired} 
                                onChange={handleChange} 
                                required 
                                style={{ width: '180px' }}
                            />

                            <button type="submit" className="btn-primary">
                                {editingId ? 'Update Quantity' : 'Add to Recipe'}
                            </button>
                            {editingId && (
                                <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                            )}
                        </div>
                    </form>

                    <h4>Current Recipe for {activeMenuItem?.name}</h4>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Ingredient</th>
                                <th>Quantity Required</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeRecipe.map(item => {
                                const invItem = ingredients.find(i => i.ingredientId === item.ingredientId);
                                
                                return (
                                    <tr key={item.menuItemIngredientId}>
                                        <td>{invItem ? invItem.name : `Unknown (ID: ${item.ingredientId})`}</td>
                                        <td>
                                            <strong>{item.quantityRequired}</strong> {invItem?.unit}
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <button className="btn-secondary" onClick={() => handleEdit(item)}>Edit</button>
                                                <button className="btn-danger" onClick={() => handleDelete(item.menuItemIngredientId)}>Remove</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {activeRecipe.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="text-center" style={{ padding: '20px', color: '#6b7280' }}>
                                        No ingredients added to this recipe yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}