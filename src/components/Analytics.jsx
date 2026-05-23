import { useState, useEffect } from 'react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';
import './Analytics.css';

export default function Analytics() {
    const [snapshot, setSnapshot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chartView, setChartView] = useState('today');

    const [menuData, setMenuData] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [menuTimeframe, setMenuTimeframe] = useState('thisMonth');
    const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchSnapshot();
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchMenuIntelligence();
    }, [menuTimeframe, selectedCategory]);

    const fetchCategories = async () => {
            try {
                const response = await api.get('/categories');
                setCategories(response.data);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };

    const fetchSnapshot = async () => {
        try {
            const response = await api.get('/analytics/financial-snapshot');
            setSnapshot(response.data);
        } catch (error) {
            console.error("Failed to fetch financial snapshot", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenuIntelligence = async () => {
        try {
            let url = `/analytics/menu-intelligence?timeframe=${menuTimeframe}`;
            if (selectedCategory) {
                url += `&categoryId=${selectedCategory}`;
            }
            const response = await api.get(url);
            setMenuData(response.data);
        } catch (error) {
            console.error("Failed to fetch menu intelligence", error);
        }
    };

    if (loading) return <p style={{ padding: '20px' }}>Loading Financial Data...</p>;
    if (!snapshot) return <div className="error-banner">Failed to load analytics data.</div>;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uk-UA', { 
            style: 'currency', 
            currency: 'UAH' 
        }).format(amount);
    };

    const getCategoryName = (id) => {
        const cat = categories.find(c => c.categoryId == id); 
        return cat ? cat.name : `Category ${id}`;
    };

    const currentChartData = snapshot[chartView]?.chartData || [];

    return (
        <div className="analytics-container">
            <header className="content-header" style={{ marginBottom: '20px' }}>
                <h2>📈 Financial Overview</h2>
            </header>

            <div className="metrics-grid">
                {['today', 'thisWeek', 'thisMonth'].map((timeframe) => {
                    const data = snapshot[timeframe];
                    const titles = { today: 'Today', thisWeek: 'This Week', thisMonth: 'This Month' };
                    
                    return (
                        <div key={timeframe} className="card metric-card">
                            <h3>{titles[timeframe]}</h3>
                            <div className="metric-item">
                                <span className="metric-label">Revenue</span>
                                <span className="metric-value text-green">{formatCurrency(data?.revenue || 0)}</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">Orders</span>
                                <span className="metric-value">{data?.orderCount || 0}</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">Avg Order Value</span>
                                <span className="metric-value">{formatCurrency(data?.averageOrderValue || 0)}</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">Avg Ticket Time</span>
                                <span className="metric-value" style={{ color: '#8b5cf6' }}>
                                    {Math.round(data?.averageTicketTimeSeconds || 0)} sec
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Performance Trendlines</h3>
                    <select 
                        className="form-select" 
                        style={{ width: '200px' }}
                        value={chartView} 
                        onChange={(e) => setChartView(e.target.value)}
                    >
                        <option value="today">Today (Hourly)</option>
                        <option value="thisWeek">This Week (Daily)</option>
                        <option value="thisMonth">This Month (Daily)</option>
                    </select>
                </div>

                {currentChartData.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', paddingBottom: '50px'}}>
                        
                        <div style={{ height: '300px' }}>
                            <h4 style={{ textAlign: 'center', color: '#4b5563', marginBottom: '10px' }}>Revenue Trend</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={currentChartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="label" />
                                    <YAxis tickFormatter={(value) => `${value} ₴`} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend wrapperStyle={{ bottom: 0 }} />
                                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ height: '300px' }}>
                            <h4 style={{ textAlign: 'center', color: '#4b5563', marginBottom: '10px' }}>Order Volume</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={currentChartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="label" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ bottom: 0 }} />
                                    <Bar dataKey="orders" name="Number of Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ height: '300px' }}>
                            <h4 style={{ textAlign: 'center', color: '#4b5563', marginBottom: '10px' }}>Average Order Value (AOV)</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={currentChartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="label" />
                                    <YAxis tickFormatter={(value) => `${value} ₴`} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend wrapperStyle={{ bottom: 0 }} />
                                    <Line type="monotone" dataKey="averageOrderValue" name="Avg Order Value" stroke="#f59e0b" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ height: '300px' }}>
                            <h4 style={{ textAlign: 'center', color: '#4b5563', marginBottom: '10px' }}>Average Ticket Time</h4>
                            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                                <LineChart data={currentChartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="label" />
                                    <YAxis tickFormatter={(value) => `${value}s`} />
                                    <Tooltip formatter={(value) => `${value} sec`} />
                                    <Legend wrapperStyle={{ bottom: 0 }} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="averageTicketTimeSeconds" 
                                        name="Avg Time (sec)" 
                                        stroke="#8b5cf6" 
                                        strokeWidth={3} 
                                        dot={{ r: 4 }} 
                                        activeDot={{ r: 6 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                    </div>
                ) : (
                    <div className="text-center" style={{ padding: '50px 20px', color: '#6b7280', fontSize: '16px' }}>
                        No data available for this timeframe. Wait for new orders to come in!
                    </div>
                )}
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Menu Intelligence</h3>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <select 
                            className="form-select" 
                            style={{ width: '180px' }}
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>

                        <select 
                            className="form-select" 
                            style={{ width: '150px' }}
                            value={menuTimeframe} 
                            onChange={(e) => setMenuTimeframe(e.target.value)}
                        >
                            <option value="today">Today</option>
                            <option value="thisWeek">This Week</option>
                            <option value="thisMonth">This Month</option>
                        </select>
                    </div>
                </div>

                {!menuData || menuData.topSellingItems.length === 0 ? (
                    <div className="text-center" style={{ padding: '40px', color: '#6b7280' }}>
                        Not enough order data to generate menu intelligence for this selection.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                        
                        <div>
                            <h4 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📈 Best Performers
                            </h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left', color: '#6b7280' }}>
                                        <th style={{ padding: '10px' }}>Item</th>
                                        <th style={{ padding: '10px' }}>Category</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Sold</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menuData.topSellingItems.map((item, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '10px', fontWeight: 500 }}>{item.menuItemName}</td>
                                            <td style={{ padding: '10px', color: '#6b7280', fontSize: '13px' }}>
                                                {getCategoryName(item.categoryId)}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                                                {item.quantitySold}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>
                                                {formatCurrency(item.revenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div>
                            <h4 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📉 Worst Performers
                            </h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left', color: '#6b7280' }}>
                                        <th style={{ padding: '10px' }}>Item</th>
                                        <th style={{ padding: '10px' }}>Category</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Sold</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menuData.lowestPerformingItems.map((item, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '10px', fontWeight: 500 }}>{item.menuItemName}</td>
                                            <td style={{ padding: '10px', color: '#6b7280', fontSize: '13px' }}>
                                                {getCategoryName(item.categoryId)}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                                                {item.quantitySold}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#4b5563' }}>
                                                {formatCurrency(item.revenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h4 style={{ color: '#4b5563', margin: '0 0 10px 0' }}>
                                {selectedCategory ? 'Revenue By Menu Item' : 'Total Revenue By Category'}
                            </h4>
                            <div style={{ width: '100%', height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={selectedCategory 
                                                ? (menuData.revenueByItem || []).map(item => ({
                                                    name: item.menuItemName,
                                                    revenue: Number(item.revenue)
                                                }))
                                                : (menuData.revenueByCategory || []).map(item => ({
                                                    name: getCategoryName(item.categoryId),
                                                    revenue: Number(item.revenue)
                                                }))
                                            }
                                            dataKey="revenue"
                                            nameKey="name" 
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={50}
                                            paddingAngle={5}
                                            isAnimationActive={false}
                                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                        >
                                            {(selectedCategory ? (menuData.revenueByItem || []) : (menuData.revenueByCategory || [])).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}