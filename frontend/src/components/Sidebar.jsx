import { NavLink } from 'react-router-dom';
import { BedDouble, Bed, Users, ClipboardList, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Sidebar.module.css';

const Sidebar = () => {
    const { user } = useAuth();

    return (
        <aside className={styles.sidebar}>
            {/* Logo Header */}
            <div className={styles.sidebarHeader}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}><Bed size={24} /></div>
                    <div className={styles.logoTextWrapper}>
                        <span className={styles.logoTitle}>The Sovereign</span>
                        <span className={styles.logoSubtitle}>MANAGEMENT SUITE</span>
                    </div>
                </div>
            </div>

            <nav className={styles.sidebarNav}>
                <NavLink to={user?.role === 'ADMIN' ? '/admin/rooms' : '/receptionist/rooms'} className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <BedDouble size={20} />
                    <span>{user?.role === 'ADMIN' ? 'Quản lý Phòng' : 'Sơ đồ phòng'}</span>
                </NavLink>

                {user?.role === 'ADMIN' && (
                    <>
                        <NavLink to="/admin/staff" className={({ isActive }) =>
                            `${styles.navItem} ${isActive ? styles.active : ''}`}>
                            <Users size={20} />
                            <span>Quản lý Nhân sự</span>
                        </NavLink>

                        <NavLink to="/admin/invoices" className={({ isActive }) =>
                            `${styles.navItem} ${isActive ? styles.active : ''}`}>
                            <ClipboardList size={20} />
                            <span>Lịch sử Hóa đơn</span>
                        </NavLink>
                    </>
                )}
            </nav>

            <div className={styles.sidebarFooter}>
                {user?.role === 'RECEPTIONIST' && (
                    <button className={styles.newBookingBtn}>
                        <Plus size={18} />
                        <span>New Booking</span>
                    </button>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
