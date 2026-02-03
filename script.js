// Theme Management
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const icon = themeToggle ? themeToggle.querySelector('i') : null;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.classList.add(savedTheme);
    updateIcon(savedTheme);
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        const currentTheme = body.classList.contains('dark-theme') ? 'dark-theme' : '';
        localStorage.setItem('theme', currentTheme);
        updateIcon(currentTheme);
    });
}

function updateIcon(theme) {
    if (!icon) return;
    if (theme === 'dark-theme') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Typing animation for section headers
function typeText(el, speed = 50) {
    const text = el.textContent;
    el.textContent = "";
    let i = 0;

    const interval = setInterval(() => {
        el.textContent += text.charAt(i);
        i++;
        if (i >= text.length) clearInterval(interval);
    }, speed);
}

window.addEventListener("load", function () {
    setTimeout(() => {
        // Hide loader and show main content
        const loader = document.getElementById("loader");
        const mainContent = document.getElementById("main-content");

        if (loader) loader.style.display = "none";
        if (mainContent) mainContent.style.display = "block";

        // Scroll to top
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: "instant" });
        });

        // Apply typing effect to all section h2s with class 'typewrite'
        document.querySelectorAll("section h2.typewrite").forEach((el, i) => {
            setTimeout(() => typeText(el), i * 300); // staggered animation per section
        });

        // Set staggered animation delays for project cards
        document.querySelectorAll(".project-card").forEach((card, index) => {
            card.style.setProperty('--card-index', index);
        });

        // ACTIVE NAVIGATION STATE
        const sections = document.querySelectorAll("section");
        const navLinks = document.querySelectorAll("nav a");

        const observerOptions = {
            root: null,
            rootMargin: "-20% 0px -60% 0px", // Trigger when section is near center
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute("id");
                    navLinks.forEach(link => {
                        link.classList.remove("active");
                        if (link.getAttribute("href") === `#${id}`) {
                            link.classList.add("active");
                        }
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));

        // Handle bottom of page case for Contact section
        window.addEventListener('scroll', () => {
            if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50) {
                navLinks.forEach(link => link.classList.remove('active'));
                const contactLink = document.querySelector('nav a[href="#contact"]');
                if (contactLink) contactLink.classList.add('active');
            }
        });

        // PROJECT FILTERING
        const filterBtns = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card-link');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                projectCards.forEach(card => {
                    if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.querySelector('.project-card').style.opacity = '1';
                            card.querySelector('.project-card').style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        card.style.display = 'none';
                        card.querySelector('.project-card').style.opacity = '0';
                        card.querySelector('.project-card').style.transform = 'translateY(20px)';
                    }
                });
            });
        });

    }, 1000); // Loader delay
});
