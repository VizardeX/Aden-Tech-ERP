import { useEffect, useState } from 'react'
import AppLayout from '../../components/AppLayout'
import './TaxCategories.css'
import React from 'react';
//import { getUserById, changePassword } from '../../services/userService'
import { authenticatedFetch } from '../../services/authService';


type TaxCategoriesScreenProps = {
    userName?: string
    onLogout?: () => void
    onNavigationChange?: (navigation: string) => void
}
interface TaxCategory {
    id: string;
    name: string;
    categoryType: number;
    taxRates: any[];
}

interface CategoryType {
    value: number;
    name: string;
}

interface Accounts {
    id: string;
    name: string;
    code: string;
}

interface TaxRate {
    id?: string;
    taxCategoryId?: string;
    name: string;
    percentage: number;
    ledgerAccountId: string;
    effectiveFrom: string;
}



export default function TaxCategories(
    { userName, onLogout, onNavigationChange }: TaxCategoriesScreenProps
) {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<TaxCategory | null>(null);
    const [selectedTypeCategory, setSelectedTypeCategory] = useState<CategoryType | null>(null);
    const [taxCategories, setTaxCategories] = useState<TaxCategory[]>([]);
    const [RateArry, setRateArry] = useState<TaxRate[]>([]);
    const [categoriesTypes, setCategoriesTypes] = useState<CategoryType[]>([]);
    const [Accounts, setaccounts] = useState<Accounts[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
    const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);
    const [isAddRateModalOpen, setIsAddRateModalOpen] = useState(false);
    const [CatName, setCatName] = useState('');
    const [CatType, setCatType] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [RateName, setRateName] = useState('');
    const [RatePercentage, setRatePercentage] = useState(0);
    const [ledgerIdState, setLedgerIdState] = useState<string>("01a0c0f6-479b-7798-9361-127f78b8d525");
    const [SelectedCategoryId, setSelectedCategoryId] = useState('');


    useEffect(() => {
        const fetchTaxCategories = async () => {
            try {
                setLoading(true);

                const typesResponse = await
                    authenticatedFetch('/api/v1/tax/tax-metadata'
                        , {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',

                            },
                        });

                if (!typesResponse.ok) {
                    throw new Error('فشل الاتصال بالخادم، تأكد من صحة الروابط أو الصلاحيات');
                }

                const typesData = await typesResponse.json();

                console.log("Types Data:", typesData);

                setCategoriesTypes(typesData.categoriesTypes || typesData || []);
                setaccounts(typesData.accounts || typesData || []);


                const initialTypes = typesData.categoriesTypes || typesData;
                if (Array.isArray(initialTypes) && initialTypes.length > 0) {
                    setSelectedTypeCategory(initialTypes[0]);
                }

                try {
                    const categoriesResponse = await authenticatedFetch('/api/v1/tax/categories'
                        , {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });
                    const categoriesData = await categoriesResponse.json();
                    console.log(categoriesData);
                    const currentCategory = categoriesData.find((cat: any) => cat.id === SelectedCategoryId);

                    setRateArry(currentCategory ? currentCategory.taxRates : []);
                    console.log(RateArry);
                    setTaxCategories(Array.isArray(categoriesData) ? categoriesData : []);
                } catch (catErr) {
                    console.error("Error fetching categories API:", catErr);
                }




            } catch (err) {
                console.error('Error fetching tax categories:', err);
            } finally {
                setLoading(false);
            }


        };

        fetchTaxCategories();
    }, []);



    const feachRate = async (userID: string) => {
        try {
            const categoriesResponse = await authenticatedFetch(`/api/v1/tax/categories/${userID}/history`
                , {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            const rateData = await categoriesResponse.json();
            console.log(rateData);
            rateData.sort((a: any, b: any) => {
                return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
            });
            setRateArry(rateData);
            console.log(RateArry);

        } catch (catErr) {
            console.error("Error fetching categories API:", catErr);
        }

    };

    const AddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        setCatName('');
        setCatType(null);

        try {

            const data = {
                name: CatName,
                categoryType: CatType
            };

            const response = await authenticatedFetch(`/api/v1/tax/categories`, {
                method: 'POST',
                headers: {
                    Accept: '*/*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const responseText = await response.text();

            console.log('Response category body:', responseText);

            if (!response.ok) {
                throw new Error(`API Error ${response.status}: ${responseText}`);
            }

            const result = responseText ? JSON.parse(responseText) : null;
            console.log('Success:', result);


            if (!response.ok) {
                throw new Error('فشلت الاضافة ');
            }

            setMessage({ type: 'success', text: 'تم الاضافة بنجاح!' });
            alert('تم الاضافة بنجاح!');
            setIsAddCatModalOpen(false)

        } catch (error: any) {
            console.error('Error saving changes:', error);
            setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء الاضافة .' });
        }

    };


    const handeleditCat = async (
    ) => {
        setIsEditCatModalOpen(true);
    };

    const editCat = async (
        userId: string | number
    ) => {
        console.log('edit cat id :', userId);
        const editCat = {
            name: CatName,
            categoryType: CatType

        }

        console.log('edit cat:', editCat)
        const formData = new FormData();
        formData.append('data', JSON.stringify(editCat));

        const response = await authenticatedFetch(
            `/api/v1/tax/categories/${userId}`,
            {
                method: 'PUT',
                headers: {
                    Accept: '*/*',
                    'Content-Type': 'application/json',

                },
                body: JSON.stringify(editCat),
            }
        );

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(responseText || 'فشل حفظ التغييرات');
        }
        if (response.ok) {
            setMessage({
                type: 'success',
                text: 'تم حفظ التغييرات بنجاح!',
            });
            alert('تم حفظ التغييرات بنجاح!');
        };
        setIsEditCatModalOpen(false);

    };

    const deleteCat = async (userId: string | number) => {

        const confirmDelete = window.confirm('هل أنت متأكد أنك تريد حذف هذه الفئة؟');
        if (!confirmDelete) {
            return;
        }
        console.log('delete cat id :', userId);
        const response = await authenticatedFetch(`/api/v1/tax/categories/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('فشل حذف الفئة');
        }

        alert('تم حذف الفئة بنجاح!');
    };

    const AddRate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        console.log('the category id :', SelectedCategoryId);

        try {

            const ratedata = {
                taxCategoryId: SelectedCategoryId,
                name: RateName,
                percentage: Number(RatePercentage) / 100,
                ledgerAccountId: ledgerIdState,
                effectiveFrom: new Date().toISOString(),

            };
            console.log('addRate data', ratedata);
            const formData = new FormData();
            formData.append('data', JSON.stringify(ratedata));

            const response = await authenticatedFetch(`/api/v1/tax/rates`, {
                method: 'POST',
                headers: {
                    Accept: '*/*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ratedata),
            });

            const responseText = await response.text();

            console.log('Response body:', responseText);

            if (!response.ok) {
                throw new Error(`API Error ${response.status}: ${responseText}`);
            }

            const result = responseText ? JSON.parse(responseText) : null;
            console.log('Success:', result);


            if (!response.ok) {
                throw new Error('فشلت الاضافة ');
            }

            setMessage({ type: 'success', text: 'تم الاضافة بنجاح!' });
            alert('تم الاضافة بنجاح!');
            setIsAddRateModalOpen(false)

        } catch (error: any) {
            console.error('Error saving changes:', error);
            setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء الاضافة .' });
        }

    };
    return (
        <AppLayout
            userName={userName}
            activeNavigation="الضريبه"
            activeSubNavigation="TaxCategories"
            onNavigationChange={onNavigationChange}
            onLogout={onLogout}
        >
            <div className="tax-container">
                <div className={`tax-card`}>

                    <div className="tax-top-header">
                        <button className="action-button" onClick={() => setIsAddCatModalOpen(true)}>
                            اضافة فئة
                        </button>
                    </div>

                    <div className="tax-card-body">

                        <div className="tax-list-section">
                            <div className="accordion-header" >
                                <h3>فئات الضرائب</h3>
                                <span className="toggle-text">

                                </span>
                            </div>

                            <ul className="tax-list">
                                {Array.isArray(taxCategories) && taxCategories.map((cat) => {
                                    const isSelected = SelectedCategoryId === cat.id;

                                    return (
                                        <li
                                            key={cat.id}
                                            className={`tax-list-item ${isSelected ? 'active' : ''}`}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}
                                        >
                                            <span
                                                style={{ cursor: 'pointer', flex: 1 }}
                                                onClick={async () => {
                                                    setSelectedCategoryId(cat.id);
                                                    setSelectedCategory(cat);
                                                    await feachRate(cat.id);
                                                }}
                                            >
                                                {cat.name}
                                            </span>

                                            <button
                                                type="button"
                                                className="edit-category-btn"
                                                style={{ padding: '4px 8px', fontSize: '12px', margin: 0 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCategoryId(cat.id);
                                                    setCatName(cat.name);
                                                    setCatType(cat.categoryType);
                                                    handeleditCat();
                                                }}
                                            >
                                                تعديل
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="tax-table-section">
                            <div className="table-header-title">
                                <div>


                                    <span style={{ fontSize: '13px', color: '#666' }}>
                                        {selectedCategory ? `الفئة الحالية: ${selectedCategory.name} ` : 'الرجاء اختيار فئة من القائمة الجانبية'}
                                    </span>
                                </div>

                                <button
                                    className="add-rate-btn"
                                    onClick={() => {
                                        if (!SelectedCategoryId) {
                                            alert("الرجاء اختيار فئة أولاً!");
                                            return;
                                        }
                                        setIsAddRateModalOpen(true);
                                    }}
                                    style={{ opacity: !SelectedCategoryId ? 0.5 : 1 }}
                                >
                                    + إضافة نسبة
                                </button>
                            </div>
                            <div className='table-container'>
                                <table className="tax-table">
                                    <thead>
                                        <tr>
                                            <th>تاريخ سريان النسبة</th>
                                            <th>اسم النسبة</th>
                                            <th>النسبة (Rate)</th>
                                            <th>الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {RateArry && RateArry.length > 0 ? (
                                            RateArry.map((rateItem: any, index: number) => (
                                                <tr key={rateItem.id || index}>
                                                    <td>{rateItem.effectiveFrom ? new Date(rateItem.effectiveFrom).toLocaleDateString() : '---'}</td>
                                                    <td>{rateItem.name || '---'}</td>
                                                    <td>{rateItem.percentage !== undefined ? `${rateItem.percentage * 100}%` : '---'}</td>
                                                    <td>{rateItem.isActive ? 'نشط' : 'غير نشط'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="no-data-message">
                                                    {SelectedCategoryId ? 'لا توجد نسب (Rates) مسجلة لهذه الفئة حالياً' : 'الرجاء اختيار فئة لعرض النسب الخاصة بها'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
                {isAddCatModalOpen && (
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
                                <h2 style={{ margin: 6, color: '#1E466E', fontSize: '18px' }}>  اضافة فئة جديدة  </h2>
                                <button
                                    onClick={() => setIsAddCatModalOpen(false)}
                                    style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={(e) => AddCategory(e)} style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'start' }}>


                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px', flex: 1, textAlign: 'right' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}> اسم النوع </label>
                                            <input
                                                type="text"
                                                value={CatName}
                                                onChange={(e) => setCatName(e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020303', marginBottom: '8px' }}>
                                                    نوع الفئة
                                                </label>
                                                <select
                                                    value={CatType !== null ? CatType : ''}
                                                    onChange={(e) => setCatType(e.target.value === '' ? null : Number(e.target.value))}
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
                                                    <option value="" disabled> {'اختر نوع الفئة'} </option>

                                                    {Array.isArray(categoriesTypes) && categoriesTypes.map((item) => (
                                                        <option key={item.value} value={item.value}>
                                                            {item.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

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
                            </form>

                        </div>
                    </div>
                )
                }
                {isEditCatModalOpen && (

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
                                <h2 style={{ margin: 6, color: '#1E466E', fontSize: '18px' }}>  تعديل فئة  </h2>
                                <button
                                    onClick={() => setIsEditCatModalOpen(false)}
                                    style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); editCat(SelectedCategoryId) }} style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'start' }}>


                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px', flex: 1, textAlign: 'right' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}> اسم النوع </label>
                                            <input
                                                type="text"
                                                value={CatName}
                                                onChange={(e) => setCatName(e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020303', marginBottom: '8px' }}>
                                                    نوع الفئة
                                                </label>
                                                <select
                                                    value={CatType !== null ? CatType : ''}
                                                    onChange={(e) => setCatType(e.target.value === '' ? null : Number(e.target.value))}
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
                                                    <option value="CatType" disabled> {CatType} </option>

                                                    {Array.isArray(categoriesTypes) && categoriesTypes.map((item) => (
                                                        <option key={item.value} value={item.value}>
                                                            {item.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

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
                                                    {isSaving ? 'جاري الحفظ...' : 'تعديل '}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => deleteCat(SelectedCategoryId)}
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

                {isAddRateModalOpen && (
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
                                <h2 style={{ margin: 6, color: '#1E466E', fontSize: '18px' }}>  اضافة نسبة جديدة  </h2>
                                <button
                                    onClick={() => setIsAddRateModalOpen(false)}
                                    style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={(e) => AddRate(e)} style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'start' }}>


                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px', flex: 1, textAlign: 'right' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}> اسم النوع </label>
                                            <input
                                                type="text"
                                                value={RateName}
                                                onChange={(e) => setRateName(e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>  النسبة </label>
                                            <input
                                                type="text"
                                                value={RatePercentage}
                                                onChange={(e) => setRatePercentage(Number(e.target.value))}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>  اختر الحساب  </label>
                                            <select
                                                className="account-select"
                                                value={ledgerIdState}
                                                onChange={(e) => {
                                                    const selectedId = e.target.value;
                                                    setLedgerIdState(selectedId);
                                                    console.log("Selected Ledger Account ID:", selectedId);
                                                }}
                                            >
                                                <option value="" disabled>اختر الحساب المحاسبي</option>
                                                {Accounts.map((acc) => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.name}
                                                    </option>
                                                ))}

                                                {Accounts.length === 0 && (
                                                    <option value="" disabled>لا توجد حسابات متاحـة</option>
                                                )}
                                            </select>
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
                            </form>

                        </div>
                    </div>
                )
                }


            </div>
        </AppLayout>

    )


}