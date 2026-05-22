import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './PosTerminal.css';

export default function PosTerminal() {
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cart, setCart] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPosData();
    }, []);

    const fetchPosData = async () => {
        try {
            setLoading(true);
            const [catsRes, itemsRes] = await Promise.all([
                api.get('/categories'),
                api.get('/menuitems') 
            ]);
            setCategories(catsRes.data);
            setMenuItems(itemsRes.data);
        } catch (error) {
            console.error("Failed to load POS data", error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(cartItem => cartItem.menuItemId === item.menuItemId);
            
            if (existingItem) {
                return currentCart.map(cartItem => 
                    cartItem.menuItemId === item.menuItemId
                        ? { ...cartItem, quantity: cartItem.quantity + 1 } 
                        : cartItem 
                );
            } else {
                return [...currentCart, { ...item, quantity: 1 }];
            }
        });
    };

    const updateQuantity = (menuItemId, amount) => {
        setCart(currentCart => {
            return currentCart.map(item => {
                if (item.menuItemId === menuItemId) {
                    const newQty = item.quantity + amount;
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            }).filter(Boolean); 
        });
    };

    const removeFromCart = (menuItemId) => {
        setCart(currentCart => currentCart.filter(item => item.menuItemId !== menuItemId));
    };

    const clearCart = () => setCart([]);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxRate = 0.2; 
    const tax = subtotal * taxRate;
    const total = subtotal;

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        
        try {
            setIsSubmitting(true);
            
            const orderPayload = {
                items: cart.map(item => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity
                }))
            };

            await api.post('/orders', orderPayload);
            
            alert('Order processed successfully!');
            clearCart();
        } catch (error) {
            const errorMsgBackend = error.response?.data?.Message;
            let errorMsg;
            if (errorMsgBackend.includes("Insufficient stock"))
                errorMsg = 'Insufficient stock to complete this order. Please check inventory.';
            else{
                errorMsg = "Failed to process order"
            }
            alert(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredItems = selectedCategory === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.categoryId === parseInt(selectedCategory));

    if (loading) return <div className="pos-loading">Loading POS Terminal...</div>;

    return (
        <div className="pos-layout">
            
            <section className="pos-main">
                <header className="pos-categories">
                    <button 
                        className={selectedCategory === 'all' ? 'cat-btn active' : 'cat-btn'}
                        onClick={() => setSelectedCategory('all')}
                    >
                        All Items
                    </button>
                    {categories.map(cat => (
                        <button 
                            key={cat.categoryId}
                            className={selectedCategory === cat.categoryId.toString() ? 'cat-btn active' : 'cat-btn'}
                            onClick={() => setSelectedCategory(cat.categoryId.toString())}
                        >
                            {cat.name}
                        </button>
                    ))}
                </header>

                <div className="pos-grid">
                    {filteredItems.map(item => (
                        <button 
                            key={item.menuItemId} 
                            className="menu-item-card"
                            onClick={() => addToCart(item)}
                        >
                            <span className="item-name">{item.name}</span>
                            <span className="item-price">₴ {item.price.toFixed(2)}</span>
                        </button>
                    ))}
                    {filteredItems.length === 0 && (
                        <p className="no-items">No active menu items in this category.</p>
                    )}
                </div>
            </section>

            <aside className="pos-sidebar">
                <div className="cart-header">
                    <div>
                        <h3>📝 Current Ticket</h3>
                        <p className="cashier-tag">👤 Register: {user?.username}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => navigate('/queue')} 
                            style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #2563eb', background: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold' }}
                        >
                            View Queue
                        </button>
                        <button onClick={logout} className="pos-logout">Exit</button>
                    </div>
                </div>

                <div className="cart-items">
                    {cart.map(item => (
                        <div key={item.menuItemId} className="cart-item-row">
                            <div className="item-details">
                                <span className="cart-item-name">{item.name}</span>
                                <span className="cart-item-price">₴ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            <div className="item-controls">
                                <div className="qty-picker">
                                    <button onClick={() => updateQuantity(item.menuItemId, -1)}>-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.menuItemId, 1)}>+</button>
                                </div>
                                <button className="delete-item" onClick={() => removeFromCart(item.menuItemId)}>×</button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="empty-cart-view">
                            <p>Ticket is empty</p>
                            <span>Tap items on the left to build order</span>
                        </div>
                    )}
                </div>

                <div className="cart-footer">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>₴ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Tax (20%)</span>
                        <span>₴ {tax.toFixed(2)}</span>
                    </div>
                    <div className="summary-row total-row">
                        <span>Total Due</span>
                        <span>₴ {total.toFixed(2)}</span>
                    </div>

                    <div className="checkout-actions">
                        <button 
                            className="btn-clear" 
                            onClick={clearCart} 
                            disabled={cart.length === 0 || isSubmitting}
                        >
                            Clear
                        </button>
                        <button 
                            className="btn-checkout" 
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : 'Charge / Pay'}
                        </button>
                    </div>
                </div>
            </aside>
            
        </div>
    );
}