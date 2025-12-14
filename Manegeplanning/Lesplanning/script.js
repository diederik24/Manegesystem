// Kalender data
let currentMonth = new Date().getMonth();
let currentYear = 2026;
let activities = JSON.parse(localStorage.getItem('manegeActivities')) || {};
let editingActivityId = null;

// Nederlandse maand- en dagnamen
const monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 
                    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

// Initialisatie
document.addEventListener('DOMContentLoaded', () => {
    initializeCalendar();
    setupEventListeners();
    loadSampleActivities();
});

function initializeCalendar() {
    const monthSelector = document.getElementById('monthSelector');
    monthSelector.value = currentMonth;
    renderCalendar();
    renderYearView();
}

function setupEventListeners() {
    // Maand selector
    document.getElementById('monthSelector').addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        renderCalendar();
    });

    // Kwartaaloverzicht knop
    document.getElementById('quarterViewBtn').addEventListener('click', toggleQuarterView);
    
    // Jaaroverzicht knop
    document.getElementById('yearViewBtn').addEventListener('click', toggleYearView);

    // Modal sluiten
    document.querySelector('.close').addEventListener('click', closeActivityModal);
    document.querySelector('.close-details').addEventListener('click', closeDetailsModal);
    document.getElementById('cancelBtn').addEventListener('click', closeActivityModal);

    // Form submit
    document.getElementById('activityForm').addEventListener('submit', saveActivity);

    // Delete knop
    document.getElementById('deleteBtn').addEventListener('click', deleteActivity);

    // Klik buiten modal om te sluiten
    window.addEventListener('click', (e) => {
        const activityModal = document.getElementById('activityModal');
        const detailsModal = document.getElementById('detailsModal');
        if (e.target === activityModal) {
            closeActivityModal();
        }
        if (e.target === detailsModal) {
            closeDetailsModal();
        }
    });
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Dag headers
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Eerste dag van de maand
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Maandag als eerste dag

    // Laatste dag van de maand
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (7 - lastDay.getDay())); // Zondag als laatste dag

    const today = new Date();
    const isCurrentYear = today.getFullYear() === currentYear;
    const isCurrentMonth = today.getMonth() === currentMonth;

    // Dagen genereren
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dateStr = formatDate(date);
        const dayNumber = date.getDate();
        const isOtherMonth = date.getMonth() !== currentMonth;
        const isToday = isCurrentYear && isCurrentMonth && 
                       date.getDate() === today.getDate() && 
                       date.getMonth() === today.getMonth();
        const quarterKey = getQuarterForDate(dateStr);

        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        if (isToday) {
            dayElement.classList.add('today');
        }
        if (quarterKey) {
            dayElement.classList.add(quarterKey);
        }

        dayElement.innerHTML = `<div class="day-number">${dayNumber}</div>`;
        
        // Activiteiten voor deze dag
        const dayActivities = activities[dateStr] || [];
        const maxVisible = 3;
        
        dayActivities.slice(0, maxVisible).forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = `activity-item ${activity.type}`;
            activityElement.textContent = `${activity.time || ''} ${activity.title}`;
            activityElement.title = `${activity.title}\n${activity.description || ''}\nInstructeur: ${activity.instructor || 'Niet opgegeven'}`;
            activityElement.addEventListener('click', (e) => {
                e.stopPropagation();
                showActivityDetails(activity, dateStr);
            });
            dayElement.appendChild(activityElement);
        });

        if (dayActivities.length > maxVisible) {
            const moreElement = document.createElement('div');
            moreElement.className = 'more-activities';
            moreElement.textContent = `+${dayActivities.length - maxVisible} meer`;
            moreElement.addEventListener('click', (e) => {
                e.stopPropagation();
                showActivityDetails(null, dateStr);
            });
            dayElement.appendChild(moreElement);
        }

        dayElement.addEventListener('click', () => {
            if (!isOtherMonth) {
                openActivityModal(dateStr);
            }
        });

        calendarGrid.appendChild(dayElement);
    }
}

function renderYearView() {
    const yearGrid = document.getElementById('yearGrid');
    yearGrid.innerHTML = '';

    const today = new Date();
    const isCurrentYear = today.getFullYear() === currentYear;

    for (let month = 0; month < 12; month++) {
        const monthCard = document.createElement('div');
        monthCard.className = 'month-card';
        monthCard.innerHTML = `<div class="month-title">${monthNames[month]}</div>`;
        
        const miniGrid = document.createElement('div');
        miniGrid.className = 'month-mini-grid';

        const firstDay = new Date(currentYear, month, 1);
        const lastDay = new Date(currentYear, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);

        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (7 - lastDay.getDay()));

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const miniDay = document.createElement('div');
            miniDay.className = 'month-mini-day';
            
            const dateStr = formatDate(date);
            const dayActivities = activities[dateStr] || [];
            const isToday = isCurrentYear && 
                           date.getDate() === today.getDate() && 
                           date.getMonth() === today.getMonth() &&
                           date.getFullYear() === today.getFullYear();

            if (dayActivities.length > 0) {
                miniDay.classList.add('has-activities');
            }
            if (isToday) {
                miniDay.classList.add('today');
            }

            if (date.getMonth() === month) {
                miniDay.innerHTML = `<div class="month-mini-day-number">${date.getDate()}</div>`;
            }

            miniGrid.appendChild(miniDay);
        }

        monthCard.appendChild(miniGrid);
        monthCard.addEventListener('click', () => {
            currentMonth = month;
            document.getElementById('monthSelector').value = month;
            toggleYearView();
            renderCalendar();
        });

        yearGrid.appendChild(monthCard);
    }
}

function toggleYearView() {
    const calendarView = document.getElementById('calendarView');
    const yearView = document.getElementById('yearView');
    
    if (yearView.classList.contains('hidden')) {
        calendarView.classList.add('hidden');
        yearView.classList.remove('hidden');
        document.getElementById('yearViewBtn').textContent = 'Maandoverzicht';
    } else {
        calendarView.classList.remove('hidden');
        yearView.classList.add('hidden');
        document.getElementById('yearViewBtn').textContent = 'Jaaroverzicht';
    }
}

function openActivityModal(dateStr, activityId = null) {
    const modal = document.getElementById('activityModal');
    const form = document.getElementById('activityForm');
    const deleteBtn = document.getElementById('deleteBtn');
    
    editingActivityId = activityId;
    document.getElementById('activityDate').value = dateStr;
    document.getElementById('activityId').value = activityId || '';

    if (activityId) {
        const activity = activities[dateStr].find(a => a.id === activityId);
        if (activity) {
            document.getElementById('modalTitle').textContent = 'Activiteit Bewerken';
            document.getElementById('activityType').value = activity.type;
            document.getElementById('activityTime').value = activity.time || '';
            document.getElementById('activityTitle').value = activity.title;
            document.getElementById('activityDescription').value = activity.description || '';
            document.getElementById('activityInstructor').value = activity.instructor || '';
            deleteBtn.classList.remove('hidden');
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Activiteit Toevoegen';
        form.reset();
        document.getElementById('activityDate').value = dateStr;
        deleteBtn.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeActivityModal() {
    document.getElementById('activityModal').classList.add('hidden');
    document.getElementById('activityForm').reset();
    editingActivityId = null;
}

function showActivityDetails(activity, dateStr) {
    const modal = document.getElementById('detailsModal');
    const detailsDiv = document.getElementById('activityDetails');
    
    if (activity) {
        detailsDiv.innerHTML = `
            <h2 style="color: #ff6b9d; margin-bottom: 20px;">${activity.title}</h2>
            <div class="activity-detail-item">
                <strong>Type:</strong>
                <span>${getActivityTypeName(activity.type)}</span>
            </div>
            <div class="activity-detail-item">
                <strong>Datum:</strong>
                <span>${formatDateDisplay(dateStr)}</span>
            </div>
            <div class="activity-detail-item">
                <strong>Tijd:</strong>
                <span>${activity.time || 'Niet opgegeven'}</span>
            </div>
            <div class="activity-detail-item">
                <strong>Instructeur:</strong>
                <span>${activity.instructor || 'Niet opgegeven'}</span>
            </div>
            ${activity.description ? `
            <div class="activity-detail-item">
                <strong>Beschrijving:</strong>
                <span>${activity.description}</span>
            </div>
            ` : ''}
            <div class="form-actions" style="margin-top: 20px;">
                <button class="btn-primary" onclick="editActivity('${dateStr}', '${activity.id}')">Bewerken</button>
                <button class="btn-secondary" onclick="closeDetailsModal()">Sluiten</button>
            </div>
        `;
    } else {
        const dayActivities = activities[dateStr] || [];
        detailsDiv.innerHTML = `
            <h2 style="color: #ff6b9d; margin-bottom: 20px;">Activiteiten op ${formatDateDisplay(dateStr)}</h2>
            ${dayActivities.map(act => `
                <div class="activity-detail-item" style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${act.title}</strong> (${getActivityTypeName(act.type)})
                            <br><small>${act.time || 'Geen tijd opgegeven'}</small>
                        </div>
                        <button class="btn-primary" style="padding: 8px 16px; font-size: 14px;" 
                                onclick="editActivity('${dateStr}', '${act.id}')">Bewerken</button>
                    </div>
                </div>
            `).join('')}
            <div class="form-actions" style="margin-top: 20px;">
                <button class="btn-secondary" onclick="closeDetailsModal()">Sluiten</button>
            </div>
        `;
    }
    
    modal.classList.remove('hidden');
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.add('hidden');
}

function editActivity(dateStr, activityId) {
    closeDetailsModal();
    setTimeout(() => openActivityModal(dateStr, activityId), 300);
}

window.editActivity = editActivity;

function saveActivity(e) {
    e.preventDefault();
    
    const dateStr = document.getElementById('activityDate').value;
    const activityId = editingActivityId || generateId();
    const activity = {
        id: activityId,
        type: document.getElementById('activityType').value,
        time: document.getElementById('activityTime').value,
        title: document.getElementById('activityTitle').value,
        description: document.getElementById('activityDescription').value,
        instructor: document.getElementById('activityInstructor').value
    };

    if (!activities[dateStr]) {
        activities[dateStr] = [];
    }

    if (editingActivityId) {
        const index = activities[dateStr].findIndex(a => a.id === editingActivityId);
        if (index !== -1) {
            activities[dateStr][index] = activity;
        }
    } else {
        activities[dateStr].push(activity);
        activities[dateStr].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    }

    saveActivities();
    closeActivityModal();
    renderCalendar();
    renderYearView();
}

function deleteActivity() {
    if (!editingActivityId) return;
    
    const dateStr = document.getElementById('activityDate').value;
    if (activities[dateStr]) {
        activities[dateStr] = activities[dateStr].filter(a => a.id !== editingActivityId);
        if (activities[dateStr].length === 0) {
            delete activities[dateStr];
        }
    }

    saveActivities();
    closeActivityModal();
    renderCalendar();
    renderYearView();
}

function saveActivities() {
    localStorage.setItem('manegeActivities', JSON.stringify(activities));
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function getActivityTypeName(type) {
    const names = {
        'springles': 'Springles',
        'dressuurles': 'Dressuurles',
        'schriktraining': 'Schriktraining',
        'westernles': 'Westernles',
        'voltigeles': 'Voltigeles',
        'ponyles': 'Ponyles',
        'theorieles': 'Theorieles',
        'paardenkennis': 'Paardenkennis',
        'verzorging': 'Verzorging & Verzorging',
        'wedstrijd': 'Wedstrijd',
        'training': 'Training',
        'onderhoud': 'Onderhoud',
        'overig': 'Overig'
    };
    return names[type] || type;
}

// Kwartaalindeling
const quarters = {
    q1: { start: '2026-01-02', end: '2026-03-29', name: 'Q1' },
    q2: { start: '2026-03-30', end: '2026-07-19', name: 'Q2' },
    zomerstop: { start: '2026-07-20', end: '2026-08-09', name: 'Zomerstop' },
    q3: { start: '2026-08-10', end: '2026-11-30', name: 'Q3' },
    q4: { start: '2026-12-01', end: '2026-12-23', name: 'Q4' }
};

function getQuarterForDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const dateStrOnly = dateStr;
    
    for (const [key, quarter] of Object.entries(quarters)) {
        if (dateStrOnly >= quarter.start && dateStrOnly <= quarter.end) {
            return key;
        }
    }
    return null;
}

function isDateInQuarter(dateStr, quarterKey) {
    const quarter = quarters[quarterKey];
    if (!quarter) return false;
    return dateStr >= quarter.start && dateStr <= quarter.end;
}

function toggleQuarterView() {
    const calendarView = document.getElementById('calendarView');
    const quarterView = document.getElementById('quarterView');
    const yearView = document.getElementById('yearView');
    
    if (quarterView.classList.contains('hidden')) {
        calendarView.classList.add('hidden');
        yearView.classList.add('hidden');
        quarterView.classList.remove('hidden');
        renderQuarterView();
        document.getElementById('quarterViewBtn').textContent = 'Maandoverzicht';
    } else {
        calendarView.classList.remove('hidden');
        quarterView.classList.add('hidden');
        document.getElementById('quarterViewBtn').textContent = 'Kwartaaloverzicht';
    }
}

let currentQuarter = 'q1';

function renderQuarterView() {
    const quarterInfo = document.getElementById('quarterInfo');
    const quarterGrid = document.getElementById('quarterGrid');
    
    // Kwartaal selector
    quarterInfo.innerHTML = `
        <div class="quarter-selector">
            <button class="quarter-btn ${currentQuarter === 'q1' ? 'active' : ''}" onclick="selectQuarter('q1')">Q1 (2 jan - 29 mrt)</button>
            <button class="quarter-btn ${currentQuarter === 'q2' ? 'active' : ''}" onclick="selectQuarter('q2')">Q2 (30 mrt - 19 jul)</button>
            <button class="quarter-btn ${currentQuarter === 'zomerstop' ? 'active' : ''}" onclick="selectQuarter('zomerstop')">Zomerstop (20 jul - 9 aug)</button>
            <button class="quarter-btn ${currentQuarter === 'q3' ? 'active' : ''}" onclick="selectQuarter('q3')">Q3 (10 aug - 30 nov)</button>
            <button class="quarter-btn ${currentQuarter === 'q4' ? 'active' : ''}" onclick="selectQuarter('q4')">Q4 (1 dec - 23 dec)</button>
        </div>
        <h2>${quarters[currentQuarter].name} - Educatief Lesplan</h2>
        <p>Klik op een dag om activiteiten te bekijken of toe te voegen</p>
        <div style="margin-top: 15px;">
            <button class="btn-primary" onclick="exportQuarterToExcel('${currentQuarter}')" style="padding: 10px 20px; font-size: 14px;">
                📥 Exporteer ${quarters[currentQuarter].name} naar Excel
            </button>
        </div>
    `;
    
    quarterGrid.innerHTML = '';
    
    // Dag headers
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        quarterGrid.appendChild(dayHeader);
    });
    
    const quarter = quarters[currentQuarter];
    const startDate = new Date(quarter.start + 'T00:00:00');
    const endDate = new Date(quarter.end + 'T00:00:00');
    
    // Bereken eerste maandag voor de grid
    const firstDay = new Date(startDate);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay() + 1);
    
    // Bereken laatste zondag voor de grid
    const lastDay = new Date(endDate);
    lastDay.setDate(lastDay.getDate() + (7 - endDate.getDay()));
    
    const today = new Date();
    const isCurrentYear = today.getFullYear() === 2026;
    
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dateStr = formatDate(date);
        const dayNumber = date.getDate();
        const quarterKey = getQuarterForDate(dateStr);
        const isInQuarter = quarterKey === currentQuarter;
        const isToday = isCurrentYear && 
                       date.getDate() === today.getDate() && 
                       date.getMonth() === today.getMonth() &&
                       date.getFullYear() === today.getFullYear();
        
        if (!isInQuarter) {
            dayElement.classList.add('other-month');
        } else if (quarterKey) {
            dayElement.classList.add(quarterKey);
        }
        
        if (isToday) {
            dayElement.classList.add('today');
        }
        
        if (quarterKey === 'zomerstop' && isInQuarter) {
            dayElement.classList.add('zomerstop');
        }
        
        dayElement.innerHTML = `<div class="day-number">${dayNumber}</div>`;
        
        if (isInQuarter) {
            const dayActivities = activities[dateStr] || [];
            const maxVisible = 3;
            
            dayActivities.slice(0, maxVisible).forEach(activity => {
                const activityElement = document.createElement('div');
                activityElement.className = `activity-item ${activity.type}`;
                activityElement.textContent = `${activity.time || ''} ${activity.title}`;
                activityElement.title = `${activity.title}\n${activity.description || ''}\nInstructeur: ${activity.instructor || 'Niet opgegeven'}`;
                activityElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showActivityDetails(activity, dateStr);
                });
                dayElement.appendChild(activityElement);
            });
            
            if (dayActivities.length > maxVisible) {
                const moreElement = document.createElement('div');
                moreElement.className = 'more-activities';
                moreElement.textContent = `+${dayActivities.length - maxVisible} meer`;
                moreElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showActivityDetails(null, dateStr);
                });
                dayElement.appendChild(moreElement);
            }
            
            if (quarterKey !== 'zomerstop') {
                dayElement.addEventListener('click', () => {
                    openActivityModal(dateStr);
                });
            }
        }
        
        quarterGrid.appendChild(dayElement);
    }
}

function selectQuarter(quarterKey) {
    currentQuarter = quarterKey;
    renderQuarterView();
}

window.selectQuarter = selectQuarter;

function exportQuarterToExcel(quarterKey) {
    const quarter = quarters[quarterKey];
    if (!quarter) return;
    
    // Verzamel alle activiteiten voor dit kwartaal
    const quarterActivities = [];
    const startDate = new Date(quarter.start + 'T00:00:00');
    const endDate = new Date(quarter.end + 'T00:00:00');
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d);
        const dayActivities = activities[dateStr] || [];
        
        dayActivities.forEach(activity => {
            quarterActivities.push({
                'Datum': formatDateDisplay(dateStr),
                'Dag': dayNames[d.getDay()],
                'Tijd': activity.time || '',
                'Type': getActivityTypeName(activity.type),
                'Titel': activity.title,
                'Beschrijving': activity.description || '',
                'Instructeur': activity.instructor || ''
            });
        });
    }
    
    // Sorteer op datum en tijd
    quarterActivities.sort((a, b) => {
        // Parse datum strings (bijv. "5 januari 2026")
        const parseDate = (dateStr) => {
            const parts = dateStr.split(' ');
            const day = parseInt(parts[0]);
            const month = monthNames.indexOf(parts[1]);
            const year = parseInt(parts[2]);
            return new Date(year, month, day);
        };
        
        const dateA = parseDate(a.Datum);
        const dateB = parseDate(b.Datum);
        
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
        }
        return (a.Tijd || '').localeCompare(b.Tijd || '');
    });
    
    // Maak werkblad
    const ws = XLSX.utils.json_to_sheet(quarterActivities);
    
    // Pas kolombreedte aan
    const colWidths = [
        { wch: 15 }, // Datum
        { wch: 5 },  // Dag
        { wch: 8 },  // Tijd
        { wch: 18 }, // Type
        { wch: 30 }, // Titel
        { wch: 40 }, // Beschrijving
        { wch: 20 }  // Instructeur
    ];
    ws['!cols'] = colWidths;
    
    // Maak werkboek
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, quarter.name);
    
    // Voeg samenvatting toe
    const summaryData = [
        ['Kwartaal:', quarter.name],
        ['Periode:', `${formatDateDisplay(quarter.start)} - ${formatDateDisplay(quarter.end)}`],
        ['Totaal activiteiten:', quarterActivities.length],
        [''],
        ['Activiteiten per type:']
    ];
    
    // Tel activiteiten per type
    const typeCounts = {};
    quarterActivities.forEach(activity => {
        typeCounts[activity.Type] = (typeCounts[activity.Type] || 0) + 1;
    });
    
    Object.keys(typeCounts).sort().forEach(type => {
        summaryData.push([type, typeCounts[type]]);
    });
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Samenvatting');
    
    // Download bestand
    const fileName = `Manege_Kalender_${quarter.name}_2026.xlsx`;
    XLSX.writeFile(wb, fileName);
}

window.exportQuarterToExcel = exportQuarterToExcel;

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadSampleActivities() {
    // Alleen laden als er nog geen activiteiten zijn
    if (Object.keys(activities).length > 0) return;

    // Educatief lesplan per kwartaal - afwisselende activiteiten
    const sampleActivities = {};
    
    // Helper functie om activiteiten toe te voegen
    function addActivity(dateStr, type, time, title, description = '', instructor = '') {
        if (!sampleActivities[dateStr]) {
            sampleActivities[dateStr] = [];
        }
        sampleActivities[dateStr].push({
            id: generateId(),
            type: type,
            time: time,
            title: title,
            description: description,
            instructor: instructor
        });
    }
    
    // Helper functie om datum te berekenen
    function getDate(year, month, day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    // Q1: 2 jan – 29 mrt - Focus op basisvaardigheden en kennis
    // Elke zaterdag: afwisselend springles, dressuurles, schriktraining
    const q1Start = new Date('2026-01-02');
    const q1End = new Date('2026-03-29');
    let q1Week = 0;
    for (let d = new Date(q1Start); d <= q1End; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateStr = formatDate(d);
        
        // Zaterdag lessen (dag 6)
        if (dayOfWeek === 6) {
            const weekType = q1Week % 3;
            if (weekType === 0) {
                addActivity(dateStr, 'springles', '10:00', 'Springles - Basis technieken', 'Basis springtechnieken en veiligheid', 'Jan de Vries');
                addActivity(dateStr, 'paardenkennis', '14:00', 'Paardenkennis - Anatomie', 'Leren over paardenanatomie en beweging', 'Maria Jansen');
            } else if (weekType === 1) {
                addActivity(dateStr, 'dressuurles', '10:00', 'Dressuurles - Basis oefeningen', 'Grondbeginselen van dressuur', 'Maria Jansen');
                addActivity(dateStr, 'theorieles', '14:00', 'Theorieles - Gedrag', 'Paardengedrag en communicatie', 'Sophie Meijer');
            } else {
                addActivity(dateStr, 'schriktraining', '10:00', 'Schriktraining - Obstakels', 'Werken aan zelfvertrouwen en rust', 'Tom Smit');
                addActivity(dateStr, 'verzorging', '14:00', 'Verzorging - Basis', 'Basis paardenverzorging en gezondheid', 'Lisa Bakker');
            }
            q1Week++;
        }
        
        // Woensdag: Ponyles voor kinderen
        if (dayOfWeek === 3) {
            addActivity(dateStr, 'ponyles', '15:00', 'Ponyles - Kinderen', 'Ponyles voor jonge ruiters', 'Lisa Bakker');
        }
    }
    
    // Q2: 30 mrt – 19 jul - Focus op verdieping en praktijk
    const q2Start = new Date('2026-03-30');
    const q2End = new Date('2026-07-19');
    let q2Week = 0;
    for (let d = new Date(q2Start); d <= q2End; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateStr = formatDate(d);
        
        // Zaterdag lessen
        if (dayOfWeek === 6) {
            const weekType = q2Week % 4;
            if (weekType === 0) {
                addActivity(dateStr, 'springles', '10:00', 'Springles - Gevorderd', 'Complexere parcours en techniek', 'Jan de Vries');
                addActivity(dateStr, 'paardenkennis', '14:00', 'Paardenkennis - Voeding', 'Voeding en verzorging van paarden', 'Maria Jansen');
            } else if (weekType === 1) {
                addActivity(dateStr, 'dressuurles', '10:00', 'Dressuurles - Gevorderd', 'Geavanceerde dressuuroefeningen', 'Maria Jansen');
                addActivity(dateStr, 'schriktraining', '14:00', 'Schriktraining - Uitdagend', 'Uitdagende schriktraining', 'Tom Smit');
            } else if (weekType === 2) {
                addActivity(dateStr, 'springles', '10:00', 'Springles - Combinaties', 'Springcombinaties en wendingen', 'Jan de Vries');
                addActivity(dateStr, 'verzorging', '14:00', 'Verzorging - Gevorderd', 'Hoeven, tanden en gezondheid', 'Sophie Meijer');
            } else {
                addActivity(dateStr, 'dressuurles', '10:00', 'Dressuurles - Finesse', 'Finesse en precisie in dressuur', 'Maria Jansen');
                addActivity(dateStr, 'theorieles', '14:00', 'Theorieles - Ruitersport', 'Geschiedenis en disciplines', 'Jan de Vries');
            }
            q2Week++;
        }
        
        // Woensdag: Ponyles
        if (dayOfWeek === 3) {
            addActivity(dateStr, 'ponyles', '15:00', 'Ponyles - Kinderen', 'Ponyles voor jonge ruiters', 'Lisa Bakker');
        }
        
        // Vrijdag: Vrij training
        if (dayOfWeek === 5) {
            addActivity(dateStr, 'training', '16:00', 'Vrij training', 'Vrije training voor gevorderden', '');
        }
    }
    
    // Q3: 10 aug – 30 nov - Focus op specialisatie en wedstrijdvoorbereiding
    const q3Start = new Date('2026-08-10');
    const q3End = new Date('2026-11-30');
    let q3Week = 0;
    for (let d = new Date(q3Start); d <= q3End; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateStr = formatDate(d);
        
        // Zaterdag lessen
        if (dayOfWeek === 6) {
            const weekType = q3Week % 4;
            if (weekType === 0) {
                addActivity(dateStr, 'springles', '10:00', 'Springles - Wedstrijdvoorbereiding', 'Voorbereiding op wedstrijden', 'Jan de Vries');
                addActivity(dateStr, 'paardenkennis', '14:00', 'Paardenkennis - Training', 'Trainingsmethoden en fysiologie', 'Maria Jansen');
            } else if (weekType === 1) {
                addActivity(dateStr, 'dressuurles', '10:00', 'Dressuurles - Wedstrijd', 'Wedstrijdvoorbereiding dressuur', 'Maria Jansen');
                addActivity(dateStr, 'schriktraining', '14:00', 'Schriktraining - Intensief', 'Intensieve schriktraining', 'Tom Smit');
            } else if (weekType === 2) {
                addActivity(dateStr, 'springles', '10:00', 'Springles - Techniek', 'Techniek en stijl verbetering', 'Jan de Vries');
                addActivity(dateStr, 'verzorging', '14:00', 'Verzorging - Wedstrijd', 'Verzorging voor wedstrijden', 'Sophie Meijer');
            } else {
                addActivity(dateStr, 'dressuurles', '10:00', 'Dressuurles - Perfectie', 'Perfectie in uitvoering', 'Maria Jansen');
                addActivity(dateStr, 'theorieles', '14:00', 'Theorieles - Reglementen', 'Wedstrijdreglementen en etiquette', 'Jan de Vries');
            }
            q3Week++;
        }
        
        // Woensdag: Ponyles
        if (dayOfWeek === 3) {
            addActivity(dateStr, 'ponyles', '15:00', 'Ponyles - Kinderen', 'Ponyles voor jonge ruiters', 'Lisa Bakker');
        }
        
        // Vrijdag: Vrij training
        if (dayOfWeek === 5) {
            addActivity(dateStr, 'training', '16:00', 'Vrij training', 'Vrije training voor gevorderden', '');
        }
        
        // Eerste zaterdag van de maand: Wedstrijd
        if (dayOfWeek === 6 && d.getDate() <= 7) {
            addActivity(dateStr, 'wedstrijd', '13:00', 'Wedstrijd', 'Regionale wedstrijd', '');
        }
    }
    
    // Q4: 1 dec – 23 dec - Focus op consolidatie en feest
    const q4Start = new Date('2026-12-01');
    const q4End = new Date('2026-12-23');
    let q4Week = 0;
    for (let d = new Date(q4Start); d <= q4End; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateStr = formatDate(d);
        
        // Zaterdag lessen
        if (dayOfWeek === 6) {
            const weekType = q4Week % 3;
            if (weekType === 0) {
                addActivity(dateStr, 'springles', '10:00', 'Springles - Consolidatie', 'Herhaling en consolidatie', 'Jan de Vries');
                addActivity(dateStr, 'paardenkennis', '14:00', 'Paardenkennis - Jaaroverzicht', 'Jaaroverzicht en evaluatie', 'Maria Jansen');
            } else if (weekType === 1) {
                addActivity(dateStr, 'dressuurles', '10:00', 'Dressuurles - Consolidatie', 'Herhaling en verbetering', 'Maria Jansen');
                addActivity(dateStr, 'schriktraining', '14:00', 'Schriktraining - Feest', 'Feestelijke schriktraining', 'Tom Smit');
            } else {
                addActivity(dateStr, 'springles', '10:00', 'Springles - Feest', 'Feestelijke les', 'Jan de Vries');
                addActivity(dateStr, 'verzorging', '14:00', 'Verzorging - Winter', 'Winterverzorging van paarden', 'Sophie Meijer');
            }
            q4Week++;
        }
        
        // Woensdag: Ponyles
        if (dayOfWeek === 3) {
            addActivity(dateStr, 'ponyles', '15:00', 'Ponyles - Kinderen', 'Ponyles voor jonge ruiters', 'Lisa Bakker');
        }
    }
    
    // Kerstwedstrijd op 21 december
    addActivity('2026-12-21', 'wedstrijd', '13:00', 'Kerstwedstrijd', 'Speciale kerstwedstrijd', '');

    // Voeg educatieve activiteiten toe
    Object.keys(sampleActivities).forEach(date => {
        if (!activities[date]) {
            activities[date] = sampleActivities[date];
        }
    });

    saveActivities();
    renderCalendar();
    renderYearView();
    if (!document.getElementById('quarterView').classList.contains('hidden')) {
        renderQuarterView();
    }
}

