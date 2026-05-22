import { useState, useEffect } from 'react';
import api from '../services/api';
import './OrderTickets.css'; 

export default function KitchenDisplay() {
    const [orders, setOrders] = useState([]);
    const [now, setNow] = useState(new Date());

    const fetchKitchenOrders = async () => {
        try {
            const response = await api.get('/orders?status=New');
            
            const newOrders = response.data
                .sort((a, b) => new Date(a.createdAt + 'Z') - new Date(b.createdAt + 'Z'));
                
            setOrders(newOrders);
        } catch (error) {
            console.error("Failed to fetch kitchen orders", error);
        }
    };

    useEffect(() => {
        fetchKitchenOrders();
        
        const fetchInterval = setInterval(fetchKitchenOrders, 10000);
        
        const clockInterval = setInterval(() => setNow(new Date()), 1000);
        
        return () => {
            clearInterval(fetchInterval);
            clearInterval(clockInterval);
        };
    }, []);

    const markAsReady = async (orderId) => {
        try {
            await api.patch(`/orders/${orderId}/status`, '"In Progress"', {
                headers: { 'Content-Type': 'application/json' }
            });
            fetchKitchenOrders(); 
        } catch (error) {
            alert('Failed to update order status.');
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
        <div className="kds-layout">
            <header className="kds-header">
                <h2>🍳 Kitchen Display System</h2>
                <p>{orders.length} Orders Pending</p>
            </header>

            <div className="ticket-grid">
                {orders.map(order => {
                    const timeString = getTimeElapsed(order.createdAt);
                    
                    const diffMs = now - new Date(order.createdAt + 'Z');
                    const isUrgent = Math.floor(diffMs / 60000) >= 5; 

                    const sortedItems = [...(order.orderItems || [])].sort((a, b) => {
                        const catA = a.categoryId || a.menuItem?.categoryId || 0;
                        const catB = b.categoryId || b.menuItem?.categoryId || 0;
                        return catA - catB;
                    });

                    return (
                        <div key={order.orderId} className={`ticket-card ${isUrgent ? 'urgent' : ''}`}>
                            <div className="ticket-header">
                                <h3>Order #{order.displayNumber}</h3>
                                <span className="time-badge">{timeString}</span>
                            </div>
                            
                            <ul className="ticket-items">
                                {sortedItems.map(item => (
                                    <li key={item.orderItemId}>
                                        <strong>{item.quantity}x</strong> {item.menuItemName || item.menuItem?.name || 'Unknown Item'}
                                    </li>
                                ))}
                            </ul>

                            <button className="btn-ready" onClick={() => markAsReady(order.orderId)}>
                                Mark as Ready
                            </button>
                        </div>
                    );
                })}
                {orders.length === 0 && (
                    <div className="empty-state">No active orders.</div>
                )}
            </div>
        </div>
    );
}