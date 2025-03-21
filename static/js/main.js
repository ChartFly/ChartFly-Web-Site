document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".header").style.setProperty("background-color", "#007a8a", "important");

    updateMarketStatus();
    fetchHaltedStocks();
    fetchMarketHolidays();
    setupWatchlistControls();
});

// ✅ Fetch Market Holidays
async function fetchMarketHolidays() {
    try {
        const response = await fetch("https://chartflybackend.onrender.com/api/holidays/year/2025");
        if (!response.ok) throw new Error("Failed to fetch");
        const holidays = await response.json();

        document.getElementById("market-holidays").innerHTML =
        `<span style="white-space: pre-wrap;">${holidays
            .map(h => `${new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${h.name}`)
            .join("    |    ")}</span>`;
    } catch (error) {
        console.error("Error fetching holidays:", error);
        document.getElementById("market-holidays").innerText = "Failed to load holidays.";
    }
}

// ✅ Fetch Halted Stocks
async function fetchHaltedStocks() {
    try {
        const response = await fetch("https://chartflybackend.onrender.com/api/haltdetails");
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            document.getElementById("halted-stocks").innerHTML = "<tr><td colspan='10'>No halted stocks available.</td></tr>";
            return;
        }

        let tableBody = document.getElementById("halted-stocks");
        tableBody.innerHTML = "";
        const fragment = document.createDocumentFragment();

        data.forEach(stock => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td style="font-size: 10px; text-align: center;">${stock.haltDate || ""}</td>
                <td style="font-size: 10px; text-align: center;">${stock.haltTime || ""}</td>
                <td style="font-size: 10px; text-align: center;">${stock.symbol || ""}</td>
                <td style="font-size: 10px; text-align: center;">${stock.issueName || ""}</td>
                <td style="font-size: 10px; text-align: center;">${stock.market || ""}</td>
                <td style="font-size: 10px; text-align: center;">${stock.reasonCode || ""}</td>
                <td style="font-size: 10px; text-align: center;">${stock.definition || ""}</td>
                <td style="font-size: 10px; text-align: center;">${stock.haltPrice || "N/A"}</td>
                <td style="font-size: 10px; text-align: center;">${stock.resDate || "N/A"}</td>
                <td style="font-size: 10px; text-align: center;">${stock.resTime || "N/A"}</td>`;
            fragment.appendChild(row);
        });

        tableBody.appendChild(fragment);
    } catch (error) {
        console.error("Error fetching halted stocks:", error);
        document.getElementById("halted-stocks").innerHTML = "<tr><td colspan='10'>Failed to load data.</td></tr>";
    }
}

// ✅ Market Status Logic
function updateMarketStatus() {
    const now = new Date();
    const hours = now.getHours();
    const dayOfWeek = now.getDay();
    let statusElement = document.getElementById("market-status-text");
    let status = "Market Closed";

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        status = "Market Closed (Weekend)";
    } else if (hours < 9.5) {
        status = "Pre-Market Trading";
        statusElement.className = "market-status-text market-prepost";
    } else if (hours < 16) {
        status = "Market Open";
        statusElement.className = "market-status-text market-open";
    } else {
        status = "After-Market Trading";
        statusElement.className = "market-status-text market-prepost";
    }
    statusElement.innerText = status;
}

// ✅ Header Watchdog
setInterval(() => {
    const header = document.querySelector(".header");
    if (!header) return;
    const computedStyle = window.getComputedStyle(header).backgroundColor;
    if (computedStyle !== "rgb(0, 122, 138)") {
        console.warn("🚨 Header background changed unexpectedly!", computedStyle);
    }
}, 1000);

// ✅ Watchlist Logic
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
updateWatchlistDisplay();

// ✅ Fetch Metrics Button
document.getElementById("fetchMetrics").addEventListener("click", function () {
    watchlist.forEach(ticker => fetchStockData(ticker));
});

// ✅ Setup Controls
function setupWatchlistControls() {
    const addBtn = document.getElementById("addToWatchlist");
    const clearBtn = document.getElementById("clearWatchlist");
    const input = document.getElementById("tickerInput");

    if (addBtn) addBtn.addEventListener("click", addTicker);
    if (clearBtn) clearBtn.addEventListener("click", clearWatchlist);
    if (input) {
        input.addEventListener("keypress", function (e) {
            if (e.key === "Enter") addTicker();
        });
    }

    document.querySelectorAll(".deleteTicker").forEach(btn => {
        btn.addEventListener("click", function () {
            const slot = parseInt(this.getAttribute("data-slot")) - 1;
            deleteTicker(slot);
        });
    });
}
function fetchStockData(symbol) {
    console.log("Fetching data for:", symbol);  // ✅ Confirm it's being triggered

    if (!symbol) return;

    // Stock Metrics Row
    const metricsBody = document.querySelector("#stock-metrics tbody");
    const metricsRow = document.createElement("tr");
    metricsRow.setAttribute("data-symbol", symbol);
    metricsRow.innerHTML = `<td>${symbol}</td>` + "<td></td>".repeat(13);
    metricsBody.appendChild(metricsRow);

    // News Row
    const newsBody = document.querySelector("#newsTable tbody");
    const newsRow = document.createElement("tr");
    newsRow.setAttribute("data-symbol", symbol);
    newsRow.innerHTML = `<td>${symbol}</td><td></td>`;
    newsBody.appendChild(newsRow);
}

// 🆕 Clear All Metrics and News
function clearMetricsAndNews() {
    document.querySelector("#stock-metrics tbody").innerHTML = "";
    document.querySelector("#newsTable tbody").innerHTML = "";
}

// 🆕 Remove Specific Metrics and News Row for a Symbol
function removeTickerData(symbol) {
    if (!symbol) return;

    const metricsRow = document.querySelector(`#stock-metrics tbody tr[data-symbol='${symbol}']`);
    const newsRow = document.querySelector(`#newsTable tbody tr[data-symbol='${symbol}']`);

    if (metricsRow) metricsRow.remove();
    if (newsRow) newsRow.remove();
}