import { useState, useEffect } from 'react';
import { Plus, LockKeyhole, LockKeyholeOpen, X, Users, ShieldCheck, ConciergeBell, Clock, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminTable.module.css';
import modalStyles from '../../components/Modal.module.css';
import Toast from '../../components/Toast';

const getInitials = (name = '') =>
    name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const getRoleColor = (role) => role === 'ADMIN'
    ? { bg: '#fef3c7', color: '#92400e', icon: <ShieldCheck size={13} /> }
    : { bg: '#ede9fe', color: '#5b21b6', icon: <ConciergeBell size={13} /> };

const SkeletonRow = () => (
    <tr>
        {[1, 2, 3, 4, 5].map(i => (
            <td key={i}><div className={`skeleton ${styles.skeletonCell}`} /></td>
        ))}
    </tr>
);

const formatLastActive = (dateArray) => {
    if (!dateArray) return null;
    let parsedDate;
    if (Array.isArray(dateArray)) {
        const [year, month, day, hour, minute, second] = dateArray;
        parsedDate = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
    } else {
        parsedDate = new Date(dateArray);
    }
    const diffMs = new Date() - parsedDate;
    if (diffMs < 0) return 'Vừa xong';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${Math.floor(diffHours / 24)} ngày trước`;
};

const AdminStaffPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', fullName: '', role: 'RECEPTIONIST' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const { user: currentUser } = useAuth();

    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 8;

    const fetchUsers = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            setUsers(await api.get('/users'));
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        const interval = setInterval(() => fetchUsers(false), 10000);
        return () => clearInterval(interval);
    }, []);

    const handleToggle = async (u) => {
        await api.put(`/users/${u.id}/toggle`);
        setToast({ message: u.active ? `Đã khóa tài khoản ${u.fullName}` : `Đã mở khóa ${u.fullName}`, type: 'info' });
        fetchUsers(false);
    };

    const openModal = () => {
        setError('');
        setFormData({ username: '', password: '', fullName: '', role: 'RECEPTIONIST' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!formData.username || !formData.password || !formData.fullName) {
            setError('Vui lòng điền đầy đủ thông tin'); return;
        }
        setIsSubmitting(true);
        try {
            await api.post('/users', formData);
            setShowModal(false);
            setToast({ message: `Đã tạo tài khoản cho ${formData.fullName}`, type: 'success' });
            fetchUsers(false);
        } catch (err) {
            setError(err.message || 'Tên đăng nhập đã tồn tại hoặc lỗi hệ thống');
        } finally {
            setIsSubmitting(false);
        }
    };

    const indexOfLast = currentPage * usersPerPage;
    const indexOfFirst = indexOfLast - usersPerPage;
    const currentUsers = users.slice(indexOfFirst, Math.min(indexOfLast, users.length));
    const totalPages = Math.ceil(users.length / usersPerPage);

    const activeCount = users.filter(u => u.active && u.online).length;
    const totalCount = users.length;

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        <Users size={22} style={{ color: 'var(--primary)' }} /> Quản lý Nhân sự
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
                        {totalCount} nhân viên · <span style={{ color: 'var(--success)' }}>{activeCount} đang online</span>
                    </p>
                </div>
                <button onClick={openModal} className={styles.btnAdd}>
                    <Plus size={16} /> Thêm nhân viên
                </button>
            </div>

            {/* Table */}
            <div className={styles.tableCard}>
                <div className={styles.tableToolbar} style={{ justifyContent: 'flex-end' }}>
                    <div className={styles.tableInfo}>
                        Hiển thị {users.length > 0 ? indexOfFirst + 1 : 0} – {Math.min(indexOfLast, users.length)} trên {users.length} kết quả
                    </div>
                </div>

                <div className={styles.tableScroll}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>NHÂN VIÊN</th>
                                <th>TÊN ĐĂNG NHẬP</th>
                                <th>VAI TRÒ</th>
                                <th>TRẠNG THÁI</th>
                                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                                : currentUsers.map(u => {
                                    const roleStyle = getRoleColor(u.role);
                                    const lastActive = formatLastActive(u.lastActiveAt);
                                    const isSelf = u.id === currentUser?.id;
                                    return (
                                        <tr key={u.id} style={{ opacity: u.active ? 1 : 0.55 }}>
                                            {/* Avatar + Name */}
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: 38, height: 38, borderRadius: '50%',
                                                        background: `linear-gradient(135deg, var(--primary), #818cf8)`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                                                        opacity: u.active ? 1 : 0.5
                                                    }}>
                                                        {getInitials(u.fullName)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                                            {u.fullName}
                                                            {isSelf && <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#ede9fe', color: '#5b21b6', padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>Bạn</span>}
                                                        </div>
                                                        {lastActive && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 1 }}>
                                                                <Clock size={11} /> {lastActive}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Username */}
                                            <td>
                                                <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: '0.875rem', color: '#475569' }}>
                                                    {u.username}
                                                </span>
                                            </td>

                                            {/* Role badge */}
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                                    padding: '4px 10px', borderRadius: 99, fontSize: '0.78rem',
                                                    fontWeight: 600, letterSpacing: '0.02em',
                                                    background: roleStyle.bg, color: roleStyle.color
                                                }}>
                                                    {roleStyle.icon}
                                                    {u.role === 'ADMIN' ? 'Quản Trị' : 'Lễ Tân'}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td>
                                                {!u.active ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: '#f1f5f9', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                                                        <XCircle size={13} /> Đã khóa
                                                    </span>
                                                ) : u.online ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: '#dcfce7', color: '#15803d', fontSize: '0.8rem', fontWeight: 600 }}>
                                                        <CheckCircle2 size={13} /> Online
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: '#f8fafc', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 }}>
                                                        <Clock size={13} /> Offline
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td>
                                                <div className={styles.actions}>
                                                    {!isSelf && u.role !== 'ADMIN' && (
                                                        <button
                                                            className={`${styles.btnIcon} ${u.active ? styles.danger : styles.success}`}
                                                            onClick={() => handleToggle(u)}
                                                            title={u.active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                                        >
                                                            {u.active ? <LockKeyhole size={15} /> : <LockKeyholeOpen size={15} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </div>

                {!loading && users.length === 0 && (
                    <div className={styles.emptyState}>
                        <Users size={32} style={{ opacity: 0.25, margin: '0 auto 0.75rem', display: 'block' }} />
                        Chưa có nhân viên nào.
                    </div>
                )}

                {users.length > usersPerPage && (
                    <div className={styles.pagination}>
                        <button className={styles.pageBtn} disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                            ← Trang trước
                        </button>
                        <div className={styles.pageNumbers}>
                            {Array.from({ length: totalPages }).map((_, idx) => (
                                <button key={idx + 1}
                                    className={`${styles.pageNumber} ${currentPage === idx + 1 ? styles.active : ''}`}
                                    onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</button>
                            ))}
                        </div>
                        <button className={styles.pageBtn} disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                            Trang sau →
                        </button>
                    </div>
                )}
            </div>

            {/* Add Staff Modal */}
            {showModal && (
                <div className={modalStyles.modalOverlay}>
                    <div className={`${modalStyles.modalContent} ${modalStyles.checkoutModal}`} style={{ maxWidth: 440 }}>
                        <div className={modalStyles.modalHeader}>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={18} style={{ color: 'var(--primary)' }} /> Thêm nhân viên mới
                            </h2>
                            <button onClick={() => setShowModal(false)} className={modalStyles.closeBtn}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={modalStyles.modalBody}>
                            <div className={modalStyles.formGroup}>
                                <label>Họ và tên *</label>
                                <input type="text" value={formData.fullName}
                                    onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                                    placeholder="Nhập họ và tên đầy đủ" />
                            </div>
                            <div className={modalStyles.formGroup}>
                                <label>Tên đăng nhập *</label>
                                <input type="text" value={formData.username}
                                    onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                                    placeholder="VD: nguyenvana" />
                            </div>
                            <div className={modalStyles.formGroup}>
                                <label>Mật khẩu *</label>
                                <input type="password" value={formData.password}
                                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                                    placeholder="Tối thiểu 6 ký tự" />
                            </div>
                            <div className={modalStyles.formGroup}>
                                <label>Vai trò</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {[
                                        { value: 'RECEPTIONIST', label: 'Lễ Tân', icon: <ConciergeBell size={15} />, bg: '#ede9fe', color: '#5b21b6' },
                                        { value: 'ADMIN', label: 'Quản Trị', icon: <ShieldCheck size={15} />, bg: '#fef3c7', color: '#92400e' }
                                    ].map(opt => (
                                        <label key={opt.value} style={{
                                            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                                            border: `2px solid ${formData.role === opt.value ? opt.color : 'var(--border-color)'}`,
                                            background: formData.role === opt.value ? opt.bg : 'transparent',
                                            transition: 'all 0.15s ease', fontWeight: 600,
                                            color: formData.role === opt.value ? opt.color : 'var(--text-secondary)'
                                        }}>
                                            <input type="radio" name="role" value={opt.value} checked={formData.role === opt.value}
                                                onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                                                style={{ display: 'none' }} />
                                            {opt.icon} {opt.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '4px' }}>{error}</p>}
                        </form>
                        <div className={`${modalStyles.modalFooter} ${modalStyles.endingFooter}`}>
                            <button onClick={() => setShowModal(false)} className={modalStyles.btnSecondary}>Hủy</button>
                            <button onClick={handleSubmit} disabled={isSubmitting} className={modalStyles.btnPrimary}>
                                {isSubmitting ? <span className="spinner" /> : 'Tạo tài khoản'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AdminStaffPage;
