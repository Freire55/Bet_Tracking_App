// utils/statsAggregator.js

/**
 * Calculates the total cumulative profit over time for a given array of bets.
 * @param {Array<Object>} bets - Array of bet objects (from 'bet' or 'casino_bet' table).
 * @param {string} period - The time period to segment the data by ('7d', '4w', '6m', '4y').
 * @returns {Object} Chart data structure { labels: [], datasets: [{ data: [] }] }
 */
export const calculateProfitChartData = (bets, period) => {
    // 1. Prepare and Sort all events
    const allEvents = bets
        .filter(bet => bet.date) // Only include bets with a date property
        .map(bet => {
            const dateValue = bet.date;
            let date;
            
            // Robust Date Parsing: Handle common SQLite formats and attempt standard Date construction
            if (typeof dateValue === 'string' && dateValue.length === 10 && dateValue.includes('-')) {
                // 'YYYY-MM-DD' format: Append UTC time suffix to prevent local timezone issues
                date = new Date(dateValue + 'T00:00:00Z');
            } else if (typeof dateValue === 'string') {
                // Try standard parsing
                date = new Date(dateValue);
            } else {
                // Assume number (timestamp) or already a Date object
                date = new Date(dateValue);
            }

            const profit = parseFloat(bet.amount_won || 0) - parseFloat(bet.amount_bet || 0);

            return {
                date: date,
                profit: profit,
            };
        })
        .filter(event => 
            !isNaN(event.date) && 
            event.date instanceof Date && 
            Math.abs(event.profit) > 0.001 // Filter out tiny/zero profits if necessary
        )
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (allEvents.length === 0) {
        return { labels: ['Today'], datasets: [{ data: [0] }] };
    }

    // --- 2. Determine Timeframe Boundaries ---
    let maxPeriods;
    let timeUnit;
    let labelCallback;

    switch (period) {
        case '7d':
            maxPeriods = 7; timeUnit = 'day'; labelCallback = (d) => d.toLocaleDateString('en-US', { weekday: 'short' }); break;
        case '4w':
            maxPeriods = 4; timeUnit = 'week'; labelCallback = (d, i) => `Wk ${i + 1}`; break; // Label weeks W1, W2...
        case '6m':
            maxPeriods = 6; timeUnit = 'month'; labelCallback = (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); break;
        case '4y':
            maxPeriods = 4; timeUnit = 'year'; labelCallback = (d) => d.toLocaleDateString('en-US', { year: 'numeric' }); break;
        default:
            return { labels: ['Today'], datasets: [{ data: [0] }] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate the start date of the chart window based on the period
    const getChartStartDate = (date, unit, count) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        if (unit === 'day') {
            d.setDate(d.getDate() - count + 1);
        } else if (unit === 'week') {
            d.setDate(d.getDate() - count * 7 + 1); // Start 4 weeks ago
        } else if (unit === 'month') {
            d.setMonth(d.getMonth() - count + 1);
            d.setDate(1);
        } else if (unit === 'year') {
            d.setFullYear(d.getFullYear() - count + 1);
            d.setMonth(0, 1);
        }
        return d;
    };
    
    const chartStartDate = getChartStartDate(today, timeUnit, maxPeriods);
    
    // --- 3. Aggregate Profits by Day ---
    const dailyProfitMap = {};
    allEvents.forEach(event => {
        // Use a standard ISO key for aggregation
        const dayKey = event.date.toISOString().split('T')[0]; 
        dailyProfitMap[dayKey] = (dailyProfitMap[dayKey] || 0) + event.profit;
    });

    // --- 4. Calculate Starting Cumulative Profit ---
    let cumulativeProfit = 0;
    allEvents.forEach(event => {
        // Sum profit for all bets that occurred *before* the chart start date
        if (event.date < chartStartDate) {
            cumulativeProfit += event.profit;
        }
    });

    // --- 5. Generate Chart Points and Labels ---
    let chartPoints = [];
    let chartLabels = [];
    let currentDate = new Date(chartStartDate);

    for (let i = 0; i < maxPeriods; i++) {
        let periodProfit = 0;
        let periodEndDate = new Date(currentDate);

        // Define the period step and end date
        if (timeUnit === 'day') {
            periodEndDate.setDate(periodEndDate.getDate() + 1);
        } else if (timeUnit === 'week') {
            periodEndDate.setDate(periodEndDate.getDate() + 7);
        } else if (timeUnit === 'month') {
            periodEndDate.setMonth(periodEndDate.getMonth() + 1);
        } else if (timeUnit === 'year') {
            periodEndDate.setFullYear(periodEndDate.getFullYear() + 1);
        }

        // Aggregate daily profits within this period
        for (const key in dailyProfitMap) {
            const day = new Date(key + 'T00:00:00Z');
            if (day >= currentDate && day < periodEndDate) {
                periodProfit += dailyProfitMap[key];
            }
        }

        // Update cumulative profit and push data point
        cumulativeProfit += periodProfit;
        chartPoints.push(cumulativeProfit);

        // Add label
        chartLabels.push(labelCallback(currentDate, i));

        // Move to the next period start date
        currentDate = periodEndDate;
        currentDate.setHours(0, 0, 0, 0); // Normalize
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