// Booking Dashboard - Real-time
let allBookings = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    await loadWeather();
    
    // Set today's date
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    document.getElementById('datePicker').value = formattedDate;
    
    // Show today's bookings
    renderBookings(formattedDate);
    
    // Add event listener
    document.getElementById('datePicker').addEventListener('change', (e) => {
        renderBookings(e.target.value);
    });
});

async function loadWeather() {
    try {
        // Using wttr.in - free weather API (no key required)
// Thung Song district, Nakhon Si Thammarat province
        const response = await fetch('https://wttr.in/Thung+Song,Nakhon+Si+Thammarat?format=j1');
        const data = await response.json();
        
        if (data.current_condition && data.current_condition[0]) {
            const current = data.current_condition[0];
            const temp = current.temp_C;
            const condition = current.weatherDesc[0].value;
            
            // Update UI
            document.getElementById('temp').textContent = temp + '°C';
            document.getElementById('condition').textContent = condition;
            
            // Set icon based on condition
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

async function loadData() {
    try {
        const response = await fetch('./data.json');
        allBookings = await response.json();
        console.log('Loaded:', allBookings.length, 'bookings');
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('bookingsList').innerHTML = 
            '<p class="no-data">ไม่สามารถโหลดข้อมูลได้</p>';
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
    
    // Input: DD/MM/YYYY
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
    
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                   'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return `${parseInt(parts[0])} ${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}`;
}

function renderBookings(selectedDate) {
    const container = document.getElementById('bookingsList');
    
    if (!selectedDate) {
        container.innerHTML = '<p class="no-data">กรุณาเลือกวันที่</p>';
        return;
    }
    
    // Filter by date
    const filtered = allBookings.filter(booking => {
        const bookingDate = convertToStandardDate(booking.date);
        return bookingDate === selectedDate;
    });
    
    // Filter - must have room
    const validBookings = filtered.filter(b => b.room && b.room.trim() !== '');
    
    if (validBookings.length === 0) {
        container.innerHTML = `<p class="no-data">ไม่มีรายการจองในวันที่ ${formatDisplayDate(selectedDate.replace(/-/g, '/'))}</p>`;
        document.getElementById('totalRooms').textContent = '0';
        return;
    }
    
    // Show total rooms
    document.getElementById('totalRooms').textContent = validBookings.length;
    
    // Generate HTML - with remark
    let html = '';
    
    validBookings.forEach(booking => {
        const remarkHtml = booking.remark ? 
            `<div class="detail-item remark">📝 ${booking.remark}</div>` : '';
        
        const nameDisplay = booking.name && booking.name.trim() ? booking.name : 'ไม่ได้ใส่ชื่อผู้จอง';
        
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
            </div>
        `;
    });
    
    container.innerHTML = html;
}
