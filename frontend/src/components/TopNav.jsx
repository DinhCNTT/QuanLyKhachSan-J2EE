import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './TopNav.module.css';

const getInitials = (name = 'Admin User') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const TopNav = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className={styles.topNav}>
            {/* The flex layout in topNav has space-between. We just push rigt item to right */}
            <div style={{ flex: 1 }}></div>

            <div className={styles.navRight}>
                <div className={styles.profileContainer} ref={dropdownRef}>
                    <div
                        className={`${styles.userProfile} ${isDropdownOpen ? styles.active : ''}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.fullName || 'Admin User'}</span>
                            <span className={styles.userRole}>
                                {user?.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'NHÂN VIÊN LỄ TÂN'}
                            </span>
                        </div>
                        <div className={styles.avatar}>
                            {getInitials(user?.fullName || 'Admin User')}
                        </div>
                        <ChevronDown size={14} className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ''}`} />
                    </div>

                    {isDropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            <div className={styles.dropdownHeader}>
                                <div className={styles.dropdownAvatar}>
                                    {getInitials(user?.fullName || 'Admin User')}
                                </div>
                                <div className={styles.dropdownUserInfo}>
                                    <span className={styles.dropdownName}>{user?.fullName || 'Admin User'}</span>
                                    <span className={styles.dropdownEmail}>{user?.username || 'admin'}</span>
                                </div>
                            </div>
                            <div className={styles.dropdownDivider}></div>
                            <button className={styles.dropdownItem} onClick={handleLogout}>
                                <LogOut size={16} className={styles.logoutIcon} />
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopNav;
