import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../api/api';
import styles from './Modal.module.css';

const CheckinModal = ({ room, onClose, onSuccess }) => {
    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        guestName: '',
        cccd: '',
        phone: '',
        checkOutDate: getTomorrowDate(),
        rentalType: 'DAILY'
    });
    const [durationHours, setDurationHours] = useState(2);

    const [errors, setErrors] = useState({});
    const [estimatedPrice, setEstimatedPrice] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tính tiền Live (Real-time)
    useEffect(() => {
        if (formData.checkOutDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Ép parse Date theo Local Timezon để tránh bị lệch UTC+7 (lệch 7 tiếng -> ceil lên thành 2 ngày)
            const [y, m, d] = formData.checkOutDate.split('-');
            const checkOut = new Date(y, m - 1, d);

            // Tính số ngày chênh lệch
            const diffTime = checkOut.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (formData.rentalType === 'HOURLY') {
                const pricePerHour = room.priceHourly || room.price;
                setEstimatedPrice(pricePerHour * durationHours);
                setErrors(prev => ({ ...prev, checkOutDate: null }));
            } else if (formData.rentalType === 'OVERNIGHT') {
                if (diffDays > 0) {
                    let p = room.priceOvernight || room.price;
                    if (diffDays > 1) p += (diffDays - 1) * room.price;
                    setEstimatedPrice(p);
                    setErrors(prev => ({ ...prev, checkOutDate: null }));
                } else {
                    setEstimatedPrice(0);
                    setErrors(prev => ({ ...prev, checkOutDate: 'Ngày trả không hợp lệ' }));
                }
            } else {
                if (diffDays > 0) {
                    setEstimatedPrice(diffDays * room.price);
                    setErrors(prev => ({ ...prev, checkOutDate: null }));
                } else {
                    setEstimatedPrice(0);
                    setErrors(prev => ({ ...prev, checkOutDate: 'Ngày trả không hợp lệ' }));
                }
            }
        }
    }, [formData.checkOutDate, formData.rentalType, durationHours, room.price, room.priceHourly, room.priceOvernight]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-fix checkout date constraints when switching configs
        if (name === 'rentalType' && value === 'HOURLY') {
            setFormData(prev => ({ ...prev, checkOutDate: new Date().toISOString().split('T')[0] }));
        } else if (name === 'rentalType' && (value === 'DAILY' || value === 'OVERNIGHT')) {
            setFormData(prev => ({ ...prev, checkOutDate: getTomorrowDate() }));
        }

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.guestName.trim()) newErrors.guestName = 'Vui lòng nhập tên khách hàng';
        if (!formData.cccd.trim()) newErrors.cccd = 'Vui lòng không để trống CCCD';
        if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
        if (!formData.checkOutDate) newErrors.checkOutDate = 'Vui lòng chọn ngày trả phòng';
        else if (estimatedPrice === 0) newErrors.checkOutDate = 'Ngày trả phòng không hợp lệ';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await api.post('/bookings/checkin', {
                roomId: room.id,
                guestName: formData.guestName,
                cccd: formData.cccd,
                phone: formData.phone,
                checkOutDate: formData.checkOutDate,
                rentalType: formData.rentalType,
                durationHours: formData.rentalType === 'HOURLY' ? durationHours : undefined
            });
            onSuccess();
        } catch (error) {
            setErrors({ submit: error.message || 'Lỗi hệ thống khi nhận phòng' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} ${styles.checkinModal}`}>
                <div className={styles.modalHeader}>
                    <h2>Làm thủ tục nhận phòng - {room.roomNumber}</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={`${styles.modalBody} ${styles.splitForm}`}>
                    {/* Cột trái: Thông tin phòng (Read-only) */}
                    <div className={`${styles.formColumn} ${styles.roomInfoCol}`}>
                        <div className={styles.infoBox}>
                            <p className={styles.infoLabel}>Loại phòng</p>
                            <p className={styles.infoValue}>{room.type === 'VIP' ? '💎 VIP' : 'THƯỜNG'}</p>
                        </div>
                        <div className={styles.infoBox}>
                            <p className={styles.infoLabel}>
                                {formData.rentalType === 'HOURLY' ? '⏱ Giá theo giờ' : formData.rentalType === 'OVERNIGHT' ? '🌙 Giá qua đêm' : '📅 Giá theo ngày'}
                            </p>
                            <p className={`${styles.infoValue} ${styles.priceText}`}>
                                {formData.rentalType === 'HOURLY'
                                    ? (room.priceHourly || room.price).toLocaleString('vi-VN')
                                    : formData.rentalType === 'OVERNIGHT'
                                        ? (room.priceOvernight || room.price).toLocaleString('vi-VN')
                                        : room.price.toLocaleString('vi-VN')
                                } VNĐ
                            </p>
                            {formData.rentalType === 'HOURLY' && !room.priceHourly && (
                                <p style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '4px' }}>* Chưa cấu hình giá giờ, đang dùng giá ngày</p>
                            )}
                            {formData.rentalType === 'OVERNIGHT' && !room.priceOvernight && (
                                <p style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '4px' }}>* Chưa cấu hình giá đêm, đang dùng giá ngày</p>
                            )}
                        </div>
                    </div>

                    {/* Cột phải: Nhập liệu */}
                    <div className={styles.formColumn}>
                        <div className={styles.formGroup}>
                            <label>Hình thức thuê *</label>
                            <div style={{ display: 'flex', gap: '15px', padding: '0.5rem 0' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '500', cursor: 'pointer' }}>
                                    <input type="radio" name="rentalType" value="DAILY" checked={formData.rentalType === 'DAILY'} onChange={handleChange} /> Theo ngày
                                </label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '500', cursor: 'pointer' }}>
                                    <input type="radio" name="rentalType" value="OVERNIGHT" checked={formData.rentalType === 'OVERNIGHT'} onChange={handleChange} /> Qua đêm
                                </label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '500', cursor: 'pointer' }}>
                                    <input type="radio" name="rentalType" value="HOURLY" checked={formData.rentalType === 'HOURLY'} onChange={handleChange} /> Theo giờ
                                </label>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Tên khách hàng *</label>
                            <input
                                type="text"
                                name="guestName"
                                value={formData.guestName}
                                onChange={handleChange}
                                className={errors.guestName ? styles.inputError : ''}
                                placeholder="Nhập họ và tên"
                            />
                            {errors.guestName && <span className={styles.errorText}>{errors.guestName}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>CCCD / CMND *</label>
                            <input
                                type="text"
                                name="cccd"
                                value={formData.cccd}
                                onChange={handleChange}
                                className={errors.cccd ? styles.inputError : ''}
                                placeholder="Số định danh"
                            />
                            {errors.cccd && <span className={styles.errorText}>{errors.cccd}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Số điện thoại *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={errors.phone ? styles.inputError : ''}
                                placeholder="VD: 0901234567"
                            />
                            {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                        </div>

                        {formData.rentalType === 'HOURLY' ? (
                            <div className={styles.formGroup}>
                                <label>⏱ Số giờ thuê *</label>
                                <select
                                    value={durationHours}
                                    onChange={e => setDurationHours(Number(e.target.value))}
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }}
                                >
                                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(h => (
                                        <option key={h} value={h}>{h} giờ — {((room.priceHourly || room.price) * h).toLocaleString('vi-VN')} đ</option>
                                    ))}
                                </select>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                                    Đơn giá: {(room.priceHourly || room.price).toLocaleString('vi-VN')} đ/giờ
                                </span>
                            </div>
                        ) : formData.rentalType === 'OVERNIGHT' ? (
                            <div className={styles.formGroup}>
                                <label>Thời gian trả phòng *</label>
                                <input
                                    type="text"
                                    value={`${formData.checkOutDate.split('-').reverse().join('/')} - 12:00 Trưa`}
                                    disabled
                                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b', width: '100%', padding: '0.75rem 1rem', border: '2px solid var(--border-color)', borderRadius: '8px' }}
                                />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                                    (Giá qua đêm chốt trả phòng 12h trưa mai)
                                </span>
                            </div>
                        ) : (
                            <div className={styles.formGroup}>
                                <label>Ngày trả phòng *</label>
                                <input
                                    type="date"
                                    name="checkOutDate"
                                    value={formData.checkOutDate}
                                    onChange={handleChange}
                                    min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                                    className={errors.checkOutDate ? styles.inputError : ''}
                                />
                                {errors.checkOutDate && <span className={styles.errorText}>{errors.checkOutDate}</span>}
                            </div>
                        )}
                    </div>
                </form>

                {errors.submit && <div className={styles.submitError}>{errors.submit}</div>}

                <div className={styles.modalFooter}>
                    <div className={styles.pricePreview}>
                        <span>Tạm tính: </span>
                        <strong>{estimatedPrice.toLocaleString('vi-VN')} VNĐ</strong>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={styles.btnPrimary}
                    >
                        {isSubmitting ? <span className={styles.spinner}></span> : 'Nhận phòng'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckinModal;
