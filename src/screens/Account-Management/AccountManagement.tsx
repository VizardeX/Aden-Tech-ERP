import { useEffect, useState } from 'react'
import AppLayout from '../../components/AppLayout'
import './AccountManagement.css'
import { axiosInstance, getUserById, changePassword } from '../../services/userService'
import Cookies from 'js-cookie';

interface UserItem {
    userID: number;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email: string;
    phoneNumber?: string;
    userType?: number;
    userStatus?: number;
    profileImage?: string;
}

type AccountManagementScreenProps = {
    userName?: string
    onLogout?: () => void
    onNavigationChange?: (navigation: string) => void
}

export default function AccountsPage(
    { userName, onLogout, onNavigationChange }: AccountManagementScreenProps
) {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhone] = useState('');
    const [userStatus, setUserStatus] = useState('');
    const [userType, setUserType] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passMessage, setPassMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | number | null>(null);


    const getUsers = async () => {
        const response = await axiosInstance.get('/v1/admin/users');
        return response.data;
    };


    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const data = await getUsers();

                const userList = Array.isArray(data) ? data : (data?.data || data?.users || []);
                setUsers(userList);
            } catch (err: any) {
                console.error('خطأ في جلب قائمة الحسابات:', err);
                setError('تعذر تحميل قائمة الحسابات. يرجى المحاولة لاحقاً.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleAddAccount = () => {
        alert('سيتم فتح نموذج إضافة حساب جديد');
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (!isModalOpen || !selectedUserId) return;

    
            try {
                setIsLoading(true);
                const res = await getUserById(String(selectedUserId));

                console.log(' البيانات المسترجعة :', res);

                const profileData = res?.profile || res;

                if (profileData) {
                    setFirstName(profileData.firstName || '');
                    setLastName(profileData.lastName || '');
                    setEmail(profileData.email || '');
                    setPhone(profileData.phoneNumber || '');
                    setUserType(getUserTypeLabel(profileData.userType));
                    setUserStatus(getUserStatusLabel(profileData.userStatus));

                    setProfileImage(profileData.profileImage || '');

                }



            } catch (error) {
                console.error(' خطأ في جلب بيانات المستخدم:', error);
                setMessage({ type: 'error', text: 'تعذر جلب بيانات الحساب.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [isModalOpen, selectedUserId]);


    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassMessage(null);

        if (!newPassword || !confirmPassword) {
            setPassMessage({ type: 'error', text: 'يرجى إدخال كلمة المرور الجديدة وتأكيدها' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPassMessage({ type: 'error', text: 'كلمة المرور وتأكيدها غير متطابقين' });
            return;
        }

        if (newPassword.length < 6) {
            setPassMessage({ type: 'error', text: 'كلمة المرور يجب أن تكون 6 خانات على الأقل' });
            return;
        }

        // 2. الإرسال للـ API
        try {
            setPassLoading(true);

            const payload = {
                email: email,
                newPassword: newPassword,
                confirmPassword: confirmPassword,
            };

            await changePassword(payload);

            setPassMessage({ type: 'success', text: 'تم تحديث كلمة المرور بنجاح' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور';
            setPassMessage({ type: 'error', text: errorMsg });
        } finally {
            setPassLoading(false);
        }
    };


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {

            setMessage({ type: 'success', text: 'تم حفظ التغييرات بنجاح!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ التغييرات.' });
        } finally {
            setIsSaving(false);
        }


    };

    const handleEditUser = (userId: string | number) => {
        setSelectedUserId(userId);
        setIsModalOpen(true);
    };

    const getUserTypeLabel = (type: number): string => {
        switch (type) {
            case 0:
                return 'مدير (Admin)';
            case 1:
                return 'مستخدم (User)';
            case 2:
                return 'مشرف (Supervisor)';
            default:
                return 'غير محدد';
        }
    };

    const getUserStatusLabel = (status: number): string => {
        switch (status) {
            case 0:
                return 'غير نشط (Inactive)';
            case 1:
                return 'فعال (Active)';
            case 2:
                return 'معلق (Pending)';
            default:
                return 'غير محدد';
        }
    };

    return (
        <AppLayout
            userName={userName}
            activeNavigation="الإعدادات"
            activeSubNavigation="AccountManagement"
            onNavigationChange={onNavigationChange}
            onLogout={onLogout}
        >
            <div className="accounts-container">

                <div className="accounts-header-card">
                    <h1 className="accounts-title">إدارة الحسابات</h1>

                    <button onClick={handleAddAccount} className="accounts-add-btn">
                        <span>+</span>
                        <span>إضافة حساب</span>
                    </button>
                </div>

                {loading && (
                    <div className="accounts-loading">
                        جاري تحميل قائمة الحسابات...
                    </div>
                )}

                {error && (
                    <div className="accounts-error">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="accounts-table-card">
                        {users.length === 0 ? (
                            <div className="accounts-empty">
                                لا توجد حسابات مسجلة حالياً.
                            </div>
                        ) : (
                            <table className="accounts-table">
                                <thead>
                                    <tr className="accounts-th-row">
                                        <th className="accounts-th">اسم المستخدم</th>
                                        <th className="accounts-th">البريد الإلكتروني</th>
                                        <th className="accounts-th">رقم الهاتف</th>
                                        <th className="accounts-th">النوع</th>
                                        <th className="accounts-th">الحالة</th>
                                        <th className="accounts-th accounts-text-center"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => {
                                        const name =
                                            user.fullName ||
                                            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                                            'مستخدم';

                                        const isLast = index === users.length - 1;

                                        return (
                                            <tr
                                                key={user.userID || index}
                                                className={`accounts-tr ${!isLast ? 'accounts-border-bottom' : ''}`}
                                            >
                                                <td className="accounts-td">
                                                    <div className="accounts-user-name">{name}</div>
                                                </td>

                                                <td className="accounts-td">{user.email || '-'}</td>

                                                <td className="accounts-td">{user.phoneNumber || '-'}</td>

                                                <td className="accounts-td">
                                                    <span className="accounts-badge accounts-type-badge">
                                                        {getUserTypeLabel(user.userType || 0)}
                                                    </span>
                                                </td>

                                                <td className="accounts-td">
                                                    <span className="accounts-badge accounts-status-badge">
                                                        {getUserStatusLabel(user.userStatus || 1)}
                                                    </span>
                                                </td>

                                                <td className="accounts-td accounts-text-center">
                                                    <button
                                                        onClick={() => handleEditUser(user.userID)}
                                                        className="accounts-details-btn"
                                                    >
                                                        المزيد
                                                    </button>
                                                </td>
                                            </tr>

                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
                {isModalOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}>
                        <div style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            padding: '24px',
                            width: '90%',
                            maxWidth: '700px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        }}>

                            {/* زر إغلاق النافذة */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ margin: 0, color: '#1E466E', fontSize: '18px' }}>تعديل بيانات المستخدم</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* هنا تضعين الكود الطويل الخاص بالـ form الذي أرسلتيه */}
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'right' }}>
                                {/* محتوى الـ inputs ونماذج التعديل التي أرسلتِها */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>الاسم الاول</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>الاسم الاخير</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                        />
                                    </div>

                                     <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020303', marginBottom: '8px' }}>
                                        (للقراءه) البريد الإلكتروني
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        style={{
                                            color: '#1E466E',
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid #D1D5DB',
                                            fontSize: '14px',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020203', marginBottom: '8px' }}>
                                        رقم الهاتف
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhone(e.target.value)}
                                        style={{
                                            color: '#1E466E',
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid #D1D5DB',
                                            fontSize: '14px',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            direction: 'ltr',
                                            textAlign: 'right',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020303', marginBottom: '8px' }}>
                                        حالة المستخدم
                                    </label>
                                    <input
                                        type="text"
                                        value={userStatus}
                                        onChange={(e) => setUserStatus(e.target.value)}
                                        required
                                        style={{
                                            color: '#1E466E',
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid #D1D5DB',
                                            fontSize: '14px',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020303', marginBottom: '8px' }}>
                                        نوع المستخدم
                                    </label>
                                    <input
                                        type="text"
                                        value={userType}
                                        onChange={(e) => setUserType(e.target.value)}
                                        required
                                        style={{
                                            color: '#1E466E',
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid #D1D5DB',
                                            fontSize: '14px',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', gridColumn: '1 / -1', width: '100%' }}>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        style={{
                                            backgroundColor: '#1E466E',
                                            color: '#ffffff',
                                            padding: '10px 24px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: isSaving ? 'not-allowed' : 'pointer',
                                            opacity: isSaving ? 0.7 : 1,
                                        }}
                                    >
                                        {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div style={{ height: '1px', backgroundColor: '#E5E7EB', alignSelf: 'stretch', margin: '16px' }} />

                                <h3 style={{ gridColumn: '1 / -1', color: '#919191d6', fontSize: '16px', fontWeight: '600', marginTop: '20px', marginBottom: '16px' }}>
                                    تغيير كلمة المرور
                                </h3>

                                {passMessage && (
                                    <div
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '6px',
                                            marginBottom: '16px',
                                            fontSize: '14px',
                                            textAlign: 'right',
                                            backgroundColor: passMessage.type === 'success' ? '#DEF7EC' : '#FDE8E8',
                                            color: passMessage.type === 'success' ? '#03543F' : '#9B1C1C',
                                        }}
                                    >
                                        {passMessage.text}
                                    </div>
                                )}

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '16px',
                                        textAlign: 'right',
                                        width: '100%',
                                    }}
                                    onSubmit={handlePasswordChange}
                                >

                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020202', marginBottom: '8px' }}>
                                            كلمة مرور جديده
                                        </label>
                                        <input
                                            type="text"
                                            value={''}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            style={{
                                                color: '#1E466E',
                                                width: '100%',
                                                padding: '10px 14px',
                                                borderRadius: '8px',
                                                border: '1px solid #D1D5DB',
                                                fontSize: '14px',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                textAlign: 'right',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020202', marginBottom: '8px' }}>
                                            تأكيد كلمة المرور
                                        </label>
                                        <input
                                            type="text"
                                            value={''}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            style={{
                                                color: '#1E466E',
                                                width: '100%',
                                                padding: '10px 14px',
                                                borderRadius: '8px',
                                                border: '1px solid #D1D5DB',
                                                fontSize: '14px',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                textAlign: 'right',
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', gridColumn: '1 / -1', width: '100%' }}>
                                        <button
                                            type="submit"
                                            disabled={passLoading}
                                            style={{
                                                backgroundColor: passLoading ? '#9CA3AF' : '#29B4B9',
                                                color: '#ffffff',
                                                padding: '10px 24px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: passLoading ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            {passLoading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
                                        </button>
                                    </div>

                                </div>

                                </div>

                            
                            </form>

                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}



