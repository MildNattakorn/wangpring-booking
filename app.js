// Booking Dashboard - Real-time with Notes from Google Sheets
let allBookings = [];
let allNotes = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    await loadNotes();
    await loadWeather();
    
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    document.getElementById('datePicker').value = formattedDate;
    
    renderBookings(formattedDate);
    
    document.getElementById('datePicker').addEventListener('change', (e) => {
        renderBookings(e.target.value);
    });
});

async function loadWeather() {
    try {
        const response = await fetch('https://wttr.in/Thung+Song,Nakhon+Si+Thammarat?format=j1');
        const data = await response.json();
        
        if (data.current_condition && data.current_condition[0]) {
            const current = data.current_condition[0];
            const temp = current.temp_C;
            const condition = current.weatherDesc[0].value;
            
            document.getElementById('temp').textContent = temp + '°C';
            document.getElementById('condition').textContent = condition;
            
            const icon = document.getElementById('weatherIcon');
            const lowerCond = condition.toLowerCase();
            if (lowerCond.includes('sun') || lowerCond.includes('clear')) {
                icon.textContent = '☀️';
            } else if (lowerCond.includes('cloud') || lowerCond.includes('overcast')) {
                icon.textContent = '⛅';
            } else if (lowerCond.includes('rain') || lowerCond.includes('drizzle')) {
                icon.textContent = '🌧️';
            } else if (lowerCond.includes('thunder') || lowerCond.includes('storm')) {
                icon.textContent = '⛈️';
            } else if (lowerCond.includes('fog') || lowerCond.includes('mist')) {
                icon.textContent = '🌫️';
            }
        }
    } catch (error) {
        console.error('Weather error:', error);
        document.getElementById('condition').textContent = 'ไม่ทราบ';
    }
}

async function loadNotes() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/1DrzX4RmtY63kVHWUCXwO89Jbcq4zTF2HAdEY-7QKJ6Y/gviz/tq?tqx=out:json&sheet=Notes');
        const text = await response.text();
        
        // Parse JSON from Google Sheets format
        const jsonMatch = text.match(/\{.*\}/);
        if (jsonMatch) {
            const json = JSON.parse(jsonMatch[0]);
            if (json.table && json.table.rows) {
                json.table.rows.forEach((row, index) => {
                    if (index === 0) return; // Skip header
                    const date = row.c[0]?.v;
                    const room = row.c[1]?.v;
                    const note = row.c[2]?.v;
                    if (date && room && note) {
                        const key = `${date}_${room}`;
                        allNotes[key] = note;
                    }
                });
            }
        }
        console.log('Loaded notes:', Object.keys(allNotes).length);
    } catch (error) {
        console.error('Notes error:', error);
    }
}

async function loadData() {
    try {
        const response = await fetch('./data.json');
        allBookings = await response.json();
    } catch (error) {
        document.getElementById('bookingsList').innerHTML = '<p class="no-data">ไม่สามารถโหลดข้อมูลได้</p>';
    }
}

function formatDateForInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function convertToStandardDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parseInt(parts[2]);
        return `${year}-${month}-${day}`;
    }
    return '';
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return `${parseInt(parts[0])} ${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}`;
}

function getNoteKey(booking, selectedDate) {
    return `${selectedDate}_${booking.room}`;
}

function renderBookings(selectedDate) {
    const container = document.getElementById('bookingsList');
    
    if (!selectedDate) {
        container.innerHTML = '<p class="no-data">กรุณาเลือกวันที่</p>';
        return;
    }
    
    const filtered = allBookings.filter(booking => {
        const bookingDate = convertToStandardDate(booking.date);
        return bookingDate === selectedDate;
    });
    
    const validBookings = filtered.filter(b => b.room && b.room.trim() !== '');
    
    if (validBookings.length === 0) {
        container.innerHTML = `<p class="no-data">ไม่มีรายการจองในวันที่ ${formatDisplayDate(selectedDate.replace(/-/g, '/'))}</p>`;
        document.getElementById('totalRooms').textContent = '0';
        return;
    }
    
    document.getElementById('totalRooms').textContent = validBookings.length;
    
    let html = '';
    
    validBookings.forEach(booking => {
        const noteKey = getNoteKey(booking, selectedDate);
        const note = allNotes[noteKey] || '';
        const hasNote = note && note.trim() !== '';
        
        const remarkHtml = booking.remark ? 
            `<div class="detail-item remark">📝 ${booking.remark}</div>` : '';
        
        const nameDisplay = booking.name && booking.name.trim() ? booking.name : 'ไม่ได้ใส่ชื่อผู้จอง';
        
        const noteSection = hasNote 
            ? `<div class="note-section"><span class="note-indicator">📝 มีโน๊ต</span></div>`
            : '';
        
        html += `
            <div class="booking-card">
                <div class="booking-header">
                    <span class="room-badge">${booking.room || '-'}</span>
                    <span class="booking-name">${nameDisplay}</span>
                </div>
                <div class="booking-details">
                    <div class="detail-item">💰 มัดจำ: ${parseInt(booking.deposit || 0).toLocaleString()} บาท</div>
                    <div class="detail-item">👥 จำนวน: ${booking.people || '-'}</div>
                    ${remarkHtml}
                </div>
                ${noteSection}
            </div>
        `;
    });
    
    container.innerHTML = html;
}
