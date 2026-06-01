import React, { useState, useEffect } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import api from '../services/api';

export default function InventoryForecast() {
    const [ingredients, setIngredients] = useState([]);
    const [selectedIngredient, setSelectedIngredient] = useState('');
    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchIngredients();
    }, []);

    useEffect(() => {
        if (selectedIngredient) {
            fetchForecast(selectedIngredient);
        } else {
            setForecastData(null);
        }
    }, [selectedIngredient]);

    const fetchIngredients = async () => {
        try {
            const response = await api.get('/ingredients'); 
            setIngredients(response.data);
        } catch (error) {
            console.error("Failed to fetch ingredients", error);
        }
    };

    const fetchForecast = async (id) => {
        setLoading(true);
        try {
            const response = await api.get(`/Analytics/forecast/${id}`);
            setForecastData(response.data);
        } catch (error) {
            console.error("Failed to fetch forecast", error);
        } finally {
            setLoading(false);
        }
    };

    const futureChartData = forecastData?.chartData?.filter(item => item.actualUsage === null) || [];

    const usageChartData = forecastData?.chartData?.map((item, index, array) => {
        const hasActual = item.actualUsage !== null;
        const isLastActualDay = hasActual && (index === array.length - 1 || array[index + 1].actualUsage === null);

        if (hasActual && !isLastActualDay) {
            return { ...item, forecastedUsage: null };
        } 
        
        return item;
    }) || [];

    return (
        <div className="card" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>Usage Forecast</h3>
                
                <select 
                    className="form-select" 
                    style={{ width: '250px' }}
                    value={selectedIngredient} 
                    onChange={(e) => setSelectedIngredient(e.target.value)}
                >
                    <option value="">-- Choose ingredient --</option>
                    {ingredients.map(ing => (
                        <option key={ing.ingredientId} value={ing.ingredientId}>
                            {ing.name}
                        </option>
                    ))}
                </select>
            </div>

            {loading && <p className="text-center" style={{ color: '#6b7280' }}>Analyzing...</p>}

            {!loading && !forecastData && selectedIngredient && (
                <p className="text-center" style={{ color: '#ef4444' }}>Unable to generate usage forecast</p>
            )}

            {!loading && forecastData && (
                <div style={{ paddingBottom: '70px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '5px' }}>Current Stock</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                                {forecastData.currentStock} <span style={{ fontSize: '16px', fontWeight: 'normal' }}>{forecastData.unit}</span>
                            </div>
                        </div>

                        <div style={{ padding: '15px', border: '1px solid #c7d2fe', borderRadius: '8px', backgroundColor: '#eef2ff' }}>
                            <div style={{ color: '#4f46e5', fontSize: '14px', marginBottom: '5px', fontWeight: '500' }}>Recomended order</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4338ca' }}>
                                {forecastData.recommendedBoxesToOrder} <span style={{ fontSize: '16px', fontWeight: 'normal' }}>boxes</span>
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '13px' }}>
                                (Total: {forecastData.recommendedUnitsToOrder} {forecastData.unit})
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '60px' }}>
                        
                        <div style={{ height: '350px' }}>
                            <h4 style={{ textAlign: 'center', color: '#4b5563', marginBottom: '15px' }}>Usage</h4>
                            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                                <LineChart data={usageChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tick={{fontSize: 12}} />
                                    <YAxis tick={{fontSize: 12}} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ bottom: -10 }} />
                                    
                                    <Line 
                                        type="monotone" 
                                        dataKey="actualUsage" 
                                        name="Actual Usage" 
                                        stroke="#3b82f6" 
                                        strokeWidth={3} 
                                        dot={{ r: 4 }} 
                                        activeDot={{ r: 6 }} 
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="forecastedUsage" 
                                        name="EMA Forecast" 
                                        stroke="#f59e0b" 
                                        strokeWidth={2} 
                                        strokeDasharray="5 5" 
                                        dot={false} 
                                        connectNulls
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ height: '350px'}}>
                            <h4 style={{ textAlign: 'center', color: '#4b5563', marginBottom: '15px' }}>Forecasted Stock (end of the day)</h4>
                            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                                <LineChart data={futureChartData} margin={{ top: 35, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tick={{fontSize: 12}} />
                                    <YAxis tick={{fontSize: 12}} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ bottom: -10 }} />
                                    
                                    {futureChartData.map((entry, index) => {
                                        if (entry.isDeliveryDay) {
                                            return (
                                                <ReferenceLine 
                                                    key={`ref-${index}`} 
                                                    x={entry.date} 
                                                    stroke="#10b981" 
                                                    strokeDasharray="3 3" 
                                                    label={{ position: 'top', value: 'Delivery', fill: '#10b981', fontSize: 12, offset: 15 }} 
                                                />
                                            );
                                        }
                                        return null;
                                    })}

                                    <Line 
                                        type="linear" 
                                        dataKey="forecastedStock" 
                                        name="Forecasted Stock" 
                                        stroke="#8b5cf6" 
                                        strokeWidth={3} 
                                        dot={{ r: 5 }} 
                                        activeDot={{ r: 7 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}