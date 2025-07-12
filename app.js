// Modularized HTML generators for repeated sections
function statCard({ id, borderClass, title, valueId, badge, extraHtml = '' }) {
  return `
    <div id="${id}" class="stat-card bg-slate-900/70 p-6 rounded-xl border ${borderClass} shadow-lg flex flex-col">
      <div class="flex-grow">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-semibold text-slate-200">${title}</h2>
          ${badge ? `<span class="relative text-xs font-semibold text-green-300 bg-green-500/20 px-3 py-1 rounded-full live-badge">Live</span>` : ''}
        </div>
        <p id="${valueId}" class="text-4xl font-bold text-white mb-4">$0.00</p>
      </div>
      ${extraHtml}
    </div>
  `;
}

function modal({ id, title, content, footer = '', size = 'max-w-md', closeBtnId }) {
  return `
    <div id="${id}" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 hidden">
      <div class="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full ${size}">
        <div class="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 class="text-lg font-semibold">${title}</h2>
          <button id="${closeBtnId}" class="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div class="p-6">${content}</div>
        ${footer}
      </div>
    </div>
  `;
}

// Add widget configuration modal
function widgetConfigModal({ selectedWidgets, allWidgets }) {
  return modal({
    id: 'widget-config-modal',
    title: 'Configure Dashboard Widgets',
    closeBtnId: 'close-widget-config-modal-btn',
    content: `
      <form id="widget-config-form" class="space-y-4">
        ${allWidgets.map(w => `
          <div class="flex items-center">
            <input type="checkbox" id="widget-checkbox-${w.id}" name="widgets" value="${w.id}" ${selectedWidgets.includes(w.id) ? 'checked' : ''} class="mr-2">
            <label for="widget-checkbox-${w.id}" class="text-slate-300">${w.label}</label>
          </div>
        `).join('')}
      </form>
    `,
    footer: `<div class="flex justify-end p-4 bg-slate-800/50 border-t border-slate-700 rounded-b-xl"><button id="save-widget-config-btn" type="button" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">Save</button></div>`
  });
}

// --- STORAGE SERVICE (ABSTRACTED) ---
const storageService = {
  getTransactions: () => JSON.parse(localStorage.getItem('transactions')) || [],
  getTransactionById: (id) => storageService.getTransactions().find(t => t.id === id),
  addTransaction: (transaction) => {
    const transactions = storageService.getTransactions();
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
  },
  updateTransaction: (updatedTransaction) => {
    let transactions = storageService.getTransactions();
    transactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
    localStorage.setItem('transactions', JSON.stringify(transactions));
  },
  deleteTransaction: (id) => {
    let transactions = storageService.getTransactions();
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
  },
  getCardOrder: () => JSON.parse(localStorage.getItem('cardOrder')),
  saveCardOrder: (order) => localStorage.setItem('cardOrder', JSON.stringify(order)),
  getWidgetConfig: () => JSON.parse(localStorage.getItem('widgetConfig')) || allWidgets.map(w => w.id),
  saveWidgetConfig: (ids) => localStorage.setItem('widgetConfig', JSON.stringify(ids)),
};

// Extend storageService for coffee counter
storageService.getCoffeeHistory = () => JSON.parse(localStorage.getItem('coffeeHistory')) || {};
storageService.saveCoffeeHistory = (history) => localStorage.setItem('coffeeHistory', JSON.stringify(history));
storageService.incrementCoffee = () => {
  const today = new Date().toISOString().slice(0, 10);
  const history = storageService.getCoffeeHistory();
  history[today] = (history[today] || 0) + 1;
  storageService.saveCoffeeHistory(history);
};

// Widget registry for modularity
const allWidgets = [
  { id: 'total-pay-card', label: 'Total Pay Earned', render: () => statCard({ id: 'total-pay-card', borderClass: 'border-indigo-500/50', title: 'Total Pay Earned', valueId: 'total-pay-display', badge: true, extraHtml: `
            <div class="border-t border-slate-700 pt-4">
              <div>
                <span class="text-sm text-slate-400 block">Since: <span id="start-date-label"></span></span>
                <span id="total-duration-display" class="text-sm font-medium text-white">(0 workdays)</span>
              </div>
              <div id="duration-toggle" class="grid grid-cols-4 gap-1 bg-slate-800 rounded-full p-1 text-xs mt-3">
                <button data-unit="days" class="px-2 py-1 text-center rounded-full bg-indigo-500">Days</button>
                <button data-unit="weeks" class="px-2 py-1 text-center rounded-full">Weeks</button>
                <button data-unit="months" class="px-2 py-1 text-center rounded-full">Months</button>
                <button data-unit="years" class="px-2 py-1 text-center rounded-full">Years</button>
              </div>
            </div>` }) },
  { id: 'today-earnings-card', label: "Today's Earnings", render: () => statCard({ id: 'today-earnings-card', borderClass: 'border-green-500/50', title: "Today's Earnings", valueId: 'today-pay-display', badge: true, extraHtml: `
            <div class="border-t border-slate-700 pt-4">
              <span class="text-sm text-slate-400 block">Time Elapsed Today</span>
              <span id="today-time-display" class="text-sm font-medium text-white">(0h 0m 0s)</span>
            </div>` }) },
  { id: 'transaction-tracker-card', label: 'Total Spending', render: () => statCard({ id: 'transaction-tracker-card', borderClass: 'border-rose-500/50', title: 'Total Spending', valueId: 'total-spending-display', badge: false, extraHtml: `
            <div class="border-t border-slate-700 pt-4 space-y-3">
              <div>
                <span class="text-sm text-slate-400 block">Most Recent:</span>
                <span id="recent-transaction-display" class="text-sm font-medium text-white truncate">No transactions yet.</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button id="add-transaction-btn" class="text-sm bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 font-semibold py-2 px-3 rounded-md transition-colors">Enter Transaction</button>
                <button id="view-history-btn" class="text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-3 rounded-md transition-colors">View History</button>
              </div>
            </div>` }) },
  { id: 'earnings-checker-card', label: 'Check Earnings', render: () => statCard({ id: 'earnings-checker-card', borderClass: 'border-purple-500/50', title: 'Check Earnings', valueId: 'projected-pay-display', badge: false, extraHtml: `
            <div class="border-t border-slate-700 pt-4 space-y-3">
              <input type="text" id="projection-date" class="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-center text-sm" placeholder="Select a date to calculate">
              <div class="text-center">
                <span id="projection-duration-display" class="text-sm font-medium text-white">Select a date</span>
              </div>
              <div id="projection-duration-toggle" class="grid grid-cols-4 gap-1 bg-slate-800 rounded-full p-1 text-xs">
                <button data-unit="days" class="px-2 py-1 text-center rounded-full bg-purple-500">Days</button>
                <button data-unit="weeks" class="px-2 py-1 text-center rounded-full">Weeks</button>
                <button data-unit="months" class="px-2 py-1 text-center rounded-full">Months</button>
                <button data-unit="years" class="px-2 py-1 text-center rounded-full">Years</button>
              </div>
            </div>` }) }
  // Add more widgets here as needed
];

// Coffee Counter Widget
function coffeeCounterCard() {
  const today = new Date().toISOString().slice(0, 10);
  const history = storageService.getCoffeeHistory();
  const todayCount = history[today] || 0;
  return `
    <div id="coffee-counter-card" class="stat-card bg-slate-900/70 p-6 rounded-xl border border-yellow-500/50 shadow-lg flex flex-col">
      <div class="flex-grow">
        <h2 class="font-semibold text-yellow-300 mb-4">Coffee Counter ☕</h2>
        <p class="text-4xl font-bold text-yellow-400 mb-4">${todayCount}</p>
        <span class="text-sm text-slate-400 block mb-2">Coffees today</span>
        <button id="log-coffee-btn" class="bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 font-semibold py-2 px-4 rounded-md transition-colors">Log Coffee</button>
      </div>
      <div class="border-t border-slate-700 pt-4 mt-4">
        <button id="view-coffee-history-btn" class="text-xs text-yellow-200 hover:underline">View Coffee History</button>
      </div>
    </div>
  `;
}

// Coffee History Modal
function coffeeHistoryModal() {
  const history = storageService.getCoffeeHistory();
  const days = Object.keys(history).sort().reverse();
  let html = '';
  if (days.length === 0) {
    html = '<p class="text-slate-400 text-center">No coffee logged yet.</p>';
  } else {
    html = '<ul class="space-y-2">' + days.map(day => `<li class="flex justify-between items-center bg-slate-900/50 p-3 rounded-md"><span class="text-slate-200">${day}</span><span class="font-bold text-yellow-400">${history[day]}</span></li>`).join('') + '</ul>';
  }
  return modal({
    id: 'coffee-history-modal',
    title: 'Coffee History',
    closeBtnId: 'close-coffee-history-modal-btn',
    content: `<div class="max-h-[60vh] overflow-y-auto">${html}</div>`
  });
}

// Add to allWidgets
allWidgets.push({
  id: 'coffee-counter-card',
  label: 'Coffee Counter',
  render: coffeeCounterCard
});

// Move this function above renderApp
function renderWidgetConfigForm(selectedWidgets, allWidgets) {
  return `
    <div class="mt-6">
      <label class="block text-sm font-medium text-slate-300 mb-2">Dashboard Widgets</label>
      <form id="widget-config-form" class="space-y-2">
        ${allWidgets.map(w => `
          <div class="flex items-center">
            <input type="checkbox" id="widget-checkbox-${w.id}" name="widgets" value="${w.id}" ${selectedWidgets.includes(w.id) ? 'checked' : ''} class="mr-2">
            <label for="widget-checkbox-${w.id}" class="text-slate-300">${w.label}</label>
          </div>
        `).join('')}
      </form>
    </div>
  `;
}

// --- MAIN APP RENDER ---
function renderApp() {
  const selectedWidgets = storageService.getWidgetConfig();
  const statsGrid = `
    <div id="stats-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      ${allWidgets.filter(w => selectedWidgets.includes(w.id)).map(w => w.render()).join('')}
    </div>
  `;

  // Header
  const header = `
    <header class="text-center mb-8 relative">
      <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text inline-flex items-center gap-3">
        <span class="text-4xl">💰</span>
        Pay Calculator Pro
      </h1>
      <p class="text-slate-400 mt-2">Track your earnings and spending in real-time.</p>
      <div class="absolute top-0 right-0 grid grid-cols-2 items-center gap-2">
        <button id="details-btn" class="text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </button>
        <button id="settings-btn" class="text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </button>
      </div>
    </header>
  `;

  // Details Modal
  const detailsModal = modal({
    id: 'details-modal',
    title: 'Calculation Details',
    closeBtnId: 'close-details-modal-btn',
    content: `
      <ul class="text-sm space-y-3">
        <li class="flex justify-between"><span class="text-slate-400">Biweekly Pay:</span><span id="details-biweekly-pay" class="font-medium text-white">$1,500.00</span></li>
        <li class="flex justify-between"><span class="text-slate-400">Daily Rate (10 workdays/period):</span><span id="details-daily-rate" class="font-medium text-white">$150.00</span></li>
        <li class="flex justify-between"><span class="text-slate-400">Work Hours:</span><span id="details-work-hours" class="font-medium text-white">8:00 AM - 4:00 PM</span></li>
        <li class="flex justify-between"><span class="text-slate-400">Hourly Rate:</span><span id="details-hourly-rate" class="font-medium text-white">$18.75/hour</span></li>
      </ul>`
  });

  // Settings Modal (add widget config form)
  const settingsModal = modal({
    id: 'settings-modal',
    title: 'Settings',
    closeBtnId: 'close-settings-modal-btn',
    content: `
      <div><label for="biweekly-pay-input" class="block text-sm font-medium text-slate-300 mb-2">Bi-weekly Paycheck ($)</label><input type="number" id="biweekly-pay-input" class="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"></div>
      <div><label for="start-date-input" class="block text-sm font-medium text-slate-300 mb-2">Start Date</label><input type="text" id="start-date-input" class="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"></div>
      <div class="grid grid-cols-2 gap-4">
        <div><label for="start-time-input" class="block text-sm font-medium text-slate-300 mb-2">Workday Start</label><input type="time" id="start-time-input" class="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"></div>
        <div><label for="end-time-input" class="block text-sm font-medium text-slate-300 mb-2">Workday End</label><input type="time" id="end-time-input" class="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"></div>
      </div>
      ${renderWidgetConfigForm(selectedWidgets, allWidgets)}
    `,
    footer: `<div class="flex justify-end p-4 bg-slate-800/50 border-t border-slate-700 rounded-b-xl"><button id="save-settings-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">Save Changes</button></div>`
  });

  // Transaction Modal
  const transactionModal = modal({
    id: 'transaction-modal',
    title: 'Add Transaction',
    closeBtnId: 'close-transaction-modal-btn',
    content: `
      <form id="transaction-form" class="space-y-6">
        <input type="hidden" id="transaction-id-input">
        <div><label for="transaction-title-input" class="block text-sm font-medium text-slate-300 mb-2">Title</label><input type="text" id="transaction-title-input" class="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none" placeholder="e.g., Coffee" required></div>
        <div><label for="transaction-amount-input" class="block text-sm font-medium text-slate-300 mb-2">Amount ($)</label><input type="number" id="transaction-amount-input" class="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none" placeholder="e.g., 4.50" required step="0.01"></div>
        <div><label for="transaction-category-select" class="block text-sm font-medium text-slate-300 mb-2">Category</label>
          <select id="transaction-category-select" class="w-full bg-slate-900 border border-slate-600 rounded-md p-2 mb-2">
            <option value="">Select or add category</option>
          </select>
          <input type="text" id="transaction-new-category" class="w-full bg-slate-900 border border-slate-600 rounded-md p-2" placeholder="Add new category (press Enter)">
        </div>
      </form>`,
    footer: `<div class="flex justify-end p-4 bg-slate-800/50 border-t border-slate-700 rounded-b-xl"><button id="save-transaction-btn" form="transaction-form" type="submit" class="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">Save Transaction</button></div>`
  });

  // History Modal
  const historyModal = modal({
    id: 'history-modal',
    title: 'Transaction History',
    closeBtnId: 'close-history-modal-btn',
    content: `<div id="history-content" class="max-h-[60vh] overflow-y-auto"></div>`,
    size: 'max-w-2xl'
  });

  // Confirm Modal
  const confirmModal = modal({
    id: 'confirm-modal',
    title: 'Are you sure?',
    closeBtnId: 'confirm-cancel-btn',
    content: `<p id="confirm-modal-text" class="text-slate-400 mb-6">Do you really want to delete this transaction? This action cannot be undone.</p><div class="flex justify-center gap-4"><button id="confirm-cancel-btn" class="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-6 rounded-md transition-colors">Cancel</button><button id="confirm-delete-btn" class="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 px-6 rounded-md transition-colors">Delete</button></div>`
  });

  // Main App Container
  return `
    <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 md:p-10 shadow-2xl">
      ${header}
      ${statsGrid}
    </div>
    ${detailsModal}
    ${settingsModal}
    ${transactionModal}
    ${historyModal}
    ${confirmModal}
    ${coffeeHistoryModal()}
  `;
}

// --- APP LOGIC, STATE, AND EVENT HANDLERS ---
function getDOMElements() {
  return {
    statsGrid: document.getElementById('stats-grid'),
    totalPayDisplay: document.getElementById('total-pay-display'),
    totalDurationDisplay: document.getElementById('total-duration-display'),
    startDateLabel: document.getElementById('start-date-label'),
    todayPayDisplay: document.getElementById('today-pay-display'),
    todayTimeDisplay: document.getElementById('today-time-display'),
    durationToggle: document.getElementById('duration-toggle'),
    projectedPayDisplay: document.getElementById('projected-pay-display'),
    projectionDateInput: document.getElementById('projection-date'),
    projectionDurationDisplay: document.getElementById('projection-duration-display'),
    projectionDurationToggle: document.getElementById('projection-duration-toggle'),
    totalSpendingDisplay: document.getElementById('total-spending-display'),
    recentTransactionDisplay: document.getElementById('recent-transaction-display'),
    addTransactionBtn: document.getElementById('add-transaction-btn'),
    viewHistoryBtn: document.getElementById('view-history-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettingsModalBtn: document.getElementById('close-settings-modal-btn'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    biweeklyPayInput: document.getElementById('biweekly-pay-input'),
    startDateInput: document.getElementById('start-date-input'),
    startTimeInput: document.getElementById('start-time-input'),
    endTimeInput: document.getElementById('end-time-input'),
    transactionModal: document.getElementById('transaction-modal'),
    transactionModalTitle: document.getElementById('transaction-modal-title'),
    closeTransactionModalBtn: document.getElementById('close-transaction-modal-btn'),
    transactionForm: document.getElementById('transaction-form'),
    saveTransactionBtn: document.getElementById('save-transaction-btn'),
    transactionIdInput: document.getElementById('transaction-id-input'),
    transactionTitleInput: document.getElementById('transaction-title-input'),
    transactionAmountInput: document.getElementById('transaction-amount-input'),
    transactionCategorySelect: document.getElementById('transaction-category-select'),
    transactionNewCategoryInput: document.getElementById('transaction-new-category'),
    historyModal: document.getElementById('history-modal'),
    closeHistoryModalBtn: document.getElementById('close-history-modal-btn'),
    historyContent: document.getElementById('history-content'),
    confirmModal: document.getElementById('confirm-modal'),
    confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    detailsBtn: document.getElementById('details-btn'),
    detailsModal: document.getElementById('details-modal'),
    closeDetailsModalBtn: document.getElementById('close-details-modal-btn'),
    details: {
      biweeklyPay: document.getElementById('details-biweekly-pay'),
      dailyRate: document.getElementById('details-daily-rate'),
      workHours: document.getElementById('details-work-hours'),
      hourlyRate: document.getElementById('details-hourly-rate'),
    },
    widgetConfigForm: document.getElementById('widget-config-form'),
    logCoffeeBtn: document.getElementById('log-coffee-btn'),
    viewCoffeeHistoryBtn: document.getElementById('view-coffee-history-btn'),
    coffeeHistoryModal: document.getElementById('coffee-history-modal'),
    closeCoffeeHistoryModalBtn: document.getElementById('close-coffee-history-modal-btn'),
  };
}
let DOMElements = getDOMElements();

document.addEventListener('DOMContentLoaded', () => {
  // Render the app
  document.getElementById('app-root').innerHTML = renderApp();
  DOMElements = getDOMElements();

  // --- CONFIGURATION & STATE ---
  let config = {biWeeklyPay: 1500, startDate: '2025-06-08', startTime: '08:00', endTime: '16:00'};
  let derivedRates = {daily: 0, perSecond: 0, workdaySeconds: 0};
  let appState = {durationUnit: 'days', projectionDurationUnit: 'days', liveUpdateInterval: null, transactionToDelete: null};

  // --- DOM ELEMENTS ---
  // function getDOMElements() { // This function is now global
  //   return {
  //     statsGrid: document.getElementById('stats-grid'),
  //     totalPayDisplay: document.getElementById('total-pay-display'),
  //     totalDurationDisplay: document.getElementById('total-duration-display'),
  //     startDateLabel: document.getElementById('start-date-label'),
  //     todayPayDisplay: document.getElementById('today-pay-display'),
  //     todayTimeDisplay: document.getElementById('today-time-display'),
  //     durationToggle: document.getElementById('duration-toggle'),
  //     projectedPayDisplay: document.getElementById('projected-pay-display'),
  //     projectionDateInput: document.getElementById('projection-date'),
  //     projectionDurationDisplay: document.getElementById('projection-duration-display'),
  //     projectionDurationToggle: document.getElementById('projection-duration-toggle'),
  //     totalSpendingDisplay: document.getElementById('total-spending-display'),
  //     recentTransactionDisplay: document.getElementById('recent-transaction-display'),
  //     addTransactionBtn: document.getElementById('add-transaction-btn'),
  //     viewHistoryBtn: document.getElementById('view-history-btn'),
  //     settingsBtn: document.getElementById('settings-btn'),
  //     settingsModal: document.getElementById('settings-modal'),
  //     closeSettingsModalBtn: document.getElementById('close-settings-modal-btn'),
  //     saveSettingsBtn: document.getElementById('save-settings-btn'),
  //     biweeklyPayInput: document.getElementById('biweekly-pay-input'),
  //     startDateInput: document.getElementById('start-date-input'),
  //     startTimeInput: document.getElementById('start-time-input'),
  //     endTimeInput: document.getElementById('end-time-input'),
  //     transactionModal: document.getElementById('transaction-modal'),
  //     transactionModalTitle: document.getElementById('transaction-modal-title'),
  //     closeTransactionModalBtn: document.getElementById('close-transaction-modal-btn'),
  //     transactionForm: document.getElementById('transaction-form'),
  //     saveTransactionBtn: document.getElementById('save-transaction-btn'),
  //     transactionIdInput: document.getElementById('transaction-id-input'),
  //     transactionTitleInput: document.getElementById('transaction-title-input'),
  //     transactionAmountInput: document.getElementById('transaction-amount-input'),
  //     transactionCategorySelect: document.getElementById('transaction-category-select'),
  //     transactionNewCategoryInput: document.getElementById('transaction-new-category'),
  //     historyModal: document.getElementById('history-modal'),
  //     closeHistoryModalBtn: document.getElementById('close-history-modal-btn'),
  //     historyContent: document.getElementById('history-content'),
  //     confirmModal: document.getElementById('confirm-modal'),
  //     confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
  //     confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
  //     detailsBtn: document.getElementById('details-btn'),
  //     detailsModal: document.getElementById('details-modal'),
  //     closeDetailsModalBtn: document.getElementById('close-details-modal-btn'),
  //     details: {
  //       biweeklyPay: document.getElementById('details-biweekly-pay'),
  //       dailyRate: document.getElementById('details-daily-rate'),
  //       workHours: document.getElementById('details-work-hours'),
  //       hourlyRate: document.getElementById('details-hourly-rate'),
  //     },
  //     openWidgetConfigBtn: document.getElementById('open-widget-config-btn'),
  //     widgetConfigModal: document.getElementById('widget-config-modal'),
  //     closeWidgetConfigModalBtn: document.getElementById('close-widget-config-modal-btn'),
  //     saveWidgetConfigBtn: document.getElementById('save-widget-config-btn'),
  //     widgetConfigForm: document.getElementById('widget-config-form'),
  //   };
  // }
  // let DOMElements = getDOMElements(); // This line is now redundant

  // --- UTILITY FUNCTIONS ---
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(amount);
  const formatDate = (date) => date.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});
  const getHoursFromTimeStr = (timeStr) => parseInt(timeStr.split(':')[0], 10);

  // --- SETTINGS MANAGEMENT ---
  function saveSettings() {localStorage.setItem('payTrackerConfig', JSON.stringify(config));}
  function loadSettings() {
    const savedConfig = localStorage.getItem('payTrackerConfig');
    if (savedConfig) {config = JSON.parse(savedConfig);}
    DOMElements.biweeklyPayInput.value = config.biWeeklyPay;
    DOMElements.startDateInput.value = config.startDate;
    DOMElements.startTimeInput.value = config.startTime;
    DOMElements.endTimeInput.value = config.endTime;
  }

  // --- TRANSACTION & SPENDING LOGIC ---
  function updateSpendingDisplay() {
    const transactions = storageService.getTransactions();
    const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
    if (DOMElements.totalSpendingDisplay) DOMElements.totalSpendingDisplay.textContent = `-${formatCurrency(totalSpending)}`;
    if (transactions.length > 0) {
      const recent = transactions[transactions.length - 1];
      if (DOMElements.recentTransactionDisplay) DOMElements.recentTransactionDisplay.textContent = `${recent.title} (${recent.category || 'Uncategorized'}): ${formatCurrency(recent.amount)}`;
    } else {
      if (DOMElements.recentTransactionDisplay) DOMElements.recentTransactionDisplay.textContent = 'No transactions yet.';
    }
  }

  function renderTransactionHistory() {
    const transactions = storageService.getTransactions().slice().reverse();
    const groupedByDate = transactions.reduce((acc, t) => {
      const date = new Date(t.date).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});
      if (!acc[date]) acc[date] = [];
      acc[date].push(t);
      return acc;
    }, {});

    let html = '';
    if (Object.keys(groupedByDate).length === 0) {
      html = '<p class="text-slate-400 text-center">No transactions recorded.</p>';
    } else {
      for (const date in groupedByDate) {
        html += `<div class="mb-6"><h3 class="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-3">${date}</h3><ul class="space-y-2">`;
        groupedByDate[date].forEach(t => {
          html += `<li class="flex justify-between items-center bg-slate-900/50 p-3 rounded-md">
                      <div>
                          <span class="text-slate-200 block">${t.title} <span class="ml-2 text-xs text-slate-400">[${t.category || 'Uncategorized'}]</span></span>
                          <span class="font-medium text-rose-400 text-sm">${formatCurrency(t.amount)}</span>
                      </div>
                      <div class="flex items-center gap-2">
                          <button data-id="${t.id}" class="edit-btn text-slate-400 hover:text-white transition-colors p-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                          </button>
                          <button data-id="${t.id}" class="delete-btn text-slate-400 hover:text-rose-500 transition-colors p-1">
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                      </div>
                   </li>`;
        });
        html += `</ul></div>`;
      }
    }
    DOMElements.historyContent.innerHTML = html;
  }

  function renderCategoryDropdown(selected) {
    const categories = storageService.getTransactions().map(t => t.category).filter(Boolean);
    const unique = Array.from(new Set(categories));
    DOMElements.transactionCategorySelect.innerHTML = '<option value="">Select or add category</option>' +
      unique.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    if (selected) DOMElements.transactionCategorySelect.value = selected;
  }

  // --- CORE PAY CALCULATION LOGIC ---
  function updateDerivedRates() {
    const startHour = getHoursFromTimeStr(config.startTime);
    const endHour = getHoursFromTimeStr(config.endTime);
    const workdayHours = endHour - startHour;
    derivedRates.workdaySeconds = workdayHours * 3600;
    derivedRates.daily = config.biWeeklyPay / 10;
    derivedRates.perSecond = derivedRates.workdaySeconds > 0 ? derivedRates.daily / derivedRates.workdaySeconds : 0;
  }

  function calculateWorkdays(startDate, endDate) {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
      if (curDate.getUTCDay() !== 0 && curDate.getUTCDay() !== 6) count++;
      curDate.setUTCDate(curDate.getUTCDate() + 1);
    }
    return count;
  }

  function calculateDuration(startDate, endDate, unit) {
    if (endDate < startDate) return '(Invalid date range)';
    switch (unit) {
      case 'days': return `(${calculateWorkdays(startDate, endDate)} workdays)`;
      case 'weeks': return `(${((endDate - startDate) / (1000 * 3600 * 24 * 7)).toFixed(1)} weeks)`;
      case 'months': return `(${(endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())} months)`;
      case 'years': return `(${((endDate - startDate) / (1000 * 3600 * 24 * 365.25)).toFixed(2)} years)`;
      default: return '';
    }
  }

  function calculatePayForDate(targetDate) {
    const startDate = new Date(config.startDate + 'T00:00:00');
    if (targetDate < startDate) return {pay: 0, workdays: 0};
    const workdays = calculateWorkdays(startDate, targetDate);
    return {pay: workdays * derivedRates.daily, workdays};
  }

  function calculateLivePay() {
    const now = new Date();
    const startDate = new Date(config.startDate + 'T00:00:00');
    if (now < startDate) return {totalPay: 0, workSecondsToday: 0};
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    let totalPay = 0;
    if (yesterday >= startDate) totalPay = calculatePayForDate(yesterday).pay;
    let workSecondsToday = 0;
    if (now.getDay() !== 0 && now.getDay() !== 6) {
      const workStartTime = new Date(now.getTime()).setHours(...config.startTime.split(':'), 0, 0);
      const workEndTime = new Date(now.getTime()).setHours(...config.endTime.split(':'), 0, 0);
      if (now.getTime() > workStartTime) {
        workSecondsToday = Math.max(0, (Math.min(now.getTime(), workEndTime) - workStartTime) / 1000);
      }
    }
    totalPay += workSecondsToday * derivedRates.perSecond;
    return {totalPay, workSecondsToday};
  }

  // --- UI UPDATE FUNCTIONS ---
  function updateAllDisplays() {
    updateDerivedRates();
    const {totalPay, workSecondsToday} = calculateLivePay();
    if (DOMElements.totalPayDisplay) DOMElements.totalPayDisplay.textContent = formatCurrency(totalPay);
    if (DOMElements.todayPayDisplay) DOMElements.todayPayDisplay.textContent = formatCurrency(workSecondsToday * derivedRates.perSecond);
    const h = Math.floor(workSecondsToday / 3600), m = Math.floor((workSecondsToday % 3600) / 60), s = Math.floor(workSecondsToday % 60);
    if (DOMElements.todayTimeDisplay) DOMElements.todayTimeDisplay.textContent = `(${h}h ${m}m ${s}s)`;
    updateDurationDisplay();
    updateSpendingDisplay();
    if (DOMElements.startDateLabel) DOMElements.startDateLabel.textContent = formatDate(new Date(config.startDate + 'T00:00:00'));
    if (DOMElements.details && DOMElements.details.biweeklyPay) DOMElements.details.biweeklyPay.textContent = formatCurrency(config.biWeeklyPay);
    if (DOMElements.details && DOMElements.details.dailyRate) DOMElements.details.dailyRate.textContent = formatCurrency(derivedRates.daily);
    const startHour = new Date('1970-01-01T' + config.startTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
    const endHour = new Date('1970-01-01T' + config.endTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
    if (DOMElements.details && DOMElements.details.workHours) DOMElements.details.workHours.textContent = `${startHour} - ${endHour}`;
    if (DOMElements.details && DOMElements.details.hourlyRate) DOMElements.details.hourlyRate.textContent = `${formatCurrency(derivedRates.perSecond * 3600)}/hour`;
  }

  function updateDurationDisplay() {
    const startDate = new Date(config.startDate + 'T00:00:00');
    const now = new Date();
    DOMElements.totalDurationDisplay.textContent = calculateDuration(startDate, now, appState.durationUnit);
  }

  function updateProjectionDisplay() {
    const selectedDateStr = DOMElements.projectionDateInput._flatpickr.selectedDates[0];
    if (!selectedDateStr) {
      DOMElements.projectedPayDisplay.textContent = formatCurrency(0);
      DOMElements.projectionDurationDisplay.textContent = 'Select a date';
      return;
    }
    const selectedDate = new Date(selectedDateStr);
    const startDate = new Date(config.startDate + 'T00:00:00');
    const {pay} = calculatePayForDate(selectedDate);
    DOMElements.projectedPayDisplay.textContent = formatCurrency(pay);
    DOMElements.projectionDurationDisplay.textContent = calculateDuration(startDate, selectedDate, appState.projectionDurationUnit);
  }

  function startLiveTracker() {
    if (appState.liveUpdateInterval) clearInterval(appState.liveUpdateInterval);
    appState.liveUpdateInterval = setInterval(updateAllDisplays, 1000);
  }

  // --- DRAG-AND-DROP LOGIC ---
  function applyCardOrder() {
    const order = storageService.getCardOrder();
    if (order) {
      order.forEach(cardId => {
        const card = document.getElementById(cardId);
        if (card) DOMElements.statsGrid.appendChild(card);
      });
    }
  }

  function initializeSortable() {
    new Sortable(DOMElements.statsGrid, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: function (evt) {
        const order = Array.from(evt.to.children).map(item => item.id);
        storageService.saveCardOrder(order);
      },
    });
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    if (DOMElements.settingsBtn) DOMElements.settingsBtn.addEventListener('click', () => DOMElements.settingsModal.classList.remove('hidden'));
    if (DOMElements.closeSettingsModalBtn) DOMElements.closeSettingsModalBtn.addEventListener('click', () => DOMElements.settingsModal.classList.add('hidden'));
    if (DOMElements.detailsBtn) DOMElements.detailsBtn.addEventListener('click', () => DOMElements.detailsModal.classList.remove('hidden'));
    if (DOMElements.closeDetailsModalBtn) DOMElements.closeDetailsModalBtn.addEventListener('click', () => DOMElements.detailsModal.classList.add('hidden'));

    if (DOMElements.addTransactionBtn) DOMElements.addTransactionBtn.addEventListener('click', () => {
      DOMElements.transactionForm.reset();
      DOMElements.transactionIdInput.value = '';
      renderCategoryDropdown();
      DOMElements.transactionModalTitle.textContent = 'Add Transaction';
      DOMElements.transactionModal.classList.remove('hidden');
    });
    if (DOMElements.closeTransactionModalBtn) DOMElements.closeTransactionModalBtn.addEventListener('click', () => DOMElements.transactionModal.classList.add('hidden'));
    if (DOMElements.viewHistoryBtn) DOMElements.viewHistoryBtn.addEventListener('click', () => {
      renderTransactionHistory();
      DOMElements.historyModal.classList.remove('hidden');
    });
    if (DOMElements.closeHistoryModalBtn) DOMElements.closeHistoryModalBtn.addEventListener('click', () => DOMElements.historyModal.classList.add('hidden'));
    if (DOMElements.confirmCancelBtn) DOMElements.confirmCancelBtn.addEventListener('click', () => DOMElements.confirmModal.classList.add('hidden'));
    if (DOMElements.confirmDeleteBtn) DOMElements.confirmDeleteBtn.addEventListener('click', () => {
      if (appState.transactionToDelete) {
        storageService.deleteTransaction(appState.transactionToDelete);
        appState.transactionToDelete = null;
        updateSpendingDisplay();
        renderTransactionHistory();
      }
      DOMElements.confirmModal.classList.add('hidden');
    });

    if (DOMElements.historyContent) DOMElements.historyContent.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-btn');
      const deleteBtn = e.target.closest('.delete-btn');
      if (editBtn) {
        const id = parseInt(editBtn.dataset.id);
        const transaction = storageService.getTransactionById(id);
        if (transaction) {
          DOMElements.transactionIdInput.value = transaction.id;
          DOMElements.transactionTitleInput.value = transaction.title;
          DOMElements.transactionAmountInput.value = transaction.amount;
          renderCategoryDropdown(transaction.category || '');
          DOMElements.transactionModalTitle.textContent = 'Edit Transaction';
          DOMElements.transactionModal.classList.remove('hidden');
        }
      }
      if (deleteBtn) {
        appState.transactionToDelete = parseInt(deleteBtn.dataset.id);
        DOMElements.confirmModal.classList.remove('hidden');
      }
    });

    if (DOMElements.saveSettingsBtn) DOMElements.saveSettingsBtn.addEventListener('click', () => {
      config.biWeeklyPay = parseFloat(DOMElements.biweeklyPayInput.value) || 1500;
      config.startDate = DOMElements.startDateInput.value;
      config.startTime = DOMElements.startTimeInput.value;
      config.endTime = DOMElements.endTimeInput.value;
      // Save widget config
      const checked = Array.from(document.querySelectorAll('#widget-config-form input[name="widgets"]:checked')).map(cb => cb.value);
      storageService.saveWidgetConfig(checked);
      saveSettings();
      // Re-render app to apply widget config changes
      document.getElementById('app-root').innerHTML = renderApp();
      DOMElements = getDOMElements();
      setupEventListeners();
      // Hide modal after re-render
      DOMElements.settingsModal.classList.add('hidden');
    });

    if (DOMElements.transactionForm) DOMElements.transactionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = parseInt(DOMElements.transactionIdInput.value);
      const title = DOMElements.transactionTitleInput.value.trim();
      const amount = parseFloat(DOMElements.transactionAmountInput.value);
      let category = DOMElements.transactionCategorySelect.value;
      const newCategory = DOMElements.transactionNewCategoryInput.value.trim();
      if (newCategory) category = newCategory;
      if (title && !isNaN(amount) && amount > 0 && category) {
        if (id) { // Update existing
          const originalTransaction = storageService.getTransactionById(id);
          storageService.updateTransaction({id, title, amount, category, date: originalTransaction.date});
        } else { // Add new
          storageService.addTransaction({id: Date.now(), title, amount, category, date: new Date().toISOString()});
        }
        updateSpendingDisplay();
        renderTransactionHistory();
        DOMElements.transactionModal.classList.add('hidden');
      }
    });

    if (DOMElements.durationToggle) DOMElements.durationToggle.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        appState.durationUnit = e.target.dataset.unit;
        DOMElements.durationToggle.querySelectorAll('button').forEach(btn => btn.classList.remove('bg-indigo-500'));
        e.target.classList.add('bg-indigo-500');
        updateDurationDisplay();
      }
    });

    if (DOMElements.projectionDurationToggle) DOMElements.projectionDurationToggle.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        appState.projectionDurationUnit = e.target.dataset.unit;
        DOMElements.projectionDurationToggle.querySelectorAll('button').forEach(btn => btn.classList.remove('bg-purple-500'));
        e.target.classList.add('bg-purple-500');
        updateProjectionDisplay();
      }
    });

    if (DOMElements.transactionCategorySelect) DOMElements.transactionCategorySelect.addEventListener('change', () => {
      DOMElements.transactionNewCategoryInput.value = '';
    });
    if (DOMElements.transactionNewCategoryInput) DOMElements.transactionNewCategoryInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const newCat = DOMElements.transactionNewCategoryInput.value.trim();
        if (newCat && !Array.from(DOMElements.transactionCategorySelect.options).some(opt => opt.value === newCat)) {
          const opt = document.createElement('option');
          opt.value = newCat;
          opt.textContent = newCat;
          DOMElements.transactionCategorySelect.appendChild(opt);
          DOMElements.transactionCategorySelect.value = newCat;
          DOMElements.transactionNewCategoryInput.value = '';
        }
      }
    });

    if (DOMElements.logCoffeeBtn) DOMElements.logCoffeeBtn.addEventListener('click', () => {
      storageService.incrementCoffee();
      // Re-render just the widget for instant feedback (or re-render all)
      document.getElementById('app-root').innerHTML = renderApp();
      DOMElements = getDOMElements();
      setupEventListeners();
    });
    if (DOMElements.viewCoffeeHistoryBtn) DOMElements.viewCoffeeHistoryBtn.addEventListener('click', () => {
      DOMElements.coffeeHistoryModal.classList.remove('hidden');
    });
    if (DOMElements.closeCoffeeHistoryModalBtn) DOMElements.closeCoffeeHistoryModalBtn.addEventListener('click', () => {
      DOMElements.coffeeHistoryModal.classList.add('hidden');
    });
  }

  // --- INITIALIZATION ---
  function initializeDatePickers() {
    const commonOptions = {altInput: true, altFormat: "F j, Y", dateFormat: "Y-m-d"};
    if (DOMElements.projectionDateInput) {
      flatpickr(DOMElements.projectionDateInput, {...commonOptions, minDate: config.startDate, onChange: () => updateProjectionDisplay()});
    }
    if (DOMElements.startDateInput) {
      flatpickr(DOMElements.startDateInput, {...commonOptions});
    }
  }

  function init() {
    loadSettings();
    applyCardOrder();
    updateAllDisplays();
    initializeDatePickers();
    initializeSortable();
    setupEventListeners();
    startLiveTracker();
  }

  init();
}); 