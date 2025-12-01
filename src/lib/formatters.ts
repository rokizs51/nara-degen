export function formatCurrency(amount: number, currency: string = 'IDR'): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
}

export function calculateRelativePerformance(
    stockGain: number,
    indexGain?: number
): { outperformance: number; isOutperforming: boolean } {
    if (indexGain === undefined) {
        return { outperformance: 0, isOutperforming: false };
    }

    const outperformance = stockGain - indexGain;
    return {
        outperformance,
        isOutperforming: outperformance > 0
    };
}
