import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './OrderTickets.css';

export default function ActiveOrders() {
    const [orders, setOrders] = useState([]);
    const [now, setNow] = useState(new Date());
    const navigate = useNavigate();

    const fetchActiveOrders = async () => {
        try {
            const response = await api.get('/orders');
            
            const active = response.data
                .filter(o => o.status === 'New' || o.status === 'In Progress')
                .sort((a, b) => new Date(a.createdAt + 'Z') - new Date(b.createdAt + 'Z'));
                
            setOrders(active);
        } catch (error) {
            console.error("Failed to fetch orders");
        }
    };

    useEffect(() => {
        fetchActiveOrders();
        const fetchInterval = setInterval(fetchActiveOrders, 10000);
        
        const clockInterval = setInterval(() => setNow(new Date()), 1000);
        
        return () => { clearInterval(fetchInterval); clearInterval(clockInterval); };
    }, []);

    const markAsCompleted = async (orderId) => {
        try {!
            await api.patch(`/orders/${orderId}/status`, '"Completed"', {
                headers: { 'Content-Type': 'application/json' }
            });
            fetchActiveOrders();
        } catch (error) {
            alert('Failed to complete order.');
        }
    };

    const getTimeElapsed = (createdAt) => {
        const diffMs = now - new Date(createdAt + 'Z');
        const totalSeconds = Math.floor(diffMs / 1000);
        
        if (totalSeconds < 0) return "00:00"; 
        
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="cashier-orders-layout">
            <header className="kds-header cashier-header">
                <h2>🛒 Active Orders Queue</h2>
                <button 
                    onClick={() => navigate('/pos')} 
                    style={{ background: 'white', color: '#2563eb', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    ← Back to Register
                </button>
            </header>

            <div className="ticket-grid">
                {orders.map(order => {
                    const timeString = getTimeElapsed(order.createdAt);
                    const isInProgress = order.status === 'In Progress';

                    const sortedItems = [...(order.orderItems || [])].sort((a, b) => {
                        const catA = a.categoryId || 0; 
                        const catB = b.categoryId || 0;
                        return catA - catB;
                    });

                    return (
                        <div key={order.orderId} className={`ticket-card ${isInProgress ? 'ready' : 'cooking'}`}>
                            <div className="ticket-header">
                                <h3>Order #{order.displayNumber}</h3>
                                <span className="time-badge">{timeString}</span>
                            </div>
                            
                            <div className="status-banner">
                                {isInProgress ? '🟢 Assembling' : '🟠 Cooking'}
                            </div>
                            
                            <ul className="ticket-items">
                                {sortedItems.map(item => (
                                    <li key={item.orderItemId}>
                                        <b>{item.quantity}x</b> {item.menuItemName || item.menuItem?.name || 'Unknown Item'}
                                    </li>
                                ))}
                            </ul>

                            <button 
                                className="btn-complete" 
                                onClick={() => markAsCompleted(order.orderId)}
                                disabled={!isInProgress}
                            >
                                {isInProgress ? 'Mark as Completed' : 'Waiting on Kitchen...'}
                            </button>
                        </div>
                    );
                })}
                {orders.length === 0 && (
                    <div className="empty-state">No active orders right now.</div>
                )}
            </div>
        </div>
    );
}