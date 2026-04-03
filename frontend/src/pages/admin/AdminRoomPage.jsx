import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, BedDouble, Gem, AlertTriangle, ChevronLeft, ChevronRight, Building2, CheckCircle2, Users, PaintBucket, ChevronDown } from 'lucide-react';
import api from '../../api/api';
import styles from './AdminTable.module.css';
import modalStyles from '../../components/Modal.module.css';
import Toast from '../../components/Toast';

const ROOM_TYPES = ['STANDARD', 'VIP'];

// Format 500000 -> 500.000
const formatCurrency = (val) => {
    const num = parseInt(String(val).replace(/\D/g, ''), 10);
    return isNaN(num) ? '' : num.toLocaleString('vi-VN');
};
const parseCurrency = (val) => parseInt(String(val).replace(/\./g, '').replace(/,/g, ''), 10) || '';

const SkeletonRow = () => (
    <tr>
        {[1, 2, 3, 4, 5].map(i => (
            <td key={i}><div className={`skeleton ${styles.skeletonCell}`} /></td>
        ))}
    </tr>
);

// Custom confirm dialog to replace window.confirm
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
    <div className={modalStyles.modalOverlay}>
        <div className={`${modalStyles.modalContent} ${modalStyles.checkoutModal}`} style={{ maxWidth: 360 }}>
            <div className={modalStyles.modalHeader}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                    <AlertTriangle size={20} style={{ color: 'var(--warning)' }} /> Xác nhận xóa
                </h2>
                <button onClick={onCancel} className={modalStyles.closeBtn}><X size={18} /></button>
            </div>
            <div className={modalStyles.modalBody}><p>{message}</p></div>
            <div className={`${modalStyles.modalFooter} ${modalStyles.endingFooter}`}>
                <button onClick={onCancel} className={modalStyles.btnSecondary}>Hủy</button>
                <button onClick={onConfirm} className={modalStyles.btnPrimary}
                    style={{ background: 'var(--danger)', boxShadow: 'none' }}>Xóa</button>
            </div>
        </div>
    </div>
);

const AdminRoomPage = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editRoom, setEditRoom] = useState(null);
    const [formData, setFormData] = useState({ roomNumber: '', type: 'STANDARD', price: '', priceHourly: '', priceOvernight: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [confirm, setConfirm] = useState(null); // { id, roomNumber }
    const [toast, setToast] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const roomsPerPage = 6;

    const fetchRooms = async () => {
        setLoading(true);
        try { setRooms(await api.get('/rooms')); } finally { setLoading(false); }
    };

    useEffect(() => { fetchRooms(); }, []);

    const openAdd = () => {
        setEditRoom(null);
        setFormData({ roomNumber: '', type: 'STANDARD', price: '', priceHourly: '', priceOvernight: '' });
        setError('');
        setShowModal(true);
    };

    const openEdit = (room) => {
        setEditRoom(room);
        setFormData({ roomNumber: room.roomNumber, type: room.type, price: room.price, priceHourly: room.priceHourly || '', priceOvernight: room.priceOvernight || '' });
        setError('');
        setShowModal(true);
    };

    const handleDeleteConfirmed = async () => {
        await api.delete(`/rooms/${confirm.id}`);
        setConfirm(null);
        setToast({ message: `Đã xóa phòng ${confirm.roomNumber}`, type: 'success' });

        if (currentRooms.length === 1 && currentPage > 1) {
            setCurrentPage(p => p - 1);
        }

        fetchRooms();
    };

    const handleSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!formData.roomNumber || !formData.price) { setError('Vui lòng điền đầy đủ thông tin'); return; }
        setIsSubmitting(true);
        try {
            if (editRoom) {
                await api.put(`/rooms/${editRoom.id}`, formData);
                setToast({ message: `Đã cập nhật phòng ${editRoom.roomNumber}`, type: 'success' });
            } else {
                await api.post('/rooms', formData);
                setToast({ message: `Đã thêm phòng ${formData.roomNumber}`, type: 'success' });
            }
            setShowModal(false);
            fetchRooms();
        } catch (err) {
            setError(err.message || 'Lỗi khi lưu');
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusBadge = (status) => {
        if (status === 'AVAILABLE') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#dcfce7', padding: '4px 10px', borderRadius: '99px' }}><CheckCircle2 size={12} /> Trống</span>;
        if (status === 'OCCUPIED') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#b91c1c', background: '#fee2e2', padding: '4px 10px', borderRadius: '99px' }}><Users size={12} /> Có khách</span>;
        if (status === 'CLEANING') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#d97706', background: '#fef3c7', padding: '4px 10px', borderRadius: '99px' }}><PaintBucket size={12} /> Dọn dẹp</span>;
        return <span className={`${styles.badge}`}>{status}</span>;
    };

    // Pagination Logic
    const indexOfLastRoom = currentPage * roomsPerPage;
    const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
    const currentRooms = rooms.slice(indexOfFirstRoom, Math.min(indexOfLastRoom, rooms.length));
    const totalPages = Math.ceil(rooms.length / roomsPerPage);

    // Dashboard Metrics
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.status === 'AVAILABLE').length;
    const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED').length;
    const cleaningRooms = rooms.filter(r => r.status === 'CLEANING').length;

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <div className={styles.pageHeader} style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        <BedDouble size={22} style={{ color: 'var(--primary)' }} /> Quản lý Phòng
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
                        Theo dõi trạng thái và cập nhật thông tin phòng
                    </p>
                </div>
                <button onClick={openAdd} className={styles.btnAdd}>
                    <Plus size={18} /> Thêm phòng
                </button>
            </div>

            {/* Dashboard Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng số phòng</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', lineHeight: 1, color: 'var(--text-main)' }}>{totalRooms}</h2>
                        </div>
                        <div style={{ background: '#f1f5f9', color: '#64748b', padding: '10px', borderRadius: '12px' }}>
                            <Building2 size={22} />
                        </div>
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#10b981' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phòng trống</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', lineHeight: 1, color: '#059669' }}>{availableRooms}</h2>
                        </div>
                        <div style={{ background: '#dcfce7', color: '#10b981', padding: '10px', borderRadius: '12px' }}>
                            <CheckCircle2 size={22} />
                        </div>
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#ef4444' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Có khách</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', lineHeight: 1, color: '#b91c1c' }}>{occupiedRooms}</h2>
                        </div>
                        <div style={{ background: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '12px' }}>
                            <Users size={22} />
                        </div>
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#f59e0b' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Đang dọn dẹp</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', lineHeight: 1, color: '#d97706' }}>{cleaningRooms}</h2>
                        </div>
                        <div style={{ background: '#fef3c7', color: '#f59e0b', padding: '10px', borderRadius: '12px' }}>
                            <PaintBucket size={22} />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableToolbar} style={{ justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BedDouble size={18} style={{ color: 'var(--text-secondary)' }} /> Danh sách phòng
                    </h3>
                    <div className={styles.tableInfo}>
                        Hiển thị {rooms.length > 0 ? indexOfFirstRoom + 1 : 0} - {Math.min(indexOfLastRoom, rooms.length)} trên {rooms.length} kết quả
                    </div>
                </div>

                <div className={styles.tableScroll}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>SỐ PHÒNG</th>
                                <th>LOẠI PHÒNG</th>
                                <th>GIÁ THUÊ</th>
                                <th>TRẠNG THÁI</th>
                                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                                : currentRooms.map(room => (
                                    <tr key={room.id}>
                                        <td style={{ width: '120px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <BedDouble size={16} />
                                                </div>
                                                <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{room.roomNumber}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            {room.type === 'VIP'
                                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#8b5cf6', background: '#f5f3ff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #ede9fe' }}><Gem size={12} /> VIP</span>
                                                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>STANDARD</span>}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '280px' }}>
                                                <div style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                                                    <strong style={{ color: 'var(--text-main)' }}>{room.price?.toLocaleString('vi-VN')} đ</strong> <span style={{ color: '#94a3b8' }}>/ ngày</span>
                                                </div>
                                                {room.priceOvernight && (
                                                    <div style={{ background: '#eef2ff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e0e7ff', fontSize: '0.8rem' }}>
                                                        <span style={{ color: '#6366f1', fontWeight: 600 }}>{room.priceOvernight.toLocaleString('vi-VN')} đ <span style={{ color: '#818cf8', fontWeight: 400 }}>/ đêm</span></span>
                                                    </div>
                                                )}
                                                {room.priceHourly && (
                                                    <div style={{ background: '#f0fdf4', padding: '4px 8px', borderRadius: '6px', border: '1px solid #dcfce7', fontSize: '0.8rem' }}>
                                                        <span style={{ color: '#16a34a', fontWeight: 600 }}>{room.priceHourly.toLocaleString('vi-VN')} đ <span style={{ color: '#4ade80', fontWeight: 400 }}>/ giờ</span></span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>{statusBadge(room.status)}</td>
                                        <td>
                                            <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                                                <button className={`${styles.btnIcon} ${styles.warning}`}
                                                    onClick={() => openEdit(room)} title="Sửa thông tin" style={{ background: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }}>
                                                    <Pencil size={15} />
                                                </button>
                                                <button className={`${styles.btnIcon} ${styles.danger}`}
                                                    onClick={() => setConfirm({ id: room.id, roomNumber: room.roomNumber })} title="Xóa phòng" style={{ background: '#fee2e2', color: '#ef4444', borderColor: '#fecaca' }}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>

                {!loading && rooms.length === 0 && (
                    <div className={styles.emptyState}>
                        <BedDouble size={36} style={{ color: '#cbd5e1', margin: '0 auto 1rem', display: 'block' }} />
                        <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Chưa có phòng</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Vui lòng thêm phòng để bắt đầu quản lý.</p>
                    </div>
                )}

                {rooms.length > roomsPerPage && (
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

            {/* Add/Edit Modal */}
            {showModal && (
                <div className={modalStyles.modalOverlay}>
                    <div className={`${modalStyles.modalContent} ${modalStyles.checkoutModal}`} style={{ maxWidth: '520px', padding: 0 }}>
                        <div className={modalStyles.modalHeader} style={{ background: '#f8fafc', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {editRoom ? <><Pencil size={20} style={{ color: 'var(--primary)' }} /> Cập nhật phòng {editRoom.roomNumber}</> : <><Plus size={20} style={{ color: 'var(--primary)' }} /> Thêm phòng mới</>}
                            </h2>
                            <button onClick={() => setShowModal(false)} className={modalStyles.closeBtn}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={modalStyles.modalBody} style={{ padding: '24px' }}>
                            <div className={modalStyles.formGroup} style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                                    Số phòng <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input type="text" value={formData.roomNumber}
                                    onChange={e => setFormData(p => ({ ...p, roomNumber: e.target.value }))}
                                    placeholder="VD: 101, VIP-01" disabled={!!editRoom}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: editRoom ? '#f1f5f9' : '#fff' }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                                />
                            </div>

                            <div className={modalStyles.formGroup} style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                                    Loại phòng
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <select value={formData.type}
                                        onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', appearance: 'none', background: '#fff' }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                                    >
                                        {ROOM_TYPES.map(t => (
                                            <option key={t} value={t}>{t === 'VIP' ? '💎 Phòng VIP' : 'Phòng Standard'}</option>
                                        ))}
                                    </select>
                                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className={modalStyles.formGroup} style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                                    <span style={{ color: '#64748b' }}>📅</span> Giá thuê theo ngày (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input type="text" value={formatCurrency(formData.price)}
                                    onChange={e => setFormData(p => ({ ...p, price: parseCurrency(e.target.value) }))}
                                    placeholder="VD: 500.000"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                <div className={modalStyles.formGroup}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#0ea5e9', marginBottom: '8px' }}>
                                        ⏱ Giá theo giờ (Tùy chọn)
                                    </label>
                                    <input type="text" value={formatCurrency(formData.priceHourly)}
                                        onChange={e => setFormData(p => ({ ...p, priceHourly: parseCurrency(e.target.value) }))}
                                        placeholder="VD: 100.000"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0f2fe', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                                        onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                                        onBlur={(e) => e.target.style.borderColor = '#e0f2fe'}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>Bỏ trống để vô hiệu hóa thuê giờ</p>
                                </div>
                                <div className={modalStyles.formGroup}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#6366f1', marginBottom: '8px' }}>
                                        🌙 Giá qua đêm (Tùy chọn)
                                    </label>
                                    <input type="text" value={formatCurrency(formData.priceOvernight)}
                                        onChange={e => setFormData(p => ({ ...p, priceOvernight: parseCurrency(e.target.value) }))}
                                        placeholder="VD: 350.000"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e7ff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                                        onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                        onBlur={(e) => e.target.style.borderColor = '#e0e7ff'}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>Bỏ trống để tính theo giá ngày</p>
                                </div>
                            </div>
                            {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', background: '#fee2e2', padding: '8px 12px', borderRadius: '6px', display: 'inline-block' }}>{error}</p>}
                        </form>
                        <div className={modalStyles.modalFooter} style={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowModal(false)} className={modalStyles.btnSecondary} style={{ padding: '10px 20px' }}>Hủy bỏ</button>
                            <button onClick={handleSubmit} disabled={isSubmitting} className={modalStyles.btnPrimary} style={{ padding: '10px 24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {isSubmitting ? <span className={modalStyles.spinner} style={{ width: 16, height: 16, borderWidth: 2 }}></span> : (editRoom ? <><Pencil size={16} /> Lưu thay đổi</> : <><Plus size={16} /> Hoàn tất thêm</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete */}
            {confirm && (
                <ConfirmDialog
                    message={`Bạn có chắc muốn xóa phòng ${confirm.roomNumber}? Hành động này không thể hoàn tác.`}
                    onConfirm={handleDeleteConfirmed}
                    onCancel={() => setConfirm(null)}
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AdminRoomPage;
