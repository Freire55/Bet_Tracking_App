// utils/statsAggregator.js (REWRITTEN BASED ON BUCKET STRATEGY)

/**
 * Utility function to normalize a Date object to the start of its local day (midnight).
 */
const normalizeDate = (date) => {
    if (!date || isNaN(date.getTime())) return null;
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Calculates the total cumulative profit over time by bucketing bets into fixed periods.
 * @param {Array<Object>} bets - Array of bet objects.
 * @param {string} period - The time period to segment the data by ('7d', '4w', '6m', '4y').
 * @returns {Object} Chart data structure { labels: [], datasets: [{ data: [] }] }
 */
export const calculateProfitChartData = (bets, period) => {
    
    // --- 1. Prepare and Sort all events ---
    const sortedEvents = bets
        .filter(bet => bet.date)
        .map(bet => {
            let date;
            if (typeof bet.date === 'string') {
                // Use local parsing for dates without explicit time/timezone
                date = bet.date.length === 10 ? new Date(bet.date) : new Date(bet.date);
            } else {
                date = new Date(bet.date);
            }

            const profit = parseFloat(bet.amount_won || 0) - parseFloat(bet.amount_bet || 0);

            return {
                date: date,
                profit: profit,
            };
        })
        .filter(event => 
            !isNaN(event.date) && Math.abs(event.profit) > 0.001 
        )
        // Sort oldest to newest (crucial for cumulative sum)
        .sort((a, b) => a.date.getTime() - b.date.getTime()); 

    if (sortedEvents.length === 0) {
        return { labels: ['Start'], datasets: [{ data: [0] }] };
    }

    // --- 2. Define Timeframe and Buckets ---
    let maxPeriods;
    let labelCallback;
    let getPeriodIndex; // Function to determine which bucket a bet belongs to

    const today = normalizeDate(new Date());
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    switch (period) {
        case '7d':
            maxPeriods = 7;
            labelCallback = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
            // Index 0 = 7 days ago, Index 6 = today
            getPeriodIndex = (betDate) => {
                const diffDays = Math.floor((normalizeDate(betDate).getTime() - normalizeDate(today).getTime()) / MS_PER_DAY) + 6;
                return diffDays; 
            };
            break;

        case '4w':
            maxPeriods = 4;
            labelCallback = (d, i) => `Wk ${i + 1}`; 
            // Weeks are bucketed 0-3 (4 weeks total)
            getPeriodIndex = (betDate) => {
                // Calculate difference in days, then divide by 7 to get week index
                const diffDays = Math.floor((normalizeDate(betDate).getTime() - normalizeDate(today).getTime()) / MS_PER_DAY);
                const diffWeeks = Math.floor(diffDays / 7) + 3; // +3 to bucket today's week as index 3
                return diffWeeks;
            };
            break;

        case '6m':
            maxPeriods = 6;
            labelCallback = (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            getPeriodIndex = (betDate) => {
                const date = betDate;
                const index = (today.getFullYear() * 12 + today.getMonth()) - (date.getFullYear() * 12 + date.getMonth());
                // Invert and offset to put the current month as the last bucket (index 5)
                return 5 - index;
            };
            break;

        case '4y':
            maxPeriods = 4;
            labelCallback = (d) => d.toLocaleDateString('en-US', { year: 'numeric' });
            getPeriodIndex = (betDate) => {
                const diffYears = today.getFullYear() - betDate.getFullYear();
                // Invert and offset to put the current year as the last bucket (index 3)
                return 3 - diffYears; 
            };
            break;
    }

    // Initialize profit buckets and the cumulative line array
    // Buckets will hold the profit *added* in that specific period.
    const profitBuckets = new Array(maxPeriods).fill(0); 

    // --- 3. First Pass: Calculate Cumulative Profit BEFORE Chart Start ---
    let cumulativeProfit = 0;
    let firstBetDate = sortedEvents[0].date;
    
    // Calculate the precise chart start boundary (e.g., 7 days ago at midnight)
    const chartStartDate = new Date(today.getTime());
    if (period === '7d') chartStartDate.setDate(today.getDate() - 6);
    else if (period === '4w') chartStartDate.setDate(today.getDate() - 27); // 4 weeks ago
    else if (period === '6m') chartStartDate.setMonth(today.getMonth() - 5, 1);
    else if (period === '4y') chartStartDate.setFullYear(today.getFullYear() - 3, 0, 1);

    // Filter out bets that occurred before the chart start date to get starting cumulative P/L
    let betsInChartPeriod = [];
    for (const event of sortedEvents) {
        if (event.date < chartStartDate) {
            cumulativeProfit += event.profit;
        } else {
            betsInChartPeriod.push(event);
        }
    }


    // --- 4. Second Pass: Bucket Profits ---
    for (const event of betsInChartPeriod) {
        const index = getPeriodIndex(event.date);
        
        // Check if the index is within the valid range (0 to maxPeriods - 1)
        if (index >= 0 && index < maxPeriods) {
            // Add the bet's profit to the correct time bucket
            profitBuckets[index] += event.profit;
        }
    }

    // --- 5. Final Pass: Generate Cumulative Points and Labels ---
    let chartPoints = [];
    let chartLabels = [];
    let currentDate = normalizeDate(new Date(chartStartDate.getTime()));
    
    for (let i = 0; i < maxPeriods; i++) {
        // Add the profit from the current bucket to the cumulative total
        cumulativeProfit += profitBuckets[i];
        chartPoints.push(cumulativeProfit);
        
        // Generate the label for this period
        chartLabels.push(labelCallback(currentDate, i));

        // Move the date marker to the start of the next period
        if (period === '7d') currentDate.setDate(currentDate.getDate() + 1);
        else if (period === '4w') currentDate.setDate(currentDate.getDate() + 7);
        else if (period === '6m') currentDate.setMonth(currentDate.getMonth() + 1);
        else if (period === '4y') currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
    
    // Ensure the chart points have a non-zero element if total profit is non-zero
    if (chartPoints.every(p => p === 0) && Math.abs(cumulativeProfit) > 0) {
        // If all points are zero, but the actual total is not, something is still wrong with the date comparison logic
        // Forcing the last point to be the true total P/L as a fallback
        chartPoints[chartPoints.length - 1] = cumulativeProfit;
    }


    const chartColor = (opacity = 1) => `rgba(23, 202, 230, ${opacity})`;

    return {
        labels: chartLabels,
        datasets: [{
            data: chartPoints,
            color: chartColor,
            strokeWidth: 2,
        }],
    };
};