function register() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const user = { name, email, pass, path: 'المسار التجريبي', progress: 20 };
    localStorage.setItem('intaliqUser', JSON.stringify(user));
    window.location.href = 'thanks.html';
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    const stored = JSON.parse(localStorage.getItem('intaliqUser'));
    if (stored && stored.email === email && stored.pass === pass) {
        window.location.href = 'dashboard.html';
    } else {
        alert('بيانات غير صحيحة');
    }
}

function logout() {
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
                borderColor: '#6366f1',
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

if (document.getElementById('chart')) {
    loadDashboard();
}
