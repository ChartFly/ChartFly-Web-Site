document.addEventListener("DOMContentLoaded", function () {
    // 🔹 Force correct header background color in case JavaScript is overriding it
    document.querySelector(".header").style.setProperty("background-color", "#007a8a", "important");

    updateMarketStatus();
    fetchHaltedStocks();
    fetchMarketHolidays();
    setupWatchlistControls();
});

/* ✅ Fetch Market Holidays from Backend */
async function fetchMarketHolidays() {
    try {
        const response = await fetch("https://chartflybackend.onrender.com/api/holidays/year/2025");
        if (!response.ok) throw new Error("Failed to fetch");
        const holidays = await response.json();

        const holidayText = holidays.map(h =>
            `${new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${h.name}`
        ).join(" | ");

        document.getElementById("market-holidays").innerHTML =
        `<span style="white-space: pre-wrap;">${holidays
         . map(h => `${new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${h.name}`)
         .join("    |    ")}</span>`;

    } catch (error) {
        console.error("Error fetching holidays:", error);
        document.getElementById("market-holidays").innerText = "Failed to load holidays.";
    }
}

/* ✅ Fetch Halted Stocks from Backend */
async function fetchHaltedStocks() {
    try {
        const response = await fetch("https://chartflybackend.onrender.com/api/haltdetails");
        const data = await response.json();
        console.log("Fetched Halted Stocks Data:", data); // Debugging

        // ✅ Handle case where backend returns an empty list
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
                <td style="font-size: 10px; text-align: center;">${stock.resTime || "N/A"}</td>
            `;
            fragment.appendChild(row);
        });
        tableBody.appendChild(fragment);
    } catch (error) {
        console.error("Error fetching halted stocks:", error);
        document.getElementById("halted-stocks").innerHTML = "<tr><td colspan='10'>Failed to load data.</td></tr>";
    }
}

/* ✅ Watchlist Controls */
function setupWatchlistControls() {
    console.log("Watchlist controls initialized.");
}

/* ✅ Prevent Errors if Watchlist is Empty */
let watchlist = [];

/* ✅ Fix Fetch Watchlist Data Button */
document.getElementById("fetchMetrics").addEventListener("click", function () {
    watchlist.forEach(ticker => fetchStockData(ticker));
});

/* ✅ Fix Market Status Update */
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

/* ✅ Debugging: Detect Unwanted JavaScript Overrides */
setInterval(() => {
    const header = document.querySelector(".header");
    if (!header) return;

    const computedStyle = window.getComputedStyle(header).backgroundColor;
    console.log("Header Background Computed:", computedStyle);

    if (computedStyle !== "rgb(0, 122, 138)") {
        console.warn("🚨 Warning: Header background changed unexpectedly!");
    }
}, 1000);