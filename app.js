// Booking Dashboard - Real-time with Notes
let allBookings = [];
let lastUpdateTime = '';
let currentUser = null;

// Permission definitions
const PERMISSIONS = {
    view_bookings: 'ดูรายการจอง',
    manage_bookings: 'จัดการจอง',
    manage_users: 'จัดการผู้ใช้',
    view_reports: 'ดูรายงาน'
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    await loadWeather();
    updateLastUpdateTime();
    
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    document.getElementById('datePicker').value = formattedDate;
    
    renderBookings(formattedDate);
    
    document.getElementById('datePicker').addEventListener('change', (e) => {
        renderBookings(e.target.value);
    });
});

// Check authentication status
function checkAuth() {
    let userData = localStorage.getItem('currentUser');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (!userData) {
        userData = sessionStorage.getItem('currentUser');
    }
    
    if (userData) {
        currentUser = JSON.parse(userData);
        
        if (rememberMe && !localStorage.getItem('currentUser')) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        showUserSection();
    } else {
        showLoginSection();
    }
}

// Show user info section
function showUserSection() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('user-section').style.display = 'flex';
    
    document.getElementById('user-name').textContent = '🔹 ' + currentUser.position;
    
    applyPermissions();
}

// Show login link
function showLoginSection() {
    document.getElementById('user-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

// Apply permission-based UI
function applyPermissions() {
    const permElements = document.querySelectorAll('[data-permission]');
    permElements.forEach(el => {
        const requiredPerm = el.dataset.permission;
        if (currentUser && currentUser.permissions && currentUser.permissions.includes(requiredPerm)) {
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    });
}

// Setup logout button
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('rememberMe');
            sessionStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
}

function updateLastUpdateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}:${seconds}`;
    document.getElementById('lastUpdate').textContent = timeStr;
    lastUpdateTime = timeStr;
}

async function refreshData() {
    const btn = document.querySelector('.refresh-btn');
    btn.innerHTML = '⏳ กำลังโหลด...';
    
    try {
        await loadData();
        updateLastUpdateTime();
        
        const selectedDate = document.getElementById('datePicker').value;
        renderBookings(selectedDate);
        
        btn.innerHTML = '✓ สำเร็จ!';
        setTimeout(() => {
            btn.innerHTML = '🔄 รีเฟรช';
        }, 1500);
    } catch (error) {
        btn.innerHTML = '❌ ผิดพลาด';
        setTimeout(() => {
            btn.innerHTML = '🔄 รีเฟรช';
        }, 2000);
    }
}

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
        document.getElementById('condition').textContent = 'ไม่ทราบ';
    }
}

async function loadData() {
    try {
        const response = await fetch('./data.json');
        allBookings = await response.json();
        console.log('Loaded bookings:', allBookings.length);
    } catch (error) {
        console.error('Error loading:', error);
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

function renderBookings(selectedDate) {
    const container = document.getElementById('bookingsList');
    
    console.log('Selected date:', selectedDate);
    console.log('Total bookings:', allBookings.length);
    
    if (!selectedDate) {
        container.innerHTML = '<p class="no-data">กรุณาเลือกวันที่</p>';
        return;
    }
    
    const filtered = allBookings.filter(booking => {
        const bookingDate = convertToStandardDate(booking.date);
        console.log('Comparing:', bookingDate, 'vs', selectedDate);
        return bookingDate === selectedDate && booking.room && booking.room.trim() !== '';
    });
    
    console.log('Filtered:', filtered.length);
    
    if (filtered.length === 0) {
        container.innerHTML = `<p class="no-data">ไม่มีรายการจองในวันที่ ${formatDisplayDate(selectedDate.replace(/-/g, '/'))}</p>`;
        document.getElementById('totalRooms').textContent = '0';
        return;
    }
    
    document.getElementById('totalRooms').textContent = filtered.length;
    
    let html = '';
    
    filtered.forEach((booking, index) => {
        const remarkHtml = booking.remark ? 
            `<div class="detail-item remark">📝 ${booking.remark}</div>` : '';
        
        const nameDisplay = booking.name && booking.name.trim() ? booking.name : 'ไม่ได้ใส่ชื่อผู้จอง';
        
        const separator = index > 0 ? '<div class="room-separator"></div>' : '';
        
        html += separator + `
            <div class="booking-card">
                <div class="booking-header">
                    <span class="room-badge">${booking.room}</span>
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
