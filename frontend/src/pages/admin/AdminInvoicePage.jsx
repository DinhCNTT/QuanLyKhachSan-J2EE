import { useState, useEffect } from 'react';
import { ClipboardList, Receipt, ChevronLeft, ChevronRight, TrendingUp, Calendar, CreditCard, Banknote, User } from 'lucide-react';
import api from '../../api/api';
import styles from './AdminTable.module.css';

const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const SkeletonRow = () => (
    <tr>
        {[1, 2, 3, 4, 5].map(i => (
            <td key={i}><div className={`skeleton ${styles.skeletonCell}`} /></td>
        ))}
    </tr>
);

const AdminInvoicePage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            try { setInvoices(await api.get('/invoices')); } finally { setLoading(false); }
        };
        fetchInvoices();
    }, []);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalCount = invoices.length;
    // Tạm tính thu nhập trung bình 1 hoá đơn
    const avgRevenue = totalCount > 0 ? totalRevenue / totalCount : 0;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentInvoices = invoices.slice(indexOfFirstItem, Math.min(indexOfLastItem, invoices.length));
    const totalPages = Math.ceil(invoices.length / itemsPerPage);

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <div className={styles.pageHeader} style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        <Receipt size={22} style={{ color: 'var(--primary)' }} /> Lịch sử Hóa đơn
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
                        Quản lý và theo dõi doanh thu thanh toán
                    </p>
                </div>
            </div>

            {/* Dashboard Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Doanh Thu */}
                <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '12px', padding: '20px', color: '#fff', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng doanh thu</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', lineHeight: 1 }}>{totalRevenue.toLocaleString('vi-VN')} đ</h2>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                {/* Số lượng Hóa đơn */}
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Số lượng hóa đơn</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', lineHeight: 1, color: 'var(--text-main)' }}>{totalCount}</h2>
                        </div>
                        <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '10px', borderRadius: '12px' }}>
                            <ClipboardList size={24} />
                        </div>
                    </div>
                </div>

                {/* Trung bình / hóa đơn */}
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trung bình / Hóa đơn</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', lineHeight: 1, color: 'var(--text-main)' }}>{Math.round(avgRevenue).toLocaleString('vi-VN')} đ</h2>
                        </div>
                        <div style={{ background: '#f5f3ff', color: '#8b5cf6', padding: '10px', borderRadius: '12px' }}>
                            <Banknote size={24} />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableToolbar} style={{ justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClipboardList size={18} style={{ color: 'var(--text-secondary)' }} /> Bảng kê chi tiết
                    </h3>
                    <div className={styles.tableInfo}>
                        Hiển thị {invoices.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, invoices.length)} trên {invoices.length} kết quả
                    </div>
                </div>

                <div className={styles.tableScroll}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>MÃ HĐ</th>
                                <th>PHÒNG</th>
                                <th>KHÁCH HÀNG</th>
                                <th>PHƯƠNG THỨC</th>
                                <th>NGÀY THANH TOÁN</th>
                                <th style={{ textAlign: 'right' }}>TỔNG TIỀN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                : currentInvoices.map((inv, idx) => {
                                    // Parse date
                                    const rawDate = inv.createdAt || inv.paymentDate || new Date();
                                    const dateObj = new Date(rawDate);
                                    const dateStr = dateObj.toLocaleDateString('vi-VN');
                                    const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                                    // Lấy paymentMethod nếu có, mặc định là Tiền mặt (CASH)
                                    const payMethod = inv.paymentMethod || 'CASH';

                                    return (
                                        <tr key={inv.id}>
                                            <td style={{ width: '80px' }}>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                                    INV-{String(indexOfFirstItem + idx + 1).padStart(3, '0')}
                                                </span>
                                            </td>
                                            <td style={{ width: '100px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-main)' }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div>
                                                    {inv.roomNumber}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        background: '#e2e8f0', color: '#475569',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, fontSize: '0.8rem', flexShrink: 0
                                                    }}>
                                                        {getInitials(inv.guestName || '?')}
                                                    </div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                                        {inv.guestName}
                                                        {inv.phone && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>{inv.phone}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {payMethod === 'CASH' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#059669', background: '#dcfce7', padding: '4px 10px', borderRadius: '99px' }}><Banknote size={14} /> Tiền mặt</span>}
                                                {payMethod === 'CARD' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '99px' }}><CreditCard size={14} /> Quẹt thẻ</span>}
                                                {payMethod === 'TRANSFER' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#8b5cf6', background: '#f5f3ff', padding: '4px 10px', borderRadius: '99px' }}><TrendingUp size={14} /> Chuyển khoản</span>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>{dateStr}</span>
                                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{timeStr}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>
                                                    {inv.totalAmount?.toLocaleString('vi-VN')} đ
                                                </strong>
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </div>

                {!loading && invoices.length === 0 && (
                    <div className={styles.emptyState}>
                        <Receipt size={36} style={{ color: '#cbd5e1', margin: '0 auto 1rem', display: 'block' }} />
                        <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Chưa có hóa đơn</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Các giao dịch thanh toán thành công sẽ hiển thị tại đây.</p>
                    </div>
                )}

                {invoices.length > itemsPerPage && (
                    <div className={styles.pagination}>
                        <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                            ← Trang trước
                        </button>
                        <div className={styles.pageNumbers}>
                            {Array.from({ length: totalPages }).map((_, idx) => (
                                <button key={idx + 1} className={`${styles.pageNumber} ${currentPage === idx + 1 ? styles.active : ''}`} onClick={() => setCurrentPage(idx + 1)}>
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                        <button className={styles.pageBtn} disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                            Trang sau →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminInvoicePage;
