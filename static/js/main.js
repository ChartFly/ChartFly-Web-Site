document.addEventListener("DOMContentLoaded", function () {
    // Market Status Colors
    function updateMarketStatus() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentDate = now.toISOString().split("T")[0];
        const marketStatusElement = document.getElementById("market-status-text");

        fetch("/api/market-status")
            .then(response => response.json())
            .then(data => {
                let marketStatus = data.status;
                marketStatusElement.textContent = marketStatus;
                marketStatusElement.className = `market-status-text ${marketStatus.replace(/\s/g, "-").toLowerCase()}`;
            })
            .catch(() => {
                let fallbackStatus = hours < 9.5 ? "Pre-Market Trading" :
                    hours < 16 ? "Market Open" :
                        hours < 20 ? "After-Market Trading" : "Market Closed";

                marketStatusElement.textContent = fallbackStatus;
                marketStatusElement.className = `market-status-text ${fallbackStatus.replace(/\s/g, "-").toLowerCase()}`;
            });
    }

    updateMarketStatus();

    // Fetch Market Holidays from Backend
    fetch("/api/holidays/2025")
        .then(response => response.json())
        .then(data => {
            const holidayText = data.map(holiday => `${holiday.date} - ${holiday.name}`).join(" | ");
            document.getElementById("market-holidays").textContent = holidayText;
        })
        .catch(() => {
            document.getElementById("market-holidays").textContent = "Failed to load holidays";
        });

    // Watchlist Functionality
    const watchlist = [];
    const maxTickers = 10;

    function addTicker() {
        const tickerInput = document.getElementById("tickerInput");
        const ticker = tickerInput.value.trim().toUpperCase();

        if (ticker && !watchlist.includes(ticker) && watchlist.length < maxTickers) {
            watchlist.push(ticker);
            updateWatchlistDisplay();
            fetchStockData(ticker);
            tickerInput.value = "";
        }
    }

    function updateWatchlistDisplay() {
        for (let i = 0; i < maxTickers; i++) {
            document.getElementById(`slot${i + 1}`).textContent = watchlist[i] || "";
        }
    }

    function deleteTicker(slot) {
        if (slot < watchlist.length) {
            const ticker = watchlist.splice(slot, 1)[0];
            updateWatchlistDisplay();
            removeTickerData(ticker);
        }
    }

    function clearWatchlist() {
        watchlist.length = 0;
        updateWatchlistDisplay();
        document.querySelector("#stock-metrics tbody").innerHTML = "";
        document.querySelector("#newsTable tbody").innerHTML = "";
    }

    function removeTickerData(ticker) {
        document.querySelectorAll("#stock-metrics tbody tr").forEach(row => {
            if (row.cells[0].textContent.trim().toUpperCase() === ticker) {
                row.remove();
            }
        });

        document.querySelectorAll("#newsTable tbody tr").forEach(row => {
            if (row.cells[0].textContent.trim().toUpperCase() === ticker) {
                row.remove();
            }
        });
    }

    document.getElementById("addToWatchlist").addEventListener("click", addTicker);
    document.getElementById("clearWatchlist").addEventListener("click", clearWatchlist);
    document.getElementById("tickerInput").addEventListener("keypress", function (event) {
        if (event.key === "Enter") addTicker();
    });

    document.querySelectorAll(".deleteTicker").forEach((button, index) => {
        button.addEventListener("click", () => deleteTicker(index));
    });

    // Fetch Stock Data
    function fetchStockData(ticker) {
        const STOCK_API_URL = `https://your-stock-api.com/quote?symbol=${ticker}`;
        const NEWS_API_URL = `https://your-stock-api.com/news?symbol=${ticker}`;

        Promise.all([fetch(STOCK_API_URL), fetch(NEWS_API_URL)])
            .then(responses => Promise.all(responses.map(res => res.json())))
            .then(([quoteData, newsData]) => {
                updateMetrics(ticker, quoteData);
                updateNewsTable(ticker, newsData);
            })
            .catch(error => console.error("Error fetching stock data:", error));
    }

    function updateMetrics(ticker, quote) {
        const row = `<tr>
            <td>${ticker}</td>
            <td>${quote?.c ? `$${quote.c.toFixed(2)}` : "N/A"}</td>
            <td>${quote?.o ? `$${quote.o.toFixed(2)}` : "N/A"}</td>
            <td>${quote?.h ? `$${quote.h.toFixed(2)}` : "N/A"}</td>
            <td>${quote?.l ? `$${quote.l.toFixed(2)}` : "N/A"}</td>
            <td>${quote?.pc ? `$${quote.pc.toFixed(2)}` : "N/A"}</td>
            <td>${quote?.marketCap ? `$${quote.marketCap.toFixed(2)}B` : "N/A"}</td>
            <td>${quote?.sharesOut ? `${quote.sharesOut.toFixed(2)}M` : "N/A"}</td>
            <td>${quote?.peRatio ? quote.peRatio.toFixed(2) : "N/A"}</td>
            <td>${quote?.eps ? `$${quote.eps.toFixed(2)}` : "N/A"}</td>
            <td>${quote?.["52WeekHigh"] ? `$${quote["52WeekHigh"].toFixed(2)}` : "N/A"}</td>
            <td>${quote?.["52WeekLow"] ? `$${quote["52WeekLow"].toFixed(2)}` : "N/A"}</td>
        </tr>`;

        document.querySelector("#stock-metrics tbody").innerHTML += row;
    }

    function updateNewsTable(ticker, news) {
        const tableBody = document.querySelector("#newsTable tbody");
        const newsHeadlines = news.slice(0, 4).map(item => `<li>${item.headline}</li>`).join(" ");
        const row = `<tr>
            <td>${ticker}</td>
            <td><ul>${newsHeadlines || "No recent news"}</ul></td>
        </tr>`;

        tableBody.innerHTML += row;
    }
});