import { useState, useEffect } from 'react'
import AppLayout from '../../components/AppLayout'
import './HsCode.css'
import { authenticatedFetch } from '../../services/authService';

type HsCodeScreenProps = {
    userName?: string
    onLogout?: () => void
    onNavigationChange?: (navigation: string) => void
}
interface HsItem {
    id: string;
    tariffCode: string;
    description: string;
    dutyPercentage: string;
    linkedItemsCount: number | string;
}


export default function HsCode({ userName, onLogout, onNavigationChange }: HsCodeScreenProps) {

    const [hsCodeInput, setHsCodeInput] = useState('');
    const [selectedDuty, setSelectedDuty] = useState('');
    const [showTable, setShowTable] = useState(false);
    const [PageNumber, setPageNumber] = useState(1);
    const PageSize = 10;
    const [totalPages, setTotalPages] = useState<number>(1);
    const [isdetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddHsCodeModalOpen, setIsAddhsCodeModalOpen] = useState(false);
    const [tableData, setTableData] = useState<HsItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isSaving] = useState<boolean>(false);
    const [itemId, setItemId] = useState<string>('');
    const [hsCode, setHsCode] = useState<string>('');
    const [dutyPercentage, setDutyPercentage] = useState<number | string>('');
    const [description, setDescription] = useState<string>('');
    const [newHsCode, setNewHsCode] = useState<string>('');
    const [newDutyPercentage, setNewDutyPercentage] = useState<number | string>('');
    const [newDescription, setNewDescription] = useState<string>('');
    const [allRates, setAllRates] = useState<any[]>([]);

    const fetchHsData = async (currentPage: number) => {
        try {
            setLoading(true);

            const queryParams = new URLSearchParams({
                pageNumber: currentPage.toString(),
                pageSize: PageSize.toString(),
                ...(hsCodeInput && { hsCode: hsCodeInput }),
                ...(selectedDuty && { dutyRate: selectedDuty }),
            });

            console.log('Query Params:', queryParams.toString());

            const response = await authenticatedFetch(`/api/v1/hs-codes?${queryParams.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            console.log('Response get HS codes:', response);

            if (response.ok) {
                const data = await response.json();
                setTableData(data.items || data || []);
                console.log('Fetched HS codes:', data);
                setTotalPages(data.totalPages || 1);
            } else {
                console.error('Error fetching HS codes:', response);
                alert('حدث خطأ أثناء جلب البيانات');
            }
        } catch (error) {
            console.error('Error fetching HS codes:', error);
            alert('تعذر الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    const fetchAndExtractAllRates = async () => {
        try {
            const categoriesResponse = await authenticatedFetch('/api/v1/tax/categories', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();


                const extractedRates = categoriesData.flatMap((cat: any) =>
                    (cat.taxRates || []).map((rate: any) => ({
                        ...rate,
                        categoryName: cat.name
                    }))
                );


                setAllRates(extractedRates);
            }
        } catch (catErr) {
            console.error("Error fetching tax categories for rates:", catErr);
        }
    };

    useEffect(() => {
        if (showTable) {
            fetchHsData(PageNumber);
        };

        fetchAndExtractAllRates();
    }, [PageNumber]);

    const handleImportOrSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setShowTable(true);
        if (PageNumber === 1) {
            fetchHsData(1);
        } else {
            setPageNumber(1);
        }

    };

    const handleMoreDetails = async (id: string) => {
        setItemId(id);

        const itemById = await authenticatedFetch(`/api/v1/hs-codes/${id}`
            , {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

        console.log('Response get HS code by ID:', itemById);

        if (itemById.ok) {
            const data = await itemById.json();
            console.log('Fetched HS code by ID:', data);
            setDescription(data.description || '');
            setDutyPercentage(data.dutyPercentage || '');
            setHsCode(data.tariffCode || '');
        }

    };

    const handleEdit = async (id: string) => {
        setItemId(id);

        const itemById = await authenticatedFetch(`/api/v1/hs-codes/${id}`
            , {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

        console.log('Response get HS code by ID:', itemById);

        if (itemById.ok) {
            const data = await itemById.json();
            console.log('Fetched HS code by ID:', data);
            setDescription(data.description || '');
            setDutyPercentage(data.dutyPercentage || '');
            setHsCode(data.tariffCode || '');
        }


    };

    const savechanges = async (e: React.FormEvent) => {
        e.preventDefault();

        const changes = {
            description: description,
            dutyPercentage: Number(dutyPercentage),
        };
        const response = await authenticatedFetch(
            `/api/v1/hs-codes/${itemId}`,
            {
                method: 'PUT',
                headers: {
                    Accept: '*/*',
                    'Content-Type': 'application/json',

                },
                body: JSON.stringify(changes),
            }
        );

        if (!response.ok) {
            console.error('Error saving changes:', response);
            alert('حدث خطأ أثناء حفظ التغييرات');
            return;
        }

        alert('تم حفظ التغييرات بنجاح!');
        fetchHsData(PageNumber);
        setIsEditModalOpen(false);
    }

    const addHsCode = async (e: React.FormEvent) => {
        e.preventDefault();

        const newHsCodeData = {
            tariffCode: newHsCode,
            description: newDescription,
            dutyPercentage: Number(newDutyPercentage),
        };



        const response = await authenticatedFetch(`/api/v1/hs-codes`,
            {
                method: 'POST',
                headers: {
                    Accept: '*/*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newHsCodeData),

            });

        console.log('Response adding new HS code:', response);
        console.log('New HS code data:', newHsCodeData);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server Error Details:', errorText);
        }

        if (response.ok) {
            alert('تم إضافة الكود بنجاح!');
            fetchHsData(PageNumber);
            setIsAddhsCodeModalOpen(false);
            setNewHsCode('');
            setNewDescription('');
            setNewDutyPercentage('');
        }
    }

    const deleteitem = async () => {


        const confirmDelete = window.confirm('هل أنت متأكد أنك تريد حذف هذا العنصر ؟');
        if (!confirmDelete) {
            return;
        }
        console.log('delete cat id :', itemId);
        const response = await authenticatedFetch(`/api/v1/hs-codes/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('فشل حذف ');
        }

        alert('تم حذف بنجاح!');
        fetchHsData(PageNumber);
        setIsEditModalOpen(false);
    };




    return (
        <AppLayout userName={userName} onLogout={onLogout} onNavigationChange={onNavigationChange}>
            <div className="hs-search-container">
                <form onSubmit={(e) => handleImportOrSearch(e)} className="hs-filter-bar">
                    <div className="input-group">
                        <label>بحث HS Code:</label>

                        <input
                            className="hs-input"
                            type="text"
                            placeholder="أدخل رمز الـ HS Code..."
                            value={hsCodeInput}
                            onChange={(e) => setHsCodeInput(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>فلترة الرسوم (Filter Duty):</label>
                        <select
                            className="duty-select"
                            value={selectedDuty}
                            onChange={(e) => setSelectedDuty(e.target.value)}
                        >
                            <option value="">جميع النسب (All Rates)</option>
                            {allRates.map((rateItem) => {
                                const percentageValue = rateItem.percentage * 100;

                                return (
                                    <option key={rateItem.id} value={percentageValue}>
                                         ({percentageValue}%) 
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <button type="submit" className="btn-import">
                        {loading ? 'جاري التحميل...' : ' عرض النتائج '}

                    </button>

                    <button onClick={() => setIsAddhsCodeModalOpen(true)} className="btn-add">
                       +

                    </button>

                </form>

                {showTable && (
                    <div className="hs-results-table-container">
                        <table className="hs-table">
                            <thead>
                                <tr>
                                    <th>الكود (HS Code)</th>
                                    <th>التفاصيل</th>
                                    <th>الريت (Duty Rate)</th>
                                    <th>العناصر</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                                            جاري تحميل البيانات...
                                        </td>
                                    </tr>
                                ) : tableData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                                            لا توجد بيانات مطابقة للبحث
                                        </td>
                                    </tr>
                                ) : (
                                    tableData.slice(0, PageSize).map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.tariffCode}</td>
                                            <td>{item.description}</td>
                                            <td>{item.dutyPercentage}%</td>
                                            <td>{item.linkedItemsCount}</td>
                                            <td>
                                                <div className="row-actions">
                                                    <button
                                                        type="button"
                                                        className="btn-details"
                                                        onClick={() => {
                                                            handleMoreDetails(item.id);
                                                            setIsDetailsModalOpen(true);
                                                        }}
                                                    >
                                                        المزيد
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-edit"
                                                        onClick={() => {
                                                            handleEdit(item.id);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                    >
                                                        تعديل
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="pagination-bar">
                            <span className="pagination-info">
                                صفحة {PageNumber} من {totalPages} (الحد الأقصى {PageSize} صفوف)
                            </span>

                            <div className="pagination-controls">
                                <button
                                    type="button"
                                    className="page-btn"
                                    disabled={PageNumber <= 1 || loading}
                                    onClick={() => setPageNumber((prev) => prev - 1)}
                                >
                                    السابق
                                </button>

                                <span className="page-number-badge">{PageNumber}</span>

                                <button
                                    type="button"
                                    className="page-btn"
                                    disabled={PageNumber >= totalPages || loading}
                                    onClick={() => setPageNumber((prev) => prev + 1)}
                                >
                                    التالي
                                </button>
                            </div>
                        </div>

                    </div>
                )}

                {isdetailsModalOpen && (

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
                            width: '30%',
                            maxWidth: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ margin: 6, color: '#1E466E', fontSize: '18px' }}>      </h2>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <form style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'start' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px', flex: 1, textAlign: 'right' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}> الكود  </label>
                                            <input
                                                type="text"
                                                value={hsCode}
                                                readOnly
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', cursor: 'not-allowed', }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}> التفاصيل  </label>
                                            <input
                                                type="text"
                                                value={description}
                                                readOnly
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', cursor: 'not-allowed', }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}> نسبة الرسوم </label>
                                            <input
                                                type="text"
                                                value={dutyPercentage}
                                                readOnly
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', cursor: 'not-allowed', }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '10px', gridColumn: '1 / -1', gap: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', width: '100%' }}>
                                                <button
                                                    type="submit"
                                                    disabled={isSaving}
                                                    onClick={() => {
                                                        setIsEditModalOpen(true);
                                                        setIsDetailsModalOpen(false);
                                                    }}
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
                                                    تعديل
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                )}

                {isEditModalOpen && (
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
                            width: '30%',
                            maxWidth: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ margin: 6, color: '#1E466E', fontSize: '18px' }}> تعديل العنصر </h2>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={(e) => savechanges(e)} style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'start' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px', flex: 1, textAlign: 'right' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}> الكود  </label>
                                            <input
                                                type="text"
                                                value={hsCode}
                                                readOnly
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', backgroundColor: '#F3F4F6', color: '#6B7280', cursor: 'not-allowed', }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}> التفاصيل  </label>
                                            <input
                                                type="text"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}> نسبة الرسوم </label>
                                            <input
                                                type="text"
                                                value={dutyPercentage}
                                                onChange={(e) => setDutyPercentage(e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '10px', gridColumn: '1 / -1', gap: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', width: '100%', gap: '10px' }}>
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
                                                    {isSaving ? 'جاري الحفظ...' : 'تعديل'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => deleteitem()}
                                                    style={{
                                                        backgroundColor: '#dc2626',
                                                        color: '#ffffff',
                                                        padding: '10px 24px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    حذف
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isAddHsCodeModalOpen && (
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
                            width: '30%',
                            maxWidth: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ margin: 6, color: '#1E466E', fontSize: '18px' }}>  اضافة عنصر جديد  </h2>
                                <button
                                    onClick={() => setIsAddhsCodeModalOpen(false)}
                                    style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={(e) => addHsCode(e)} style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'start' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px', flex: 1, textAlign: 'right' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}> الكود  </label>
                                            <input
                                                type="text"
                                                value={newHsCode}
                                                onChange={(e) => setNewHsCode(e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}> التفاصيل  </label>
                                            <input
                                                type="text"
                                                value={newDescription}
                                                onChange={(e) => setNewDescription(e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}> نسبة الرسوم </label>
                                            <input
                                                type="text"
                                                value={newDutyPercentage}
                                                onChange={(e) => setNewDutyPercentage(e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
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
                                                    {isSaving ? 'جاري الحفظ...' : 'إضافة'}
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}

