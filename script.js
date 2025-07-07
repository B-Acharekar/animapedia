let currentPage = 1;
const PER_PAGE = 30;
let filteredResults = []; // hold results after filtering

const searchBtn = document.getElementById("searchBtn");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const resultsContainer = document.getElementById("results");
const pageInfo = document.getElementById("pageInfo");
const searchInput = document.getElementById("searchInput");

let debounceTimer;

// 🔍 Debounced search input
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage = 1;
    fetchAndRender();
  }, 500);
});

// 🔍 Debounced button
searchBtn.addEventListener("click", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage = 1;
    fetchAndRender();
  }, 300);
});

// ⬅️ Prev Page
prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderPaginatedResults();
  }
});

// ➡️ Next Page
nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredResults.length / PER_PAGE);
  if (currentPage < totalPages) {
    currentPage++;
    renderPaginatedResults();
  }
});

// 🚀 Main Fetch + Filter + Render Logic
async function fetchAndRender() {
  const query = searchInput.value.trim();
  const selectedClass = document.getElementById("filterClass").value;
  const showExtinct = document.getElementById("extinctToggle").checked;

  // UI loading
  resultsContainer.innerHTML = '<p class="col-span-full text-center text-gray-400">Loading...</p>';
  pageInfo.textContent = "";

  try {
    const combinedResults = [];

    // Fetch 3 pages = 90 results
    for (let p = 1; p <= 3; p++) {
      const res = await fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&page=${p}&per_page=30`);
      const data = await res.json();
      combinedResults.push(...data.results);
    }

    // Filter the combined results
    filteredResults = combinedResults;

    if (selectedClass) {
      filteredResults = filteredResults.filter(r => r.iconic_taxon_name === selectedClass);
    }
    if (showExtinct) {
      filteredResults = filteredResults.filter(r => r.extinct === true);
    }

    currentPage = 1;
    renderPaginatedResults();
  } catch (err) {
    console.error("Error fetching data:", err);
    resultsContainer.innerHTML = '<p class="col-span-full text-center text-red-500">Failed to load data.</p>';
  }
}

// 🧾 Render current page from filtered results
function renderPaginatedResults() {
  const totalPages = Math.ceil(filteredResults.length / PER_PAGE);
  const start = (currentPage - 1) * PER_PAGE;
  const end = currentPage * PER_PAGE;
  const currentResults = filteredResults.slice(start, end);

  updatePageInfo(currentPage, totalPages, filteredResults.length);
  togglePaginationButtons(currentPage, totalPages);
  renderResults(currentResults);
}

// 🧠 Show page count + total matches
function updatePageInfo(current, total, totalItems) {
  pageInfo.textContent = `Page ${current} of ${total} • Showing ${totalItems} matched results`;
}

// ⏮ Disable/enable navigation
function togglePaginationButtons(current, total) {
  prevPageBtn.disabled = current === 1;
  nextPageBtn.disabled = current >= total;

  [prevPageBtn, nextPageBtn].forEach((btn) => {
    btn.classList.toggle("opacity-50", btn.disabled);
    btn.classList.toggle("cursor-not-allowed", btn.disabled);
  });
}

// 🎨 Display result cards
function renderResults(results) {
  resultsContainer.innerHTML = "";

  if (results.length === 0) {
    resultsContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">No results found.</p>';
    return;
  }

  results.forEach((animal) => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col";

    const typeColors = {
      Mammalia: "bg-orange-200 text-orange-800",
      Aves: "bg-blue-200 text-blue-800",
      Reptilia: "bg-green-200 text-green-800",
      Amphibia: "bg-lime-200 text-lime-800",
      Insecta: "bg-yellow-200 text-yellow-800",
      Actinopterygii: "bg-cyan-200 text-cyan-800",
      Plantae: "bg-emerald-200 text-emerald-800",
      Fungi: "bg-pink-200 text-pink-800",
    };

    const typeTag = animal.iconic_taxon_name
      ? `<span class="px-2 py-1 rounded-full text-xs font-medium ${
          typeColors[animal.iconic_taxon_name] || "bg-gray-200"
        }">${animal.iconic_taxon_name}</span>`
      : "";

    const extinctBadge = animal.extinct
      ? `<span class="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">🦖 Extinct</span>`
      : "";

    const imageHTML = animal.default_photo
      ? `<img src="${animal.default_photo.medium_url}" alt="${animal.name}" class="rounded mb-3 object-cover h-40 w-full">`
      : '<div class="h-40 bg-gray-200 rounded mb-3 flex items-center justify-center text-sm text-gray-500">No Image</div>';

    card.innerHTML = `
      <h2 class="text-lg font-bold text-teal-700 flex items-center">
        ${animal.preferred_common_name || "Unknown"} ${extinctBadge}
      </h2>
      <p class="italic text-sm text-gray-500 mb-2">${animal.name}</p>
      ${imageHTML}
      <div class="flex gap-2 mb-2">${typeTag}</div>
      <div class="text-sm text-gray-600">
        <p><strong>Rank:</strong> ${animal.rank}</p>
        <p><strong>Status:</strong> ${animal.conservation_status?.status || "Unknown"}</p>
        <p><a href="${animal.wikipedia_url || "#"}" target="_blank" class="text-teal-600 underline">Wikipedia</a></p>
      </div>
    `;

    resultsContainer.appendChild(card);
  });
}
