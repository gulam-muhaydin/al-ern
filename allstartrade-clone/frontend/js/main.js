document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const btn = document.getElementById('menu-btn');
    const nav = document.getElementById('mobile-menu');

    if (btn && nav) {
        btn.addEventListener('click', () => {
            nav.classList.toggle('hidden');
            nav.classList.toggle('flex');
        });
    }

    // Preloader Logic (if present)
    const preloader = document.getElementById("preloader");
    if (preloader) {
        window.addEventListener("load", () => {
            setTimeout(() => {
                preloader.style.cssText = `opacity: 0; visibility: hidden;`;
            }, 1000);
        });
    }
});
