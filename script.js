// Sample stock data (NVDA, hardcoded for static site)
const stockData = {
    "NVDA": {
        "1 Hour": {
            labels: ["2025-03-14 16:45", "2025-03-14 16:46", "2025-03-14 16:47"],
            prices: [121.50, 121.67, 121.60],
            highs: [121.55, 121.70, 121.65],
            lows: [121.45, 121.65, 121.55]
        },
        "1 Day": {
            labels: ["2025-03-14 09:00", "2025-03-14 12:00", "2025-03-14 15:00"],
            prices: [121.00, 121.50, 121.67],
            highs: [121.10, 121.55, 121.70],
            lows: [120.90, 121.45, 121.65]
        },
        "1 Month": {
            labels: ["2025-02-14", "2025-02-21", "2025-02-28", "2025-03-07", "2025-03-14"],
            prices: [138.48, 135.00, 130.00, 125.00, 121.67],
            highs: [139.00, 136.00, 131.00, 126.00, 122.00],
            lows: [137.00, 134.00, 129.00, 124.00, 121.00]
        }
    }
};

// Hardcoded transactions (in-memory only)
let transactions = [
    { datetime: "2025-03-14 17:45:00", ticker: "NVDA", amount: 10, price_at_transaction: 121.67 }
];

// Exchange rate (static for demo)
const usdToAudRate = 1.59; // March 14, 2025 estimate

// Chart instance
let chart;

// Graph Page Logic
if (document.getElementById("stockChart")) {
    const ctx = document.getElementById("stockChart").getContext("2d");
    let currency = "USD";

    function updateChart() {
        const ticker = document.getElementById("ticker").value;
        const timeFrame = document.getElementById("timeFrame").value;
        const rate = currency === "AUD" ? usdToAudRate : 1.0;

        const data = stockData[ticker][timeFrame] || stockData["NVDA"]["1 Month"];
        const labels = data.labels;
        const prices = data.prices.map(p => p * rate);
        const highs = data.highs.map(h => h * rate);
        const lows = data.lows.map(l => l * rate);

        // Simple SMA calculation (20-period approximation)
        const sma20 = prices.map((_, i) => {
            const start = Math.max(0, i - 19);
            return prices.slice(start, i + 1).reduce((a, b) => a + b, 0) / (i - start + 1);
        });

        // Transaction markers
        const transactionPoints = transactions
            .filter(t => t.ticker === ticker)
            .map(t => ({
                x: t.datetime.slice(0, 10) + (timeFrame === "1 Hour" || timeFrame === "1 Day" ? t.datetime.slice(10) : ""),
                y: t.price_at_transaction * rate,
                color: t.amount > 0 ? "green" : "red"
            }));

        if (chart) chart.destroy();
        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    { label: `${ticker} Price`, data: prices, borderColor: "#00FF00", fill: false },
                    { label: "High", data: highs, borderColor: "#FFFF00", borderDash: [5, 5], fill: false },
                    { label: "Low", data: lows, borderColor: "#FF0000", borderDash: [5, 5], fill: false },
                    { label: "20-day SMA", data: sma20, borderColor: "#FFA500", borderDash: [5, 5], fill: false },
                    {
                        label: "Transactions",
                        data: transactionPoints,
                        type: "scatter",
                        backgroundColor: transactionPoints.map(t => t.color),
                        pointRadius: 5
                    }
                ]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: "Date", color: "#FFFFFF" }, ticks: { color: "#FFFFFF" } },
                    y: { title: { display: true, text: `Price (${currency})`, color: "#FFFFFF" }, ticks: { color: "#FFFFFF" } }
                },
                plugins: { legend: { labels: { color: "#FFFFFF" } } },
                backgroundColor: "#0A1B4D"
            }
        });

        // Update labels
        const currentPrice = prices[prices.length - 1];
        document.getElementById("currentPrice").textContent = `${currency} $${currentPrice.toFixed(2)}`;
        const predictedPrice = currentPrice * 1.02; // Simple prediction (2% increase)
        document.getElementById("predictedPrice").textContent = `${currency} $${predictedPrice.toFixed(2)}`;
        document.getElementById("signal").textContent = predictedPrice > currentPrice ? "Buy" : "Sell";
        document.getElementById("signal").style.color = predictedPrice > currentPrice ? "#FF0000" : "#00FF00";
        document.getElementById("currency").textContent = currency;
    }

    document.getElementById("ticker").addEventListener("change", updateChart);
    document.getElementById("timeFrame").addEventListener("change", updateChart);
    document.getElementById("toggleCurrency").addEventListener("click", () => {
        currency = currency === "USD" ? "AUD" : "USD";
        document.getElementById("toggleCurrency").textContent = `Switch to ${currency === "USD" ? "AUD" : "USD"}`;
        updateChart();
    });

    updateChart();
}

// Add Data Page Logic
if (document.getElementById("transactionForm")) {
    const form = document.getElementById("transactionForm");
    const log = document.getElementById("log");

    // Load initial transactions into log
    transactions.forEach(t => {
        log.value += `${t.datetime.slice(8, 10)}/${t.datetime.slice(5, 7)}/${t.datetime.slice(0, 4)} ${t.datetime.slice(11, 16)}: ${t.ticker} - ${t.amount} @ USD $${t.price_at_transaction.toFixed(2)}\n`;
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const ticker = form.ticker.value;
        const date = form.date.value;
        const time = form.time.value;
        const amount = parseFloat(form.amount.value);

        try {
            const dt = new Date(`${date.split("/").reverse().join("-")} ${time}`);
            if (isNaN(dt.getTime())) throw new Error("Invalid date/time");

            // Static price lookup (NVDA only for simplicity)
            const price = ticker === "NVDA" && date === "14/03/2025" && time === "17:45" ? 121.67 : 100.00; // Fallback price
            const transaction = { datetime: dt.toISOString(), ticker, amount, price_at_transaction: price };
            transactions.push(transaction);

            log.value += `${date} ${time}: ${ticker} - ${amount} @ USD $${price.toFixed(2)}\nAdded: ${date} ${time} ${ticker} - ${amount} @ USD $${price.toFixed(2)}\n`;
            log.scrollTop = log.scrollHeight;
            form.reset();
        } catch (error) {
            log.value += `Error: ${error.message}! Use DD/MM/YYYY HH:MM (e.g., 14/03/2025 17:45)\n`;
            log.scrollTop = log.scrollHeight;
        }
    });
}