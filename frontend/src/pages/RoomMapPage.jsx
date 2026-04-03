import { useState, useEffect } from 'react';
import { LayoutGrid, DoorOpen, Gem, BedDouble, Users, Sparkles } from 'lucide-react';
import api from '../api/api';
import RoomCard from '../components/RoomCard';
import CheckinModal from '../components/CheckinModal';
import CheckoutModal from '../components/CheckoutModal';
import Toast from '../components/Toast';
import styles from './RoomMapPage.module.css';

// Skeleton placeholder card
const SkeletonCard = () => (
    <div className={styles.skeletonCard}>
        <div className={`${styles.skeletonLine} skeleton`} style={{ width: '60%', height: '14px' }} />
        <div className={`${styles.skeletonLine} skeleton`} style={{ width: '50%', height: '40px', margin: '1rem auto' }} />
        <div className={`${styles.skeletonLine} skeleton`} style={{ width: '80%', height: '12px' }} />
    </div>
);

const FILTERS = [
    { key: 'ALL', label: 'Tất cả', Icon: LayoutGrid },
    { key: 'AVAILABLE', label: 'Trống', Icon: DoorOpen },
    { key: 'VIP', label: 'VIP', Icon: Gem },
];

const RoomMapPage = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [toast, setToast] = useState(null);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const data = await api.get('/rooms');
            setRooms(data);
            setError(null);
        } catch {
            setError('Không thể tải dữ liệu sơ đồ phòng. Vui lòng kiểm tra kết nối.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRooms(); }, []);

    const handleRoomClick = (room) => {
        if (room.status === 'AVAILABLE') {
            setSelectedRoom(room); setModalType('CHECKIN');
        } else if (room.status === 'OCCUPIED') {
            setSelectedRoom(room); setModalType('CHECKOUT');
        } else if (room.status === 'CLEANING') {
            if (window.confirm(`Xác nhận phòng ${room.roomNumber} đã dọn dẹp xong và sẵn sàng đón khách?`)) {
                handleCleanRoom(room.id);
            }
        }
    };

    const handleCleanRoom = async (roomId) => {
        try {
            await api.patch(`/rooms/${roomId}/status?status=AVAILABLE`);
            setToast({ message: `Đã cập nhật phòng thành TRỐNG!`, type: 'success' });
            fetchRooms();
        } catch (error) {
            setToast({ message: 'Lỗi khi cập nhật trạng thái phòng', type: 'error' });
        }
    };


    const closeModal = () => { setSelectedRoom(null); setModalType(null); };

    const handleCheckinSuccess = () => {
        setToast({ message: `Nhận phòng ${selectedRoom.roomNumber} thành công!`, type: 'success' });
        closeModal(); fetchRooms();
    };

    const handleCheckoutSuccess = (invoice) => {
        setToast({ message: `Đã thanh toán phòng ${selectedRoom.roomNumber}. Tổng: ${invoice.totalAmount.toLocaleString('vi-VN')}đ`, type: 'success' });
        closeModal(); fetchRooms();
    };

    const filteredRooms = rooms.filter(r => {
        if (filter === 'ALL') return true;
        if (filter === 'AVAILABLE') return r.status === 'AVAILABLE';
        if (filter === 'VIP') return r.type === 'VIP';
        return true;
    });

    // Stats
    const totalRooms = rooms.length;
    const availableCount = rooms.filter(r => r.status === 'AVAILABLE').length;
    const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED').length;
    const cleaningCount = rooms.filter(r => r.status === 'CLEANING').length;

    if (error) return <div className={styles.errorState}>{error}</div>;

    return (
        <div className={styles.roomMapContainer}>
            <div className={styles.roomMapHeader}>
                <div>
                    <h1>Sơ đồ phòng</h1>
                    <p className={styles.subtitle}>Nhấn vào phòng để check-in / check-out</p>
                </div>

                <div className={styles.filterGroup}>
                    {FILTERS.map(({ key, label, Icon }) => (
                        <button
                            key={key}
                            className={`${styles.filterBtn} ${filter === key ? styles.active : ''}`}
                            onClick={() => setFilter(key)}
                        >
                            <Icon size={15} /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <div className={styles.statCard}>
                    <BedDouble size={20} className={styles.statIconBlue} />
                    <div><div className={styles.statNum}>{totalRooms}</div><div className={styles.statLabel}>Tổng phòng</div></div>
                </div>
                <div className={styles.statCard}>
                    <DoorOpen size={20} className={styles.statIconGreen} />
                    <div><div className={styles.statNum}>{availableCount}</div><div className={styles.statLabel}>Phòng trống</div></div>
                </div>
                <div className={styles.statCard}>
                    <Users size={20} className={styles.statIconRed} />
                    <div><div className={styles.statNum}>{occupiedCount}</div><div className={styles.statLabel}>Có khách</div></div>
                </div>
                <div className={styles.statCard}>
                    <Sparkles size={20} className={styles.statIconAmber} />
                    <div><div className={styles.statNum}>{cleaningCount}</div><div className={styles.statLabel}>Dọn dẹp</div></div>
                </div>
            </div>

            {/* Room Grid */}
            <div className={styles.roomGrid}>
                {loading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                    : filteredRooms.map((room, i) => (
                        <RoomCard key={room.id} room={room} onClick={handleRoomClick} animIndex={i} />
                    ))
                }
                {!loading && filteredRooms.length === 0 && (
                    <div className={styles.noRooms}>
                        <DoorOpen size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>Không có phòng nào phù hợp với bộ lọc.</p>
                    </div>
                )}
            </div>

            {modalType === 'CHECKIN' && selectedRoom && (
                <CheckinModal room={selectedRoom} onClose={closeModal} onSuccess={handleCheckinSuccess} />
            )}
            {modalType === 'CHECKOUT' && selectedRoom && (
                <CheckoutModal room={selectedRoom} onClose={closeModal} onSuccess={handleCheckoutSuccess} />
            )}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </div>
    );
};

export default RoomMapPage;
