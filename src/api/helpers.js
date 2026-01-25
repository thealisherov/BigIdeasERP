export const getUserBranchId = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;

        const user = JSON.parse(userStr);
        // Handle both camelCase and snake_case depending on API response format
        return user.branchId || user.branch_id || user.branchID;
    } catch (error) {
        console.error('Error getting branch ID:', error);
        return null;
    }
};

export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0 UZS';

    // Ensure amount is a number and handle potential floating point issues by rounding if needed,
    // but typically for currency we want to show exact unless it's just display formatting.
    // The requirement "Fix price formatting bugs... If price is 400,000 It MUST NOT show 399,000"
    // suggests a floating point error (e.g. 399999.99999999994).
    // We should round to nearest integer for UZS usually.

    const number = Number(amount);
    if (isNaN(number)) return '0 UZS';

    // Round to avoid 399,999.99999 issue if it's supposed to be 400,000
    const rounded = Math.round(number);

    return new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: 'UZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(rounded);
};

export const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
};

export const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};
