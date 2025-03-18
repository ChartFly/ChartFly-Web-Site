document.addEventListener("DOMContentLoaded", function () {
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
        document.getElementById("market-holidays").innerText =
            holidays.map(h => `${h.date}: ${h.name}`).join(" | ");
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
        let tableBody = document.getElementById("halted-stocks");
        tableBody.innerHTML = "";

        data.forEach(stock => {
            let row = `<tr>
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
            </tr>`;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error fetching halted stocks:", error);
        document.getElementById("halted-stocks").innerHTML = "<tr><td colspan='10'>Failed to load data.</td></tr>";
    }
}

/* ✅ Fix Fetch Watchlist Data Button */
document.getElementById("fetchMetrics").addEventListener("click", function () {
    watchlist.forEach(ticker => fetchStockData(ticker));
});

/* ✅ Fix Delete Button Styles */
document.querySelectorAll(".deleteTicker").forEach(button => {
    button.style.backgroundColor = "white";
    button.style.color = "black";
    button.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.2)";
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