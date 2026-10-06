import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Boxes,
    LayoutDashboard,
    Package,
    ArrowDownToLine,
    ArrowUpFromLine,
    Tag,
    Truck,
    Users,
    BarChart3,
    ShieldCheck,
    LogOut,
    ShoppingBag,
    User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname.startsWith(path);

    const linkStyle = (path: string) => ({
        color: isActive(path) ? '#2563eb' : '#64748b',
        fontWeight: isActive(path) ? 600 : 500,
        textDecoration: 'none',
        padding: '6px 12px',
        borderRadius: 8,
        backgroundColor: isActive(path) ? '#eff6ff' : 'transparent',
        border: isActive(path) ? '1px solid #bfdbfe' : '1px solid transparent',
        fontSize: 13.5,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.15s ease'
    });

    const roleBadgeColor = () => {
        if (!user) return '#6b7280';
        if (user.role === 'ADMIN') return '#dc2626';
        if (user.role === 'MANAGER') return '#d97706';
        return '#059669';
    };

    const roleLabel = () => {
        if (!user) return '';
        if (user.role === 'ADMIN') return 'Quản trị viên';
        if (user.role === 'MANAGER') return 'Quản lý kho';
        return 'Nhân viên';
    };

    return (
        <nav className="no-print" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 24px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(8px)',
            flexWrap: 'wrap',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: 'var(--shadow-xs)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: 220, flexShrink: 0 }}>
                <Link to="/dashboard" style={{
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 16,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap'
                }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)'
                    }}>
                        <Boxes size={18} />
                    </div>
                    <span>QUẢN LÝ KHO HÀNG</span>
                </Link>
            </div>

            {isAuthenticated && (
                <div style={{
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    flexWrap: 'wrap'
                }}>
                    <Link to="/dashboard" style={linkStyle('/dashboard')}>
                        <LayoutDashboard size={15} />
                        <span>Tổng quan</span>
                    </Link>
                    <Link to="/products" style={linkStyle('/products')}>
                        <Package size={15} />
                        <span>Sản phẩm</span>
                    </Link>
                    <Link to="/import-receipts" style={linkStyle('/import-receipts')}>
                        <ArrowDownToLine size={15} />
                        <span>Nhập kho</span>
                    </Link>
                    <Link to="/export-receipts" style={linkStyle('/export-receipts')}>
                        <ArrowUpFromLine size={15} />
                        <span>Xuất kho</span>
                    </Link>
                    <Link to="/orders" style={linkStyle('/orders')}>
                        <ShoppingBag size={15} />
                        <span>Đơn hàng online</span>
                    </Link>

                    {/* MANAGER & ADMIN ONLY */}
                    {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                        <>
                            <Link to="/categories" style={linkStyle('/categories')}>
                                <Tag size={15} />
                                <span>Danh mục</span>
                            </Link>
                            <Link to="/suppliers" style={linkStyle('/suppliers')}>
                                <Truck size={15} />
                                <span>Nhà cung cấp</span>
                            </Link>
                            <Link to="/customers" style={linkStyle('/customers')}>
                                <Users size={15} />
                                <span>Khách hàng</span>
                            </Link>
                            <Link to="/reports" style={linkStyle('/reports')}>
                                <BarChart3 size={15} />
                                <span>Báo cáo</span>
                            </Link>
                        </>
                    )}

                    {/* ADMIN ONLY */}
                    {user?.role === 'ADMIN' && (
                        <Link to="/admin/users" style={linkStyle('/admin/users')}>
                            <ShieldCheck size={15} />
                            <span>Người dùng</span>
                        </Link>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, minWidth: 220, flexShrink: 0 }}>
                {isAuthenticated ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <UserIcon size={16} />
                            </div>
                            <div style={{ textAlign: 'left', fontSize: 13 }}>
                                <div style={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
                                    {user?.fullName || user?.username}
                                </div>
                                <span style={{
                                    fontSize: 11,
                                    padding: '1px 7px',
                                    borderRadius: 9999,
                                    backgroundColor: roleBadgeColor() + '16',
                                    color: roleBadgeColor(),
                                    fontWeight: 600,
                                    display: 'inline-block',
                                    marginTop: 2
                                }}>
                                    {roleLabel()}
                                </span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>
                            <LogOut size={14} />
                            <span>Đăng xuất</span>
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="btn btn-primary btn-sm">Đăng nhập</Link>
                )}
            </div>
        </nav>
    );
}