// Countdown Timer
// Set your launch date here
const launchDate = new Date('2026-06-01T00:00:00').getTime();

function updateCountdown() {
    var now = new Date().getTime();
    var diff = launchDate - now;

    if (diff <= 0) {
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        return;
    }

    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

// Email Notification Forms (hero + bottom CTA)
function setupForm(formId, inputId, msgId) {
    var form = document.getElementById(formId);
    var msg = document.getElementById(msgId);
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = document.getElementById(inputId).value.trim();
        if (!email) return;

        msg.classList.add('show');
        form.reset();

        setTimeout(function () {
            msg.classList.remove('show');
        }, 5000);

        // TODO: Replace with your actual API endpoint
        // fetch('https://api.rentage.in/waitlist', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email: email })
        // });
    });
}

setupForm('notifyForm', 'emailInput', 'successMsg');
setupForm('notifyForm2', 'emailInput2', 'successMsg2');

// Scroll-triggered fade-in animation
var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.category-card, .feature-card, .pricing-card, .step-card').forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
});
