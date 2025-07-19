function toggleForms() {
    const reg = document.getElementById('registerForm');
    const log = document.getElementById('loginForm');
    if (reg.classList.contains('hidden')) {
        reg.classList.remove('hidden');
        log.classList.add('hidden');
    } else {
        reg.classList.add('hidden');
        log.classList.remove('hidden');
    }
}

function register() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    const user = {name, email, pass, path: 'المسار التجريبي', progress: 20};
    localStorage.setItem('intaliqUser', JSON.stringify(user));
    window.location.href = 'thankyou.html';
}

function login() {
    const name = document.getElementById('loginName').value;
    const pass = document.getElementById('loginPass').value;
    const stored = JSON.parse(localStorage.getItem('intaliqUser'));
    if (stored && stored.name === name && stored.pass === pass) {
        window.location.href = 'dashboard.html';
    } else {
        alert('بيانات غير صحيحة');
    }
}

function logout() {
    // simple logout
    window.location.href = 'index.html';
}

function loadDashboard() {
    const user = JSON.parse(localStorage.getItem('intaliqUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userPath').textContent = user.path;
    const bar = document.getElementById('progressBar');
    bar.style.width = user.progress + '%';

    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['أبريل', 'مايو', 'يونيو', 'يوليو'],
            datasets: [{
                label: 'الأداء',
                data: [3, 5, 2, 8],
                borderColor: '#3498db',
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Run dashboard setup if on that page
if (document.getElementById('chart')) {
    loadDashboard();
}
