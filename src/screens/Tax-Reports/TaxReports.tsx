import { useEffect, useState } from 'react'
import AppLayout from '../../components/AppLayout'
import './TaxReports.css'
import React from 'react';
import { authenticatedFetch } from '../../services/authService';

type TaxReportsScreenProps = {
    userName?: string
    onLogout?: () => void
    onNavigationChange?: (navigation: string) => void
}

interface StatItem {
    label: string;
    value: string | number;
}

export default function TaxReports({ userName, onLogout, onNavigationChange }: TaxReportsScreenProps) {


    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeriodStart, setSelectedPeriodStart] = useState('');
    const [selectedPeriodEnd, setSelectedPeriodEnd] = useState('');
    const [showCards, setShowCards] = useState<boolean>(false);
    const [statsData, setStatsData] = useState<StatItem[]>([
        { label: 'إجمالي ضريبة المخرجات (Output VAT)', value: '---' },
        { label: 'إجمالي ضريبة المدخلات (Input VAT)', value: '---' },
        { label: 'صافي الضريبة المستحقة (Net Tax Payable)', value: '---' },
    ]);

    const generateFinancialYears = (numberOfYears = 5) => {
        const currentYear = new Date().getFullYear();
        const yearsList = [];
        const now = new Date().toISOString();

        for (let i = 0; i < numberOfYears; i++) {
            const startYear = currentYear - i;
            const endYear = startYear + 1;
            
            yearsList.push({
                label: `${startYear} - ${endYear}`,
                periodStart: `${startYear}-01-01T00:00:00.000000Z`,
                periodEnd: `${endYear}-12-31T23:59:59.999999Z`,
            });
        }
        return yearsList;
    };

    const financialYears = generateFinancialYears(5);

    const [selectedPeriod, setSelectedPeriod] = useState({
        label: '',
        periodStart: '',
        periodEnd: ''
    });

    const fetchReportStats = async (start: string, end: string) => {
        try {
            setLoading(true);
            const response = await authenticatedFetch(`/api/v1/tax/reports/audit?startDate=${start}&endDate=${end}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            console.log("the send date", start, "to", end);
            console.log("Fetched report data:", data);

            if(response.status == 200) {
                console.log("Report data fetched successfully.");
            };
            setStatsData([
              { label: 'إجمالي ضريبة المخرجات (Output VAT)', value: data.totalOutputVat ?? 0 },
                { label: 'إجمالي ضريبة المدخلات (Input VAT)', value: data.totalInputVat ?? 0 },
                { label: 'صافي الضريبة المستحقة (Net Tax Payable)', value: data.netTaxPayable ?? 0 },
            ]);
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDisplayReport = async (
        periodStart: string, periodEnd: string
    ) => {

        if (!selectedPeriod.periodStart) {
            alert('الرجاء اختيار السنة المالية أولاً');
            return;
        }

        setShowCards(true);
        await fetchReportStats(selectedPeriod.periodStart, selectedPeriod.periodEnd);
        console.log( "for period:", selectedPeriod.periodStart, "to", selectedPeriod.periodEnd);

        
    }

    const handleClear = () => {
        setSelectedPeriod({
            label: '',
            periodStart: '',
            periodEnd: ''
        });

        setShowCards(false);
    };

    return (
        <AppLayout
            userName={userName}
            onLogout={onLogout}
            onNavigationChange={onNavigationChange}
        >
            <div className="tax-reports-screen">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleDisplayReport(selectedPeriod.periodStart, selectedPeriod.periodEnd);
                }} className="report-filter-form">


                    <div className="filter-field-group">
                        <label className="filter-label">السنة المالية:</label>
                        <select
                            className="period-select"
                            value={selectedPeriod.label}
                            onChange={(e) => {
                                const chosenLabel = e.target.value;
                                const foundPeriod = financialYears.find(item => item.label === chosenLabel);

                                if (foundPeriod) {
                                    setSelectedPeriod(foundPeriod);
                                }
                            }}
                        >
                            <option value="" disabled>اختر السنة المالية</option>
                            {financialYears.map((item, index) => (
                                <option key={index} value={item.label}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>


                    <div className="filter-actions">

                        <button type="submit" className="btn-display">
                            عرض 
                        </button>


                        <button type="button" onClick={handleClear} className="btn-clear">
                            تصفية 
                        </button>
                    </div>
                </form>

             {showCards && (
                <div className="stats-cards-container">
                    {statsData.map((stat, index) => (
                        <div key={index} className="stat-card">
                            <span className="stat-label">{stat.label}</span>
                            <span className="stat-value">
                                {loading ? <span className="stat-loading">جاري التحميل...</span> : stat.value}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            </div>
        </AppLayout>
    )
}