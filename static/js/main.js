document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelector(".header")
    .style.setProperty("background-color", "006373", "important");

  updateMarketStatus();
  fetchHaltedStocks();
  fetchMarketHolidays();
  setupWatchlistControls();
});

// ✅ Fetch Market Holidays
async function fetchMarketHolidays() {
  try {
    const response = await fetch(
      "https://chartflybackend.onrender.com/api/holidays/year/2025"
    );
    if (!response.ok) throw new Error("Failed to fetch");
    const holidays = await response.json();

    document.getElementById(
      "market-holidays"
    ).innerHTML = `<span style="white-space: pre-wrap;">${holidays
      .map((h) => {
        const date = new Date(h.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const time = h.close_time
          ? ` (Closes at ${formatTime(h.close_time)})`
          : "";
        return `${date}, ${h.name}${time}`;
      })

      .join("    |    ")}</span>`;
  } catch (error) {
    console.error("Error fetching holidays:", error);
    document.getElementById("market-holidays").innerText =
      "Failed to load holidays.";
  }
}

// ✅ Fetch Halted Stocks
async function fetchHaltedStocks() {
  try {
    const response = await fetch(
      "https://chartflybackend.onrender.com/api/haltdetails"
    );
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById("halted-stocks").innerHTML =
        "<tr><td colspan='10'>No halted stocks available.</td></tr>";
      return;
    }

    let tableBody = document.getElementById("halted-stocks");
    tableBody.innerHTML = "";
    const fragment = document.createDocumentFragment();

    data.forEach((stock) => {
      let row = document.createElement("tr");
      row.innerHTML = `
                <td style="font-size: 10px; text-align: center;">${
                  stock.haltDate || ""
                }</td>
                <td style="font-size: 10px; text-align: center;">${
                  stock.haltTime || ""
                }</td>
                <td style="font-size: 10px; text-align: center;">${
                  stock.symbol || ""
                }</td>
                <td style="font-size: 10px; text-align: center;">${
                  stock.issueName || ""
                }</td>
                <td style="font-size: 10px; text-align: center;">${
                  stock.market || ""
                }</td>
                <td style="font-size: 10px; text-align: center;">${
                  stock.reasonCode || ""
                }</td>
                <td style="font-size: 10px; text-align: center;">${
                  stock.definition || ""
                }</td>
                <td style="font-size: 10px; text-align: center;">${
                  stock.haltPrice || "N/A"
                }</td>
                <td style="font-size: 10px; text-align: center;">${
                  stock.resDate || "N/A"
                }</td>
                <td style="font-size: 10px; text-align: center;">${
                  stock.resTime || "N/A"
                }</td>`;
      fragment.appendChild(row);
    });

    tableBody.appendChild(fragment);
  } catch (error) {
    console.error("Error fetching halted stocks:", error);
    document.getElementById("halted-stocks").innerHTML =
      "<tr><td colspan='10'>Failed to load data.</td></tr>";
  }
}

// ✅ Market Status Logic
function updateMarketStatus() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalTime = hours + minutes / 60;
  const dayOfWeek = now.getDay();
  let statusElement = document.getElementById("market-status-text");
  let status = "Market Closed";

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    status = "Market Closed (Weekend)";
    statusElement.className = "market-status-text market-closed";
  } else if (totalTime < 9.5) {
    status = "Pre-Market Trading";
    statusElement.className = "market-status-text market-prepost";
  } else if (totalTime < 16) {
    status = "Market Open";
    statusElement.className = "market-status-text market-open";
  } else {
    status = "After-Market Trading";
    statusElement.className = "market-status-text market-prepost";
  }

  statusElement.innerText = status;
}

// ✅ Header Watchdog (style consistency checker)
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
  watchlist.forEach((ticker) => fetchStockData(ticker));
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

  document.querySelectorAll(".deleteTicker").forEach((btn) => {
    btn.addEventListener("click", function () {
      const slot = parseInt(this.getAttribute("data-slot")) - 1;
      deleteTicker(slot);
    });
  });
}

// ✅ Add Ticker to Watchlist
function addTicker() {
  const input = document.getElementById("tickerInput");
  const symbol = input.value.trim().toUpperCase();
  if (!symbol || watchlist.includes(symbol) || watchlist.length >= 10) {
    input.value = "";
    return;
  }
  watchlist.push(symbol);
  input.value = "";
  updateWatchlistDisplay();
}

// ✅ Update Watchlist Display
function updateWatchlistDisplay() {
  for (let i = 0; i < 10; i++) {
    const slot = document.getElementById(`slot${i + 1}`);
    if (slot) slot.textContent = watchlist[i] || "";
  }
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
}

// ✅ Delete Individual Ticker
function deleteTicker(index) {
  if (index >= 0 && index < watchlist.length) {
    const removed = watchlist.splice(index, 1)[0];
    updateWatchlistDisplay();
    removeTickerData(removed);
  }
}

// ✅ Clear Entire Watchlist and Tables
function clearWatchlist() {
  watchlist = [];
  updateWatchlistDisplay();
  clearMetricsAndNews();
}

// ✅ Append Stock Data (Symbol only for now)
function fetchStockData(symbol) {
  console.log("Fetching data for:", symbol);
  if (!symbol) return;

  // Stock Metrics Table
  const metricsBody = document.querySelector("#stock-metrics tbody");
  const metricsRow = document.createElement("tr");
  metricsRow.setAttribute("data-symbol", symbol);
  metricsRow.innerHTML = `<td>${symbol}</td>` + "<td></td>".repeat(13);
  metricsBody.appendChild(metricsRow);

  // News Table
  const newsBody = document.querySelector("#newsTable tbody");
  const newsRow = document.createElement("tr");
  newsRow.setAttribute("data-symbol", symbol);
  newsRow.innerHTML = `<td>${symbol}</td><td></td>`;
  newsBody.appendChild(newsRow);
}

// ✅ Clear All Rows in Stock Metrics and News
function clearMetricsAndNews() {
  document.querySelector("#stock-metrics tbody").innerHTML = "";
  document.querySelector("#newsTable tbody").innerHTML = "";
}

// ✅ Remove One Ticker's Rows
function removeTickerData(symbol) {
  if (!symbol) return;
  const metricsRow = document.querySelector(
    `#stock-metrics tbody tr[data-symbol='${symbol}']`
  );
  const newsRow = document.querySelector(
    `#newsTable tbody tr[data-symbol='${symbol}']`
  );
  if (metricsRow) metricsRow.remove();
  if (newsRow) newsRow.remove();
}

function formatTime(rawTime) {
  const [hour, minute] = rawTime.split(":");
  const h = parseInt(hour, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${minute} ${suffix}`;
}
