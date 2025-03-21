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

/* ✅ Full Watchlist System Logic */

// Initialize watchlist if not already declared
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
updateWatchlistDisplay();

/* ✅ Fix Fetch Watchlist Data Button */
document.getElementById("fetchMetrics").addEventListener("click", function () {
    watchlist.forEach(ticker => fetchStockData(ticker));
});

// Attach button and keypress events
function setupWatchlistControls() {
    console.log("Watchlist controls initialized.");

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

    // Bind delete buttons
    document.querySelectorAll(".deleteTicker").forEach(btn => {
        btn.addEventListener("click", function () {
            const slot = parseInt(this.getAttribute("data-slot")) - 1;
            deleteTicker(slot);
        });
    });
}

// Add ticker from input
function addTicker() {
    const input = document.getElementById("tickerInput");
    if (!input) return;

    const symbol = input.value.trim().toUpperCase();
    if (!symbol || watchlist.includes(symbol) || watchlist.length >= 10) {
        input.value = "";
        return;
    }

    watchlist.push(symbol);
    input.value = "";
    updateWatchlistDisplay();
}

// Update slots (slot1–slot10)
function updateWatchlistDisplay() {
    for (let i = 0; i < 10; i++) {
        const slot = document.getElementById(`slot${i + 1}`);
        if (slot) slot.textContent = watchlist[i] || "";
    }
    localStorage.setItem("watchlist", JSON.stringify(watchlist)); // ✅ Only once
}

// Delete one ticker
function deleteTicker(index) {
    if (index >= 0 && index < watchlist.length) {
        watchlist.splice(index, 1);
        updateWatchlistDisplay();
    }
}

// Clear all
function clearWatchlist() {
    watchlist = [];
    updateWatchlistDisplay();
}