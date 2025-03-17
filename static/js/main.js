// ✅ Update Market Status
function updateMarketStatus() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentDate = now.toISOString().split("T")[0];
    const marketStatusElement = document.getElementById("market-status-text");

    // List of official market holidays
    const marketHolidays = ["2025-01-01", "2025-02-19", "2025-03-29", "2025-05-27", "2025-07-04", "2025-09-02", "2025-11-28", "2025-12-25"];

    // Determine if today is a holiday
    const isHoliday = marketHolidays.includes(currentDate);

    // Determine if today is a weekend (Saturday or Sunday)
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    // Determine market status
    let marketStatus = isHoliday ? "Market Closed (Holiday)" :
        isWeekend ? "Market Closed (Weekend)" :
        hours < 4 ? "Market Closed" :
        hours < 9.5 ? "Pre-Market Trading" :
        hours < 16 ? "Market Open" :
        hours < 20 ? "After-Market Trading" :
        "Market Closed";

    // Apply correct class for color styling
    marketStatusElement.textContent = marketStatus;
    marketStatusElement.className = `market-status-text ${isHoliday || marketStatus.includes("Closed") ? "market-closed" : marketStatus.includes("Open") ? "market-open" : "market-prepost"}`;
}

// ✅ Fetch holidays from backend
async function fetchHolidays(year) {
    try {
        const response = await fetch(`https://chartflybackend.onrender.com/api/holidays/year/${year}`);
        if (!response.ok) throw new Error("Failed to load holidays.");

        const holidays = await response.json();
        let holidaysDisplay = holidays.map(h => `${new Date(h.holiday_date).toLocaleDateString("en-US")} - ${h.holiday_name}`).join(" | ");

        document.querySelector(".holiday-text").innerHTML = holidaysDisplay || "No holidays available.";
    } catch (error) {
        console.error("Error fetching holidays:", error);
        document.querySelector(".holiday-text").innerHTML = "Failed to load holidays.";
    }
}

// ✅ Fetch halted stocks from backend
async function fetchHaltedStocks() {
    try {
        const response = await fetch("https://chartflybackend.onrender.com/api/haltdetails");
        if (!response.ok) throw new Error("Failed to fetch halted stocks.");

        const haltedStocks = await response.json();
        let tableBody = document.getElementById("halted-stocks");
        tableBody.innerHTML = "";

        if (!haltedStocks || haltedStocks.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='10'>No halted stocks found.</td></tr>";
            return;
        }

        haltedStocks.forEach(stock => {
            let reasonDefinition = haltReasons[stock.reasonCode] || "Definition not available";
            let row = `<tr>
                <td>${stock.haltDate || ""}</td>
                <td>${stock.haltTime || ""}</td>
                <td>${stock.symbol || ""}</td>
                <td>${stock.issueName || ""}</td>
                <td>${stock.market || ""}</td>
                <td>${stock.reasonCode || ""}</td>
                <td>${reasonDefinition}</td>
                <td>${stock.haltPrice || "N/A"}</td>
                <td>${stock.resDate || "N/A"}</td>
                <td>${stock.resTime || "N/A"}</td>
            </tr>`;
            tableBody.innerHTML += row;
        });

    } catch (error) {
        console.error("Error fetching halted stocks:", error);
        document.getElementById("halted-stocks").innerHTML = "<tr><td colspan='10'>Failed to load data.</td></tr>";
    }
}

// ✅ Run functions on page load
document.addEventListener("DOMContentLoaded", function () {
    updateMarketStatus();
    fetchHolidays(2025);
    fetchHaltedStocks();
});

// ✅ Reason code definitions
const haltReasons = {
    "T1": "News Pending",
    "T2": "News Released",
    "H10": "Volatility Trading Pause",
    "H4": "Non-compliance",
    "H9": "SEC Suspension",
    "D": "Other"
};

// ✅ Stock Watchlist Logic
const watchlist = [];
const maxTickers = 10;

function addTicker() {
    const tickerInput = document.getElementById("tickerInput");
    const ticker = tickerInput.value.trim().toUpperCase();
    if (ticker && !watchlist.includes(ticker) && watchlist.length < maxTickers) {
        watchlist.push(ticker);
        updateWatchlistDisplay();
        tickerInput.value = "";
    }
    if (watchlist.length >= maxTickers) {
        document.getElementById("addToWatchlist").innerText = "Watchlist Full";
        document.getElementById("addToWatchlist").disabled = true;
    }
}

function updateWatchlistDisplay() {
    for (let i = 0; i < maxTickers; i++) {
        document.getElementById(`slot${i + 1}`).innerText = watchlist[i] || "";
    }
}

function clearWatchlist() {
    watchlist.length = 0;
    updateWatchlistDisplay();
}

document.getElementById("addToWatchlist").addEventListener("click", addTicker);
document.getElementById("clearWatchlist").addEventListener("click", clearWatchlist);

// ✅ Fetch Metrics from Finnhub API
async function fetchStockMetrics(ticker) {
    const FINNHUB_API_KEY = "your_finnhub_api_key";
    const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch stock data.");

        const data = await response.json();
        updateStockMetrics(ticker, data);
    } catch (error) {
        console.error("Error fetching stock metrics:", error);
    }
}

function updateStockMetrics(ticker, data) {
    const tableBody = document.querySelector("#stock-metrics tbody");
    let row = `<tr>
        <td>${ticker}</td>
        <td>${data.c || "N/A"}</td>
        <td>${data.o || "N/A"}</td>
        <td>${data.h || "N/A"}</td>
        <td>${data.l || "N/A"}</td>
        <td>${data.pc || "N/A"}</td>
    </tr>`;
    tableBody.innerHTML += row;
}

document.getElementById("fetchMetrics").addEventListener("click", function () {
    watchlist.forEach(ticker => fetchStockMetrics(ticker));
});