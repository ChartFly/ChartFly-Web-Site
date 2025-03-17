document.addEventListener("DOMContentLoaded", function () {
    updateMarketStatus();
    fetchHolidays(2025);
});

// ✅ Function to update market status
function updateMarketStatus() {
    const now = new Date();
    const marketStatusElement = document.getElementById("market-status-text");

    let marketStatus = "Market Closed"; // Default
    if (now.getHours() >= 9.5 && now.getHours() < 16) {
        marketStatus = "Market Open";
    } else if (now.getHours() >= 4 && now.getHours() < 9.5) {
        marketStatus = "Pre-Market Trading";
    } else if (now.getHours() >= 16 && now.getHours() < 20) {
        marketStatus = "After-Market Trading";
    }

    marketStatusElement.textContent = marketStatus;
    marketStatusElement.className = `market-status-text ${marketStatus.replace(/\s/g, "-").toLowerCase()}`;
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

// ✅ Run function on page load
document.addEventListener("DOMContentLoaded", function () {
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

document.addEventListener("DOMContentLoaded", function () {
    updateMarketStatus();
    fetchHolidays(2025);
    fetchHaltedStocks();
});

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

// ✅ Fetch Halted Stocks from Backend
async function fetchHaltedStocks() {
    try {
        const response = await fetch(`https://chartflybackend.onrender.com/api/haltdetails`);
        if (!response.ok) throw new Error("Network response was not ok");

        const haltedStocks = await response.json();
        let tableBody = document.getElementById("halted-stocks");
        tableBody.innerHTML = "";

        if (!haltedStocks || haltedStocks.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='10'>No halted stocks found.</td></tr>";
            return;
        }

        haltedStocks.forEach(stock => {
            let row = `<tr>
                <td>${stock.haltDate || ""}</td>
                <td>${stock.haltTime || ""}</td>
                <td>${stock.symbol || ""}</td>
                <td>${stock.issueName || ""}</td>
                <td>${stock.market || ""}</td>
                <td>${stock.reasonCode || ""}</td>
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