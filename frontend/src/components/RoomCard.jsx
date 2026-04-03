import { DoorOpen, UserCheck, Sparkles, Gem } from 'lucide-react';
import styles from './RoomCard.module.css';

const STATUS_CONFIG = {
    AVAILABLE: { label: 'Trống', cls: 'available', Icon: DoorOpen },
    OCCUPIED: { label: 'Có khách', cls: 'occupied', Icon: UserCheck },
    CLEANING: { label: 'Dọn dẹp', cls: 'cleaning', Icon: Sparkles },
};

const RoomCard = ({ room, onClick, animIndex = 0 }) => {
    const config = STATUS_CONFIG[room.status] || STATUS_CONFIG.AVAILABLE;
    const { label, cls, Icon } = config;

    return (
        <div
            className={`${styles.roomCard} ${styles[cls]}`}
            onClick={() => onClick(room)}
            style={{ animationDelay: `${animIndex * 50}ms` }}
        >
            {/* Shimmer overlay */}
            <div className={styles.shimmerOverlay} />

            <div className={styles.cardTop}>
                <span className={styles.roomType}>
                    {room.type === 'VIP'
                        ? <><Gem size={12} /> VIP</>
                        : 'STANDARD'}
                </span>
                <div className={styles.statusIcon}>
                    <Icon size={16} />
                </div>
            </div>

            <h3 className={styles.roomNumber}>{room.roomNumber}</h3>

            <div className={styles.cardBottom}>
                <span className={styles.roomStatus}>{label}</span>
                <span className={styles.roomPrice}>
                    {(() => {
                        const prices = [room.price, room.priceHourly, room.priceOvernight].filter(Boolean);
                        const minPrice = Math.min(...prices);
                        const hasMultiple = prices.length > 1;
                        return <>{hasMultiple && <small style={{ opacity: 0.8, fontSize: '0.65em' }}>Từ </small>}{minPrice.toLocaleString('vi-VN')}đ</>;
                    })()}
                </span>
            </div>
        </div>
    );
};

export default RoomCard;
