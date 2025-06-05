// --- DANE PRZYKŁADOWE ---
const meetingDates = [
  '2025-01-15', '2025-01-16', '2025-02-04', '2025-02-05', '2025-03-11', '2025-03-12',
  '2025-04-01', '2025-04-02', '2025-05-06', '2025-05-07', '2025-06-03', '2025-06-04',
  '2025-07-01', '2025-07-02', '2025-08-26', '2025-09-02', '2025-09-03', '2025-10-07',
  '2025-10-08', '2025-11-04', '2025-11-05', '2025-12-02', '2025-12-03'
];

// --- KALENDARZ ---
const daysOfWeek = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
const today = new Date();
document.getElementById('todayDate').textContent = today.toISOString().split('T')[0].split('-').reverse().join('.');
let currentMonth = today.getMonth(), currentYear = today.getFullYear();
const monthYearEl = document.getElementById('monthYear');
const daysHeader = document.getElementById('daysHeader');
const datesEl = document.getElementById('dates');

function renderCalendar(month, year) {
  monthYearEl.textContent = new Date(year, month).toLocaleString('pl-PL', { month: 'long', year: 'numeric' });
  daysHeader.innerHTML = ''; 
  datesEl.innerHTML = '';
  daysOfWeek.forEach(d => {
    const elem = document.createElement('div'); 
    elem.textContent = d; 
    elem.classList.add('day-name');
    daysHeader.appendChild(elem);
  });
  let firstDay = new Date(year, month, 1).getDay() - 1; 
  if (firstDay < 0) firstDay = 6;
  for (let i = 0; i < firstDay; i++) datesEl.appendChild(document.createElement('div'));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const elem = document.createElement('div'); 
    elem.textContent = d; 
    elem.classList.add('date');
    if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) elem.classList.add('today');
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (meetingDates.includes(iso)) elem.classList.add('meeting');
    datesEl.appendChild(elem);
  }
}

document.getElementById('prev').addEventListener('click', () => { 
  currentMonth--; 
  if (currentMonth < 0) { currentMonth = 11; currentYear--; } 
  renderCalendar(currentMonth, currentYear); 
});

document.getElementById('next').addEventListener('click', () => { 
  currentMonth++; 
  if (currentMonth > 11) { currentMonth = 0; currentYear++; } 
  renderCalendar(currentMonth, currentYear); 
});

// --- HELPER FUNCTIONS FOR DIFFERENCES ---
function formatDifference(diff, label) {
  const direction = diff >= 0 ? 'up' : 'down';
  const arrow = diff >= 0 ? '▲' : '▼';
  const value = Math.abs(diff).toFixed(2);
  
  return `<span class="difference-arrow ${direction}">${arrow}</span><span class="difference-value">${value} pp</span><span class="difference-label">${label}</span>`;
}

// --- FETCH DATA FROM JSON FILES ---
async function fetchData() {
  try {
    // Fetch Stopa referencyjna NBP
    const nbpResponse = await fetch('nbp_rates.json');
    if (!nbpResponse.ok) throw new Error('Failed to fetch nbp_rates.json');
    const nbpData = await nbpResponse.json();
    const referenceRate = parseFloat(nbpData["Stopa referencyjna"].replace(',', '.'));
    document.getElementById('rateValue').textContent = referenceRate.toFixed(2);

    // Fetch Stopa WIBOR 3M
    const wiborResponse = await fetch('wibor_rates.json');
    if (!wiborResponse.ok) throw new Error('Failed to fetch wibor_rates.json');
    const wiborData = await wiborResponse.json();
    const wibor3m = parseFloat(wiborData["wibor_3m"]);
    document.getElementById('wiborValue').textContent = wibor3m.toFixed(2);

    // Calculate and display WIBOR vs Reference Rate difference
    const wiborDiff = wibor3m - referenceRate;
    const wiborDiffEl = document.getElementById('wiborDifference');
    wiborDiffEl.innerHTML = formatDifference(wiborDiff, 'vs stopa referencyjna');

    // Fetch FRA Rates
    const fraResponse = await fetch('fra_rates.json');
    if (!fraResponse.ok) throw new Error('Failed to fetch fra_rates.json');
    const fraData = await fraResponse.json();
    
    // Parse and display FRA rates with differences
    const fraRates = {
      '1x4': parseFloat(fraData["1x4"].replace(',', '.')),
      '3x6': parseFloat(fraData["3x6"].replace(',', '.')),
      '6x9': parseFloat(fraData["6x9"].replace(',', '.')),
      '9x12': parseFloat(fraData["9x12"].replace(',', '.'))
    };
    
    // Display FRA rates and differences
    Object.entries(fraRates).forEach(([period, rate]) => {
      document.getElementById(`fra${period}`).textContent = rate.toFixed(3);
      
      const diff = rate - wibor3m;
      const diffEl = document.getElementById(`fra${period}Diff`);
      diffEl.innerHTML = formatDifference(diff, 'vs WIBOR 3M');
    });
    
  } catch (error) {
    console.error('Error fetching data:', error);
    document.getElementById('rateValue').textContent = 'Error';
    document.getElementById('wiborValue').textContent = 'Error';
    document.getElementById('wiborDifference').innerHTML = 'Error loading data';
    ['1x4', '3x6', '6x9', '9x12'].forEach(period => {
      document.getElementById(`fra${period}`).textContent = 'Error';
      document.getElementById(`fra${period}Diff`).innerHTML = 'Error';
    });
  }
}

// --- FRA CAROUSEL NAVIGATION ---
const fraContainer = document.getElementById('fraList');
const offset = fraContainer.querySelector('.fra-item')?.offsetWidth + 20 || 220;
document.getElementById('fraPrev').onclick = () => fraContainer.scrollBy({ left: -offset, behavior: 'smooth' });
document.getElementById('fraNext').onclick = () => fraContainer.scrollBy({ left: offset, behavior: 'smooth' });

// --- INITIALIZE PAGE ---
window.onload = () => {
  renderCalendar(currentMonth, currentYear);
  fetchData();
};
