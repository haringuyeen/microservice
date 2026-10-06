import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ImportReceiptsPage from './pages/ImportReceiptsPage';
import ImportReceiptDetailPage from './pages/ImportReceiptDetailPage';
import ExportReceiptsPage from './pages/ExportReceiptsPage';
import ExportReceiptDetailPage from './pages/ExportReceiptDetailPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import OrdersPage from './pages/OrdersPage';

function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<LoginPage />} />

                    {/* All authenticated roles */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/products"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                                <ProductsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/products/:id"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                                <ProductDetailPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/import-receipts"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                                <ImportReceiptsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/import-receipts/:id"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                                <ImportReceiptDetailPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/export-receipts"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                                <ExportReceiptsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/export-receipts/:id"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                                <ExportReceiptDetailPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/orders"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                                <OrdersPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin and Manager Only */}
                    <Route
                        path="/categories"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                <CategoriesPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/suppliers"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                <SuppliersPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/suppliers/:id"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                <SupplierDetailPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/customers"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                <CustomersPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/customers/:id"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                <CustomerDetailPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/reports"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                <ReportsPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin Only */}
                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <UsersPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    );
}

export default App;