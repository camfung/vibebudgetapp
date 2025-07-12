// Budgeting Page Logic

// --- Storage Abstraction (matches app.js style) ---
const storageService = {
  getTransactions: () => JSON.parse(localStorage.getItem('transactions')) || [],
  getCategories: function() {
    const txs = this.getTransactions();
    return Array.from(new Set(txs.map(t => t.category).filter(Boolean)));
  }
};

// --- DOM Elements ---
const DOM = {
  startDate: document.getElementById('budget-start-date'),
  endDate: document.getElementById('budget-end-date'),
  categorySelect: document.getElementById('budget-category-select'),
  newCategoryInput: document.getElementById('budget-new-category'),
  summary: document.getElementById('budget-summary'),
  groupedList: document.getElementById('budget-grouped-list'),
};

// --- Utility Functions ---
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function filterTransactions({ start, end, category }) {
  let txs = storageService.getTransactions();
  if (start) {
    const startDate = new Date(start);
    txs = txs.filter(t => new Date(t.date) >= startDate);
  }
  if (end) {
    const endDate = new Date(end);
    txs = txs.filter(t => new Date(t.date) <= endDate);
  }
  if (category) {
    txs = txs.filter(t => t.category === category);
  }
  return txs;
}

function groupByCategory(txs) {
  return txs.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});
}

function renderCategoryDropdown() {
  const categories = storageService.getCategories();
  DOM.categorySelect.innerHTML = '<option value="">All Categories</option>' +
    categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function renderSummary(txs) {
  const total = txs.reduce((sum, t) => sum + t.amount, 0);
  const byCategory = groupByCategory(txs);
  let html = `<div class="mb-2">Total spent: <span class="font-bold text-rose-400">-${formatCurrency(total)}</span></div>`;
  html += '<ul class="space-y-1">';
  for (const cat in byCategory) {
    const sum = byCategory[cat].reduce((s, t) => s + t.amount, 0);
    html += `<li>${cat}: <span class="font-semibold text-rose-300">-${formatCurrency(sum)}</span></li>`;
  }
  html += '</ul>';
  DOM.summary.innerHTML = html;
}

function renderGroupedList(txs) {
  const byCategory = groupByCategory(txs);
  let html = '';
  for (const cat in byCategory) {
    html += `<div class="mb-6"><h3 class="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-3">${cat}</h3><ul class="space-y-2">`;
    byCategory[cat].forEach(t => {
      html += `<li class="flex justify-between items-center bg-slate-900/50 p-3 rounded-md">
        <div>
          <span class="text-slate-200 block">${t.title}</span>
          <span class="font-medium text-rose-400 text-sm">${formatCurrency(t.amount)}</span>
        </div>
        <span class="text-xs text-slate-400">${new Date(t.date).toLocaleDateString()}</span>
      </li>`;
    });
    html += '</ul></div>';
  }
  DOM.groupedList.innerHTML = html || '<p class="text-slate-400 text-center">No transactions found.</p>';
}

function updateView() {
  const start = DOM.startDate.value;
  const end = DOM.endDate.value;
  const category = DOM.categorySelect.value;
  const txs = filterTransactions({ start, end, category });
  renderSummary(txs);
  renderGroupedList(txs);
}

// --- Event Listeners ---
DOM.startDate.addEventListener('change', updateView);
DOM.endDate.addEventListener('change', updateView);
DOM.categorySelect.addEventListener('change', updateView);

DOM.newCategoryInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const newCat = DOM.newCategoryInput.value.trim();
    if (newCat && !storageService.getCategories().includes(newCat)) {
      // Add a dummy transaction to save the category (or you could persist categories separately)
      // Here, just add to dropdown for now
      const opt = document.createElement('option');
      opt.value = newCat;
      opt.textContent = newCat;
      DOM.categorySelect.appendChild(opt);
      DOM.categorySelect.value = newCat;
      DOM.newCategoryInput.value = '';
      updateView();
    }
  }
});

// --- Date Pickers ---
flatpickr(DOM.startDate, { dateFormat: 'Y-m-d', onChange: updateView });
flatpickr(DOM.endDate, { dateFormat: 'Y-m-d', onChange: updateView });

// --- Initial Render ---
renderCategoryDropdown();
updateView(); 