// Sample stock data (NVDA only for simplicity)
const stockData = {
    "NVDA": {
        "1 Hour": {
            labels: ["2025-03-14 16:45", "2025-03-14 16:46", "2025-03-14 16:47"],
            prices: [121.50, 121.67, 121.60]
        },
        "1 Day": {
            labels: ["2025-03-14 09:00", "2025-03-14 12:00", "2025-03-14 15:00"],
            prices: [121.00, 121.50, 121.67]
        },
        "1 Month": {
            labels: ["2025-02-14", "2025-02-21", "2025-02-28", "2025-03-07", "2025-03-14"],
            prices: [138.48, 135.00, 130.00, 125.00, 121.67]
        },
        "1 Year": {
            labels: ["2024-03-14", "2024-06-14", "2024-09-14", "2024-12-14", "2025-03-14"],
            prices: [150.00, 145.00, 140.00, 130.00, 121.67]
        },
        "5 Years": {
            labels: ["2020-03-14", "2021-03-14", "2022-03-14", "2023-03-14", "2024-03-14", "2025-03-14"],
            prices: [50.00, 75.00, 100.00, 120.00, 150.00, 121.67]
        }
    }
};

// Hardcoded transactions
let transactions = [
    { datetime: "2025-03-14 17:45:00", ticker: "NVDA", amount: 10, price_at_transaction: 121.67 }
];

// Exchange rate
const usdToAudRate = 1.59;

// Chart instance
let chart;

// Graph Page Logic
if (document.getElementById("stockChart")) {
    const ctx = document.getElementById("stockChart");
    if (!ctx) {
        console.error("Canvas element 'stockChart' not found!");
        return;
    }
    const canvasContext = ctx.getContext("2d");
    let currency = "USD";

    function updateChart() {
        const ticker = document.getElementById("ticker").value;
        const timeFrame = document.getElementById("timeFrame").value;
        const rate = currency === "AUD" ? usdToAudRate : 1.0;

        // Default to NVDA data if ticker not found
        const data = stockData[ticker] && stockData[ticker][timeFrame] ? stockData[ticker][timeFrame] : stockData["NVDA"]["1 Month"];
        const labels = data.labels;
        const prices = data.prices.map(p => p * rate);

        if (chart) chart.destroy();
        chart = new Chart(canvasContext, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: `${ticker} Price`,
                    data: prices,
                    borderColor: "#00FF00",
                    fill: false
                }]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: "Date", color: "#FFFFFF" }, ticks: { color: "#FFFFFF" } },
                    y: { title: { display: true, text: `Price (${currency})`, color: "#FFFFFF" }, ticks: { color: "#FFFFFF" } }
                },
                plugins: { legend: { labels: { color: "#FFFFFF" } } }
            }
        });

        // Update labels
        const currentPrice = prices[prices.length - 1];
        document.getElementById("currentPrice").textContent = `${currency} $${currentPrice.toFixed(2)}`;
        const predictedPrice = currentPrice * 1.02; // Simple prediction
        document.getElementById("predictedPrice").textContent = `${currency} $${predictedPrice.toFixed(2)}`;
        document.getElementById("signal").textContent = predictedPrice > currentPrice ? "Buy" : "Sell";
        document.getElementById("signal").style.color = predictedPrice > currentPrice ? "#FF0000" : "#00FF00";
        document.getElementById("currency").textContent = currency;

        console.log(`Chart updated: Ticker=${ticker}, TimeFrame=${timeFrame}, Currency=${currency}`);
    }

    document.getElementById("ticker").addEventListener("change", updateChart);
    document.getElementById("timeFrame").addEventListener("change", updateChart);
    document.getElementById("toggleCurrency").addEventListener("click", () => {
        currency = currency === "USD" ? "AUD" : "USD";
        document.getElementById("toggleCurrency").textContent = `Switch to ${currency === "USD" ? "AUD" : "USD"}`;
        updateChart();
    });

    try {
        updateChart();
    } catch (error) {
        console.error("Error initializing chart:", error);
    }
}

// Add Data Page Logic
if (document.getElementById("transactionForm")) {
    const form = document.getElementById("transactionForm");
    const log = document.getElementById("log");

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
            const price = ticker === "NVDA" && date === "14/03/2025" && time === "17:45" ? 121.67 : 100.00;
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
