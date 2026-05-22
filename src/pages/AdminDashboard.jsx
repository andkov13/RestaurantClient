import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './AdminDashboard.css';

import StaffManager from '../components/StaffManager';
import CategoryManager from '../components/CategoryManager';
import MenuItemManager from '../components/MenuItemManager';
import IngredientManager from '../components/IngredientManager';

export default function AdminDashboard() {
    const { logout, user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('staff');

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h2>ERP Admin</h2>
                    <p>Welcome, {user?.username}</p>
                </div>
                <nav className="sidebar-nav">
                    <button 
                        className={activeTab === 'staff' ? 'active' : ''} 
                        onClick={() => setActiveTab('staff')}
                    >
                        Staff Management
                    </button>
                    <button 
                        className={activeTab === 'menu' ? 'active' : ''} 
                        onClick={() => setActiveTab('menu')}
                    >
                        Menu Management
                    </button>
                    <button 
                        className={activeTab === 'inventory' ? 'active' : ''} 
                        onClick={() => setActiveTab('inventory')}
                    >
                        Inventory Management
                    </button>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={logout} className="logout-btn">Log Out</button>
                </div>
            </aside>

            <main className="admin-content">
                {activeTab === 'staff' && <StaffManager />}

                {activeTab === 'menu' && (
                    <div className="tab-section">
                        <header className="content-header">
                            <h2>Menu & Inventory Management</h2>
                        </header>
                        <div className="menu-grid">
                            <div><CategoryManager /></div>
                            <div><MenuItemManager /></div>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="tab-section">
                        <header className="content-header">
                            <h2>Inventory Management</h2>
                        </header>
                        <IngredientManager /> 
                    </div>
                )}
            </main>
        </div>
    );
}