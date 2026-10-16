import { useEffect, useState } from 'react'
import AppLayout from '../../components/AppLayout'
import './AccountManagement.css'
import { getUserById, changePassword } from '../../services/userService'
import Cookies from 'js-cookie';
import { authenticatedFetch } from '../../services/authService';

interface UserItem {
    userID: number;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email: string;
    password?: string;
    phoneNumber?: string;
    userType?: number;
    userStatus?: number;
    profileImage?: string;
}

interface DropdownItem {
    disabled: boolean;
    group: any;
    selected: boolean;
    text: string;
    value: string;
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
    const [userID, setUserID] = useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isaddModalOpen, setIsAddModalOpen] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhone] = useState('');
    const [note, setNote] = useState('');
    const [userTypes, setUserTypes] = useState<DropdownItem[]>([]);
    const [userStatuses, setUserStatuses] = useState<DropdownItem[]>([]);
    const [userType, setUserType] = useState<string | number>('');
    const [userStatus, setUserStatus] = useState<string | number>('');
    const [selectedUserType, setSelectedUserType] = useState<string | number>('');
    const [selectedUserStatus, setSelectedUserStatus] = useState<string | number>('');
    const [profileImage, setProfileImage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passMessage, setPassMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | number>('');
    const [existingPassword, setExistingPassword] = useState('');

    const getUsers = async () => {

        const response = await authenticatedFetch('/api/v1/admin/users',
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            }

        );

        const result = await response.json();
        return result;
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
        const fetchOptionsAndData = async () => {
            try {
                const optionsRes = await authenticatedFetch('/api/v1/admin/users/users-metadata/true'
                    , {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',

                        },
                    });
                const optionsData = await optionsRes.json();

                setUserTypes(optionsData.userTypes || []);
                setUserStatuses(optionsData.userStatuses || []);




            } catch (error) {
                console.error('Failed to load data', error);
            }
        };

        fetchOptionsAndData();
    }, []);



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


    const AddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'كلمة المرور وتأكيد كلمة المرور غير متطابقين.' });
            return;
        }

        try {

            const innerPayload = {
                profile: {
                    firstName: firstName,
                    lastName: lastName,
                    userType: selectedUserType !== '' ? userType : 0,
                    userStatus: selectedUserStatus !== '' ? userStatus : 1,
                    note: note || 'New Account Note',
                    email: email,
                    phoneNumber: phoneNumber,
                },
                isSupport: false,
                password: password,
                uiRootPath: null

            }

                ;

            const formData = new FormData();
            formData.append('data', JSON.stringify(innerPayload));
            formData.append('profileImageFile', '');
            console.log('Request Data:', innerPayload);
            console.log('Request Data:', formData);
            console.log({
                passwordExists: Boolean(password),
                passwordLength: password?.length,
                hasUppercase: /[A-Z]/.test(password),
                hasLowercase: /[a-z]/.test(password),
                hasDigit: /[0-9]/.test(password),
                hasSpecialChar: /[^a-zA-Z0-9]/.test(password),
            });

            const response = await authenticatedFetch(`/api/v1/admin/users`, {
                method: 'POST',
                headers: {
                    Accept: '*/*',
                },
                body: formData,
            });

            const responseText = await response.text();

            console.log('Status:', response.status);
            console.log('Response body:', responseText);

            if (!response.ok) {
                throw new Error(`API Error ${response.status}: ${responseText}`);
            }

            const result = responseText ? JSON.parse(responseText) : null;
            console.log('Success:', result);


            if (!response.ok) {
                throw new Error('فشل اضافة الحساب');
            }

            setMessage({ type: 'success', text: 'تم اضافة الحساب بنجاح!' });

        } catch (error: any) {
            console.error('Error saving changes:', error);
            setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء اضافة الحساب.' });
        }
    };


    const handleSave = async (
        e: React.FormEvent,
        userId: string | number
    ) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            if (newPassword?.trim()) {
                await changePassword({
                    email,
                    newPassword,
                    confirmPassword,
                });
            }

            const requestData = {
                profile: {
                    firstName,
                    lastName,
                    userType,
                    userStatus,
                    note: 'note',
                    email,
                    phoneNumber,
                },
                isSupport: false,
                password: newPassword,
                uiRootPath: null,
            };

            const formData = new FormData();
            formData.append('data', JSON.stringify(requestData));
            formData.append('profileImageFile', '');

            const response = await authenticatedFetch(
                `/api/v1/admin/users/${userId}`,
                {
                    method: 'PUT',
                    headers: { Accept: '*/*' },
                    body: formData,
                }
            );

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(responseText || 'فشل حفظ التغييرات');
            }

            setMessage({
                type: 'success',
                text: 'تم حفظ التغييرات بنجاح!',
            });
        } catch (error: unknown) {
            console.error('Error saving changes:', error);

            setMessage({
                type: 'error',
                text: error instanceof Error
                    ? error.message
                    : 'حدث خطأ أثناء حفظ التغييرات.',
            });
        } finally {
            setIsSaving(false);
        }
    };


    const handleEditUser = (userId: string | number) => {
        setSelectedUserId(userId);
        setIsModalOpen(true);
    };



    const handleDeleteAccount = async (id: string | number) => {
        const confirmed = window.confirm("هل أنت متأكد من رغبتك في حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.");
        if (!confirmed) return;

        try {
            setIsSaving(true);
            const response = await authenticatedFetch(`/api/v1/admin/users/${selectedUserId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const responseText = await response.text();
            const data = responseText ? JSON.parse(responseText) : {};

            if (!response.ok) {
                throw new Error(data.message || 'فشل عملية حذف الحساب');
            }

            alert('تم حذف الحساب بنجاح');



        } catch (error: any) {
            console.error('Error deleting account:', error);
            alert(error.message || 'حدث خطأ أثناء محاولة حذف الحساب');
        } finally {
            setIsSaving(false);
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

                    <button onClick={() => setIsAddModalOpen(true)} className="accounts-add-btn">
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
                            maxWidth: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ margin: 6, color: '#1E466E', fontSize: '18px' }}>تعديل بيانات المستخدم</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={(e) => handleSave(e, userID)} style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'start' }}>


                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            paddingTop: '10px',
                                            minWidth: '140px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                border: '3px solid #1E466E',
                                                backgroundColor: '#E5E7EB',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <img
                                                src={profileImage}
                                                alt="صورة المستخدم"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src =
                                                        'https://ui-avatars.com/api/?name=' +
                                                        encodeURIComponent(firstName || 'User') +
                                                        '&background=1E466E&color=fff';
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ width: '1px', backgroundColor: '#E5E7EB', alignSelf: 'stretch' }} />

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', flex: 1, textAlign: 'right' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>الاسم الاول</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}

                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>الاسم الاخير</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}

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
                                                readOnly
                                                style={{
                                                    color: '#1E466E',
                                                    backgroundColor: '#F3F4F6',
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #D1D5DB',
                                                    fontSize: '14px',
                                                    outline: 'none',
                                                    boxSizing: 'border-box',
                                                    cursor: 'not-allowed',
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
                                            <select
                                                value={userStatus}
                                                onChange={(e) => setUserStatus(Number(e.target.value))}

                                                style={{
                                                    color: '#1E466E',
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #D1D5DB',
                                                    fontSize: '14px',
                                                    outline: 'none',
                                                    boxSizing: 'border-box',
                                                    backgroundColor: '#ffffff',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <option value=""> {userStatus} </option>
                                                {userStatuses.map((item) => (
                                                    <option key={item.value} value={item.value} disabled={item.disabled}>
                                                        {item.text}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020303', marginBottom: '8px' }}>
                                                نوع المستخدم
                                            </label>
                                            <select
                                                value={userType}
                                                onChange={(e) => setUserType(Number(e.target.value))}
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
                                            >
                                                <option value=""> {userType} </option>
                                                {userTypes.map((item) => (
                                                    <option key={item.value} value={item.value} disabled={item.disabled}>
                                                        {item.text}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                    </div>
                                    <div style={{ height: '1px', backgroundColor: '#E5E7EB', alignSelf: 'stretch', margin: '16px'}} />

                                    <div style={{ marginTop: '0px' }}>
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

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                alignItems: 'center',
                                                margin: '10px',
                                                gridColumn: '1 / -1',
                                                gap: '10px',
                                            }}>
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

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteAccount(selectedUserId)}
                                                    disabled={isSaving}
                                                    style={{
                                                        backgroundColor: '#924727',
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
                                                    {isSaving ? 'جاري حذف الحساب...' : 'حذف الحساب'}
                                                </button>

                                            </div>

                                        </div>

                                    </div>
                                </div>

                            </form>

                        </div>
                    </div>
                )}

                {
                    isaddModalOpen && (
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
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h2 style={{ margin: 6, color: '#1E466E', fontSize: '18px' }}> انشاء حساب جديد </h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={(e) => AddAccount(e)} style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'start' }}>


                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>

                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                paddingTop: '10px',
                                                minWidth: '140px',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '100px',
                                                    height: '100px',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    border: '3px solid #1E466E',
                                                    backgroundColor: '#E5E7EB',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <img
                                                    src={''}
                                                    alt="صورة المستخدم"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                    onError={(e) => {
                                                        (e.currentTarget as HTMLImageElement).src =
                                                            'https://ui-avatars.com/api/?name=' +
                                                            encodeURIComponent(firstName || 'User') +
                                                            '&background=1E466E&color=fff';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ width: '1px', backgroundColor: '#E5E7EB', alignSelf: 'stretch' }} />

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', flex: 1, textAlign: 'right' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>الاسم الاول</label>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}

                                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>الاسم الاخير</label>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}

                                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020303', marginBottom: '8px' }}>
                                                    البريد الإلكتروني
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
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
                                                <select
                                                    value={userStatus}
                                                    onChange={(e) => setUserStatus(e.target.value)}

                                                    style={{
                                                        color: '#1E466E',
                                                        width: '100%',
                                                        padding: '10px 14px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #D1D5DB',
                                                        fontSize: '14px',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                        backgroundColor: '#ffffff',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <option value=""> {'اختار الحالة'} </option>
                                                    {userStatuses.map((item) => (
                                                        <option key={item.value} value={item.value} disabled={item.disabled}>
                                                            {item.text}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020303', marginBottom: '8px' }}>
                                                    نوع المستخدم
                                                </label>
                                                <select
                                                    value={userType}
                                                    onChange={(e) => setUserType(e.target.value)}
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
                                                >
                                                    <option value=""> {'اختار نوع المستخدم'} </option>
                                                    {userTypes.map((item) => (
                                                        <option key={item.value} value={item.value} disabled={item.disabled}>
                                                            {item.text}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                        </div>
                                        <div style={{ height: '1px', backgroundColor: '#E5E7EB', alignSelf: 'stretch', margin: '16px' }} />

                                        <div style={{ marginTop: '5px', paddingTop: '16px' }}>
                                            <h3 style={{ gridColumn: '1 / -1', color: '#919191d6', fontSize: '16px', fontWeight: '600', marginTop: '20px', marginBottom: '16px' }}>
                                                كلمة المرور
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

                                            >

                                                <div>
                                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020202', marginBottom: '8px' }}>
                                                        كلمة مرور جديده
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
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
                                                        value={confirmPassword}
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

                                                <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '10px', gridColumn: '1 / -1', gap: '10px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', width: '100%' }}>
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
                                                            {isSaving ? 'جاري الحفظ...' : 'انشاء '}
                                                        </button>
                                                    </div>

                                                </div>

                                            </div>

                                        </div>
                                    </div>

                                </form>

                            </div>
                        </div>
                    )
                }
            </div>
        </AppLayout>
    );
}
