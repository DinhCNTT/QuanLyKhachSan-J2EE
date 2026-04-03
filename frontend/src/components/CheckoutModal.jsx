import { useState, useEffect } from 'react';
import { X, Receipt, User, Phone, CalendarDays, Clock, Banknote, CreditCard, Trash2, Building, ConciergeBell, Plus, DollarSign } from 'lucide-react';
import api from '../api/api';
import styles from './Modal.module.css';

const CheckoutModal = ({ room, onClose, onSuccess }) => {
    const [booking, setBooking] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const SERVICES_MENU = {
        'Nước suối': 10000,
        'Mì tôm': 15000,
        'Bia Tiger': 25000,
        'Giặt ủi': 50000,
        'Redbull': 15000,
        'Trà Ô long': 15000
    };

    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [selectedService, setSelectedService] = useState('Nước suối');
    const [serviceQty, setServiceQty] = useState(1);
    const [isAddingService, setIsAddingService] = useState(false);
    const [extendHours, setExtendHours] = useState(1);
    const [isExtending, setIsExtending] = useState(false);

    const fetchBooking = async () => {
        try {
            const data = await api.get(`/bookings/active/${room.id}`);
            setBooking(data);
        } catch (err) {
            setError('Không tìm thấy thông tin nhận phòng hợp lệ.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBooking();
    }, [room.id]);

    const handleAddService = async () => {
        setIsAddingService(true);
        try {
            await api.post(`/bookings/${booking.id}/services`, {
                name: selectedService,
                amount: SERVICES_MENU[selectedService],
                quantity: parseInt(serviceQty) || 1
            });
            await fetchBooking();
            setServiceQty(1);
        } catch (err) {
            alert('Lỗi khi thêm dịch vụ: ' + err.message);
        } finally {
            setIsAddingService(false);
        }
    };

    const handleExtendHours = async () => {
        if (!room.priceHourly && !room.price) return;
        setIsExtending(true);
        try {
            const pricePerHour = room.priceHourly || room.price;
            await api.post(`/bookings/${booking.id}/services`, {
                name: `⏱ Gia hạn ${extendHours} giờ`,
                amount: pricePerHour,
                quantity: extendHours
            });
            await fetchBooking();
        } catch (err) {
            alert('Lỗi khi gia hạn: ' + err.message);
        } finally {
            setIsExtending(false);
        }
    };

    const handleRemoveService = async (index) => {
        try {
            await api.delete(`/bookings/${booking.id}/services/${index}`);
            await fetchBooking();
        } catch (err) {
            alert('Lỗi khi xóa dịch vụ: ' + err.message);
        }
    };

    const handleCheckout = async () => {
        setIsSubmitting(true);
        try {
            const invoice = await api.post(`/bookings/${booking.id}/checkout`, { paymentMethod });
            onSuccess(invoice);
        } catch (err) {
            setError(err.message || 'Lỗi khi trả phòng');
            setIsSubmitting(false);
        }
    };

    const handleForceClear = async () => {
        if (!window.confirm("Xác nhận giải phóng phòng này? (Sẽ không có hóa đơn được tạo)")) return;
        setIsSubmitting(true);
        try {
            if (booking) {
                await api.patch(`/bookings/${booking.id}/cancel`);
            }
            await api.patch(`/rooms/${room.id}/status?status=AVAILABLE`);
            onClose();
            window.location.reload();
        } catch (err) {
            setError(err.message || 'Lỗi khi giải phóng phòng');
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.modalOverlay}>
                <div className={`${styles.modalContent} ${styles.loaderContent}`}>
                    <div className={`${styles.spinner} ${styles.spinnerLg}`}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Đang tải hóa đơn...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.modalOverlay}>
                <div className={`${styles.modalContent} ${styles.checkinModal}`}>
                    <div className={styles.modalHeader}>
                        <h2>Lỗi thanh toán - {room.roomNumber}</h2>
                        <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                    </div>
                    <div className={styles.modalBody}>
                        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <X size={32} />
                            </div>
                            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Dữ liệu không khớp</h3>
                            <p style={{ color: 'var(--danger)', marginBottom: '1.5rem' }}>{error}</p>
                            <button onClick={handleForceClear} className={styles.btnDanger} disabled={isSubmitting} style={{ margin: '0 auto', display: 'block' }}>
                                {isSubmitting ? <span className={styles.spinner}></span> : 'Giải phóng phòng'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Calculations
    const serviceTotal = booking.serviceCharges?.reduce((sum, s) => sum + (s.amount * s.quantity), 0) || 0;
    const finalTotal = booking.estimatedPrice + serviceTotal;

    const translateRentalType = (type) => {
        if (type === 'HOURLY') return 'Giờ';
        if (type === 'OVERNIGHT') return 'Qua Đêm';
        return 'Ngày';
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} ${styles.checkinModal}`} style={{ maxWidth: '900px', padding: 0, overflow: 'hidden' }}>
                <div className={styles.modalHeader} style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', padding: '20px 24px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Receipt size={24} style={{ color: 'var(--primary)' }} />
                            Trả phòng & Thanh toán — {room.roomNumber}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                            {booking.bookingCode || `Mã đặt phòng: #${booking.id}`} • Thuê theo {translateRentalType(booking.rentalType)}
                        </p>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn} style={{ alignSelf: 'flex-start' }}><X size={20} /></button>
                </div>

                <div className={`${styles.modalBody} ${styles.splitForm}`} style={{ padding: 0 }}>
                    {/* LEFT COLUMN: INFO */}
                    <div className={styles.formColumn} style={{ background: '#f8fafc', padding: '24px', borderRight: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building size={18} /> Thông tin lưu trú
                        </h3>

                        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 16px', fontSize: '0.9rem' }}>
                                <User size={16} style={{ color: '#64748b', marginTop: 2 }} />
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 2 }}>Khách hàng</div>
                                    <strong style={{ color: 'var(--text-main)' }}>{booking.guestName}</strong>
                                </div>

                                <Phone size={16} style={{ color: '#64748b', marginTop: 2 }} />
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 2 }}>Số điện thoại</div>
                                    <strong style={{ color: 'var(--text-main)' }}>{booking.phone}</strong>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 4 }}>
                                        <CalendarDays size={14} /> Ngày Check-in
                                    </div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                        {new Date(booking.checkInDate).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                                <div style={{ height: 1, background: 'var(--border-color)' }}></div>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 4 }}>
                                        <Clock size={14} /> Hạn Check-out
                                    </div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                        {new Date(booking.checkOutDate).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: BILLING & ACTIONS */}
                    <div className={styles.formColumn} style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ConciergeBell size={18} /> Chi tiết hóa đơn
                            </h3>

                            {/* Room Charge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: booking.rentalType === 'HOURLY' ? '8px' : '20px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Tiền phòng tạm tính</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        Theo {translateRentalType(booking.rentalType)} {booking.durationHours ? `(${booking.durationHours} giờ)` : ''}
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                    {booking.estimatedPrice.toLocaleString('vi-VN')} đ
                                </div>
                            </div>

                            {/* Extend Hours Box (Hourly Only) */}
                            {booking.rentalType === 'HOURLY' && (
                                <div style={{ background: '#eff6ff', border: '1px dashed #bfdbfe', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1d4ed8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> Gia hạn thêm giờ (Nếu cần)</p>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <select value={extendHours} onChange={e => setExtendHours(Number(e.target.value))}
                                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #bfdbfe', background: '#fff', outline: 'none' }}>
                                            {[1, 2, 3, 4, 6].map(h => (
                                                <option key={h} value={h}>{h} giờ — {((room.priceHourly || room.price) * h).toLocaleString('vi-VN')} đ</option>
                                            ))}
                                        </select>
                                        <button onClick={handleExtendHours} disabled={isExtending} className={styles.btnPrimary}
                                            style={{ padding: '8px 16px', minWidth: 'max-content', display: 'flex', gap: 6, alignItems: 'center' }}>
                                            {isExtending ? <span className={styles.spinner} style={{ width: 14, height: 14, borderWidth: 2 }}></span> : <><Plus size={16} /> Gia hạn</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Services List */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Phụ phí & Dịch vụ</div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{serviceTotal.toLocaleString('vi-VN')} đ</div>
                                </div>

                                {booking.serviceCharges?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                        {booking.serviceCharges.map((s, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <button onClick={() => handleRemoveService(idx)}
                                                        style={{ background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                                                        title="Xóa dịch vụ">
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <div>
                                                        <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 500 }}>{s.name}</div>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{s.amount.toLocaleString('vi-VN')}đ × {s.quantity}</div>
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{(s.amount * s.quantity).toLocaleString('vi-VN')} đ</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '8px 0', borderBottom: '1px dashed var(--border-color)', marginBottom: '16px' }}>
                                        Không có dịch vụ phát sinh
                                    </div>
                                )}

                                {/* Add Service Controls */}
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <select value={selectedService} onChange={e => setSelectedService(e.target.value)}
                                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', flex: 1, outline: 'none' }}>
                                        {Object.keys(SERVICES_MENU).map(s => <option key={s} value={s}>{s} ({SERVICES_MENU[s].toLocaleString()}đ)</option>)}
                                    </select>
                                    <input type="number" min="1" max="20" value={serviceQty} onChange={e => setServiceQty(e.target.value)}
                                        style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center', outline: 'none' }} />
                                    <button onClick={handleAddService} disabled={isAddingService} className={styles.btnSecondary} style={{ padding: '8px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {isAddingService ? <span className={styles.spinner} style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'var(--text-main)' }}></span> : <><Plus size={16} /> Thêm</>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Total Footer */}
                        <div style={{ borderTop: '1px solid var(--border-color)', padding: '20px 24px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                                <div style={{ flex: 1, marginRight: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                        Hình thức thanh toán
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[
                                            { id: 'CASH', icon: <Banknote size={16} />, label: 'Tiền mặt' },
                                            { id: 'CARD', icon: <CreditCard size={16} />, label: 'Quẹt thẻ' },
                                            { id: 'TRANSFER', icon: <DollarSign size={16} />, label: 'Chuyển khoản' }
                                        ].map(method => (
                                            <button key={method.id}
                                                type="button"
                                                onClick={() => setPaymentMethod(method.id)}
                                                style={{
                                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                    padding: '8px', borderRadius: '6px', border: `1px solid ${paymentMethod === method.id ? 'var(--primary)' : 'var(--border-color)'}`,
                                                    background: paymentMethod === method.id ? '#eef2ff' : '#fff',
                                                    color: paymentMethod === method.id ? 'var(--primary)' : 'var(--text-secondary)',
                                                    fontWeight: paymentMethod === method.id ? 600 : 400,
                                                    cursor: 'pointer', transition: 'all 0.15s ease'
                                                }}>
                                                {method.icon} <span style={{ fontSize: '0.85rem' }}>{method.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>Tổng thanh toán</div>
                                    <div style={{ color: 'var(--primary)', fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>
                                        {finalTotal.toLocaleString('vi-VN')} <span style={{ fontSize: '1rem' }}>đ</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={onClose} className={styles.btnSecondary} disabled={isSubmitting} style={{ flex: 1, padding: '12px' }}>
                                    Hủy bỏ
                                </button>
                                <button onClick={handleCheckout} disabled={isSubmitting} className={styles.btnSuccess}
                                    style={{ flex: 2, padding: '12px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {isSubmitting ? <span className={`${styles.spinner} ${styles.spinnerLg}`} style={{ width: 20, height: 20 }}></span> : <><Receipt size={20} /> Hoàn tất thanh toán</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
