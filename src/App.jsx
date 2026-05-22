import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PosTerminal from './pages/PosTerminal';
import KitchenDisplay from './pages/KitchenDisplay'; 
import ActiveOrders from './pages/ActiveOrders';

const Unauthorized = () => (
    <div style={{ padding: '20px', color: 'red' }}>
        <h2>403 - Unauthorized</h2>
        <p>You do not have permission to view this page.</p>
        <button onClick={() => window.location.href = '/'}>Go Home</button>
    </div>
);


const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};


function App() {
    const { user } = useContext(AuthContext);

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            
            <Route path="/pos" element={
                <ProtectedRoute allowedRoles={['Admin', 'Cashier']}>
                    <PosTerminal />
                </ProtectedRoute>
            } />

            <Route path="/kds" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                    <KitchenDisplay />
                </ProtectedRoute>
            } />

            <Route path="/queue" element={
                <ProtectedRoute allowedRoles={['Admin', 'Cashier']}>
                    <ActiveOrders />
                </ProtectedRoute>
            } />

            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route path="/" element={
                !user ? <Navigate to="/login" replace /> : 
                user.role === 'Admin' ? <Navigate to="/admin" replace /> : 
                <Navigate to="/pos" replace />
            } />
        </Routes>
    );
}

export default App;