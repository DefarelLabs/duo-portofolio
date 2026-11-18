lucide.createIcons();

/* -------------------------------------------------------------------
   0. WEB AUDIO API: SYNTHETIC GAME LOBBY & UI MOTION SOUND FX
------------------------------------------------------------------- */
let audioCtx = null;

function playLobbySound(type = 'select') {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        if (type === 'enter') {
            // Deep Bass + Rising Sci-Fi Lobby Deploy Chord
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(740, now + 0.48);

            gain.gain.setValueAtTime(0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.55);
        } else {
            // Crisp Tactical HUD Click
            osc.type = 'sine';
            osc.frequency.setValueAtTime(540, now);
            osc.frequency.exponentialRampToValueAtTime(920, now + 0.08);

            gain.gain.setValueAtTime(0.035, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        }
    } catch (e) {}
}

/* -------------------------------------------------------------------
   1. GLOBAL CURSOR MOTION TRAIL + SHOCKWAVE CLICK RIPPLE
------------------------------------------------------------------- */
const trailCanvas = document.getElementById('motion-trail-canvas');
const trailCtx = trailCanvas.getContext('2d');
let trailPoints = [];
let burstSparks = [];

function resizeTrailCanvas() {
    if (!trailCanvas) return;
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeTrailCanvas);
resizeTrailCanvas();

window.addEventListener('mousemove', (e) => {
    // Update tactical reticle
    const cursor = document.getElementById('tactical-cursor');
    if (cursor) {
        cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }

    // Record cursor motion trail points
    trailPoints.push({
        x: e.clientX,
        y: e.clientY,
        life: 1.0
    });
    if (trailPoints.length > 24) {
        trailPoints.shift();
    }

    // Emit subtle micro-sparks on fast mouse movement
    if (Math.random() > 0.45) {
        burstSparks.push({
            x: e.clientX,
            y: e.clientY,
            vx: (Math.random() - 0.5) * 1.8,
            vy: (Math.random() - 0.5) * 1.8,
            size: Math.random() * 2 + 0.8,
            life: 1.0
        });
    }
});

// Click Shockwave + Particle Burst
window.addEventListener('click', (e) => {
    const wave = document.createElement('div');
    wave.className = 'click-shockwave';
    wave.style.left = `${e.clientX}px`;
    wave.style.top = `${e.clientY}px`;
    document.body.appendChild(wave);
    setTimeout(() => wave.remove(), 620);

    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10;
        const speed = Math.random() * 3.5 + 1.5;
        burstSparks.push({
            x: e.clientX,
            y: e.clientY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 2.5 + 1,
            life: 1.0
        });
    }
});

function renderMotionTrail() {
    trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

    // Draw smooth neon ribbon trail following cursor
    if (trailPoints.length > 1) {
        for (let i = 1; i < trailPoints.length; i++) {
            const p1 = trailPoints[i - 1];
            const p2 = trailPoints[i];
            trailCtx.beginPath();
            trailCtx.moveTo(p1.x, p1.y);
            trailCtx.lineTo(p2.x, p2.y);
            trailCtx.strokeStyle = `rgba(56, 189, 248, ${p2.life * 0.42})`;
            trailCtx.lineWidth = p2.life * 4;
            trailCtx.lineCap = 'round';
            trailCtx.stroke();
        }
    }

    // Decay trail points
    for (let i = trailPoints.length - 1; i >= 0; i--) {
        trailPoints[i].life -= 0.055;
        if (trailPoints[i].life <= 0) trailPoints.splice(i, 1);
    }

    // Draw & decay sparks
    for (let i = burstSparks.length - 1; i >= 0; i--) {
        const s = burstSparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.04;
        if (s.life <= 0) {
            burstSparks.splice(i, 1);
            continue;
        }
        trailCtx.beginPath();
        trailCtx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        trailCtx.fillStyle = `rgba(56, 189, 248, ${s.life * 0.85})`;
        trailCtx.fill();
    }

    requestAnimationFrame(renderMotionTrail);
}
renderMotionTrail();

/* -------------------------------------------------------------------
   2. WELCOME EXPERIENCE PARTICLE CANVAS & LOBBY DEPLOY FX
------------------------------------------------------------------- */
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationFrameId;
let mouse = { x: null, y: null, radius: 145 };
let isWarping = false;

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.2 + 0.8;
        this.vx = (Math.random() - 0.5) * 0.9;
        this.vy = (Math.random() - 0.5) * 0.9;
        this.color = Math.random() > 0.4 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(30, 64, 175, 0.95)';
    }

    update() {
        if (isWarping) {
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            this.x += (this.x - cx) * 0.16;
            this.y += (this.y - cy) * 0.16;
            this.size += 0.2;
            return;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
                const force = (mouse.radius - dist) / mouse.radius;
                this.x -= (dx / dist) * force * 2.6;
                this.y -= (dy / dist) * force * 2.6;
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 12500), 105);
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function connectParticles() {
    if (isWarping) return;
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x;
            const dy = particles[a].y - particles[b].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 135) {
                const opacity = 1 - dist / 135;
                ctx.strokeStyle = `rgba(56, 189, 248, ${opacity * 0.26})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    connectParticles();
    animationFrameId = requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function enterExperience() {
    const overlay = document.getElementById('welcome-overlay');
    const flash = document.getElementById('lobby-flash');
    const statusText = document.getElementById('lobby-status-text');
    if (!overlay || overlay.classList.contains('lobby-warp-out')) return;

    playLobbySound('enter');
    isWarping = true;
    if (statusText) statusText.textContent = 'DEPLOYING INTO ARENA // 3... 2... 1...';

    if (flash) {
        flash.classList.remove('lobby-flash-active');
        void flash.offsetWidth;
        flash.classList.add('lobby-flash-active');
    }

    setTimeout(() => {
        overlay.classList.add('lobby-warp-out');
        document.body.classList.add('lobby-entered');
    }, 220);

    // Trigger landing impact shake when characters drop into the lobby
    setTimeout(() => {
        document.body.classList.add('impact-shake');
        setTimeout(() => document.body.classList.remove('impact-shake'), 500);
    }, 680);

    setTimeout(() => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        isWarping = false;
        if (statusText) statusText.textContent = 'MATCHMAKING COMPLETE // SQUAD READY';
    }, 1150);
}

function reopenSplash() {
    const overlay = document.getElementById('welcome-overlay');
    if (overlay) {
        playLobbySound('select');
        isWarping = false;
        document.body.classList.remove('lobby-entered');
        overlay.classList.remove('lobby-warp-out');
        resizeCanvas();
        animateParticles();
    }
}

window.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('welcome-overlay');
    if (e.key === 'Enter' && overlay && !overlay.classList.contains('lobby-warp-out')) {
        enterExperience();
    }
    if (e.key === 'Escape') closeModal();
});

resizeCanvas();
animateParticles();

/* -------------------------------------------------------------------
   3. 3D PERSPECTIVE TILT & HOLOGRAPHIC GLARE ON CARDS
------------------------------------------------------------------- */
function bindTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach(card => {
        if (card.dataset.tiltBound) return;
        card.dataset.tiltBound = 'true';

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -6.5;
            const rotateY = ((x - centerX) / centerX) * 6.5;

            card.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
            card.style.setProperty('--my', `${(y / rect.height) * 100}%`);
            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });
}

/* -------------------------------------------------------------------
   4. SCROLL VELOCITY KINETIC MOTION & PARALLAX ORBS
------------------------------------------------------------------- */
let lastScrollY = window.scrollY;
let scrollVelocity = 0;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    scrollVelocity = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    // Update Top HUD Scroll Bar & Telemetry
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(Math.round((currentScrollY / docHeight) * 100), 100) : 0;
    const bar = document.getElementById('hud-scroll-bar');
    const pctEl = document.getElementById('hud-scroll-pct');
    const velEl = document.getElementById('hud-scroll-vel');

    if (bar) bar.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (velEl) {
        const absVel = Math.min(Math.abs(Math.round(scrollVelocity)), 99);
        velEl.textContent = absVel > 1 ? `${absVel} PX/F` : 'IDLE';
    }

    // Parallax background orbs
    document.querySelectorAll('.parallax-orb').forEach(orb => {
        const speed = parseFloat(orb.dataset.parallax || 0.1);
        orb.style.transform = `translate3d(0, ${currentScrollY * speed}px, 0)`;
    });

    // Subtle kinetic skew on grids
    const clampedSkew = Math.max(Math.min(scrollVelocity * 0.045, 2.2), -2.2);
    document.querySelectorAll('.scroll-kinetic').forEach(el => {
        el.style.transform = `skewY(${clampedSkew}deg)`;
    });
}, { passive: true });

setInterval(() => {
    if (Math.abs(scrollVelocity) > 0.1) {
        scrollVelocity *= 0.8;
        if (Math.abs(scrollVelocity) < 0.2) {
            scrollVelocity = 0;
            const velEl = document.getElementById('hud-scroll-vel');
            if (velEl) velEl.textContent = 'IDLE';
            document.querySelectorAll('.scroll-kinetic').forEach(el => {
                el.style.transform = 'skewY(0deg)';
            });
        }
    }
}, 50);

/* -------------------------------------------------------------------
   5. INTERACTIVE IDENTITY SWITCHER (RAFLY <-> DEFAREL)
------------------------------------------------------------------- */
const identities = {
    rafly: {
        displayName: 'Muhammad<br>Rafly Isman<span class="text-skyblue">.</span>',
        badge: 'S1 INFORMATIKA • INFRASTRUCTURE & SECURITY',
        fullname: 'Muhammad Rafly Isman — Network & Cloud Specialist',
        summary: 'Berfokus pada arsitektur jaringan skala enterprise, virtualisasi server, otomasi cloud, serta pertahanan keamanan siber berbasis lab dan pengalaman infrastruktur nyata.',
        pillars: [
            { icon: 'server', text: 'Routing, Switching, VLAN & Enterprise Network Lab (Cisco/MikroTik)' },
            { icon: 'cloud', text: 'Linux Server Administration, Docker & Cloud Deployment' },
            { icon: 'shield-check', text: 'Firewall Hardening, Network Monitoring & Cybersecurity' }
        ],
        cardLabel: 'LOADOUT // MUHAMMAD RAFLY ISMAN',
        cardTitle: 'Infrastructure & Security Engineering',
        cardText: 'Fokus pada keandalan jaringan, Linux server, dan keamanan infrastruktur untuk menopang aplikasi modern.'
    },
    defarel: {
        displayName: 'Defarel<br>Permana<span class="text-skyblue">.</span>',
        badge: 'S1 SISTEM INFORMASI • IS & FRONT-END DEV',
        fullname: 'Defarel Permana — Systems Analyst & Front-End Dev.',
        summary: 'Menggabungkan analisis proses bisnis dengan rekayasa antarmuka web modern untuk menghasilkan sistem informasi yang terstruktur, efisien, dan berorientasi pengguna.',
        pillars: [
            { icon: 'database', text: 'Information Systems Analysis, BPMN & Database Design (SQL)' },
            { icon: 'layout', text: 'Modern Front-End Engineering (Tailwind CSS, JS & UI/UX)' },
            { icon: 'briefcase', text: 'Business Technology Integration & Digital Workflow' }
        ],
        cardLabel: 'LOADOUT // DEFAREL PERMANA',
        cardTitle: 'Information Systems & Digital Experience',
        cardText: 'Menjembatani logika bisnis, arsitektur basis data, dan antarmuka web intuitif yang siap dipakai pengguna.'
    }
};

let currentIdentity = 'rafly';

function selectIdentity(key) {
    playLobbySound('select');
    currentIdentity = key;
    const data = identities[key];

    const heroName = document.getElementById('hero-display-name');
    const detailBox = document.getElementById('identity-detail-box');
    heroName.innerHTML = data.displayName;
    document.getElementById('id-badge').textContent = data.badge;
    document.getElementById('id-fullname').textContent = data.fullname;
    document.getElementById('id-summary').textContent = data.summary;

    const pillarsHtml = data.pillars.map(p => `
        <div class="flex items-center gap-2.5">
            <i data-lucide="${p.icon}" class="w-4 h-4 text-skyblue shrink-0"></i>
            <span>${p.text}</span>
        </div>
    `).join('');
    document.getElementById('id-pillars').innerHTML = pillarsHtml;

    document.getElementById('about-card-label').textContent = data.cardLabel;
    document.getElementById('about-card-title').textContent = data.cardTitle;
    document.getElementById('about-card-text').textContent = data.cardText;

    detailBox.classList.remove('hud-switch-anim');
    void detailBox.offsetWidth;
    detailBox.classList.add('hud-switch-anim');

    const btnRafly = document.getElementById('btn-select-rafly');
    const btnDefarel = document.getElementById('btn-select-defarel');
    const cardRafly = document.getElementById('card-rafly');
    const cardDefarel = document.getElementById('card-defarel');
    const statusRafly = document.getElementById('status-rafly');
    const statusDefarel = document.getElementById('status-defarel');

    if (key === 'rafly') {
        btnRafly.className = 'px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 bg-royalblue text-white shadow-md cursor-pointer';
        btnDefarel.className = 'px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 text-slate-400 hover:text-white cursor-pointer';
        cardRafly.classList.add('active-card');
        cardRafly.classList.remove('inactive-card');
        cardDefarel.classList.remove('active-card');
        cardDefarel.classList.add('inactive-card');
        statusRafly.textContent = '● SELECTED PLAYER';
        statusRafly.className = 'text-emerald-400';
        statusDefarel.textContent = '○ CLICK TO SELECT';
        statusDefarel.className = 'text-skyblue';
    } else {
        btnDefarel.className = 'px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 bg-royalblue text-white shadow-md cursor-pointer';
        btnRafly.className = 'px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 text-slate-400 hover:text-white cursor-pointer';
        cardDefarel.classList.add('active-card');
        cardDefarel.classList.remove('inactive-card');
        cardRafly.classList.remove('active-card');
        cardRafly.classList.add('inactive-card');
        statusDefarel.textContent = '● SELECTED PLAYER';
        statusDefarel.className = 'text-emerald-400';
        statusRafly.textContent = '○ CLICK TO SELECT';
        statusRafly.className = 'text-skyblue';
    }

    lucide.createIcons();
}

function nextIdentity() {
    selectIdentity(currentIdentity === 'rafly' ? 'defarel' : 'rafly');
}
function prevIdentity() {
    selectIdentity(currentIdentity === 'rafly' ? 'defarel' : 'rafly');
}

/* -------------------------------------------------------------------
   6. DOCUMENTATION GALLERY DATA & RENDERING
------------------------------------------------------------------- */
const galleryItems = [
    {
        id: 1,
        category: 'network',
        tag: 'SIMULASI JARINGAN & LAB',
        owner: 'Muhammad Rafly Isman',
        title: 'Enterprise Multi-VLAN & OSPF Lab Topology',
        desc: 'Simulasi arsitektur jaringan kampus/perusahaan menggunakan Router Core, Distribution Switch, segmentasi VLAN departemen, serta dynamic routing OSPF dengan failover link.',
        specs: ['Tools: Cisco Packet Tracer / GNS3', 'Protokol: IEEE 802.1Q VLAN, OSPF, DHCP Relay, ACL', 'Hasil: Konvergensi routing < 2 detik tanpa packet loss'],
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 2,
        category: 'work',
        tag: 'HASIL KERJA & UI/UX',
        owner: 'Defarel Permana',
        title: 'Information System Wireframe & ERP Dashboard',
        desc: 'Perancangan alur proses bisnis (BPMN) dan antarmuka dashboard manajemen inventaris & transaksi terintegrasi dengan fokus pada kecepatan input dan kejelasan visual.',
        specs: ['Tools: Figma, Tailwind CSS, JavaScript', 'Artefak: Use Case, ERD 3NF, High-Fidelity Prototype', 'Hasil: Pengurangan langkah input operasional hingga 40%'],
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 3,
        category: 'network',
        tag: 'CLOUD & SERVER DEPLOYMENT',
        owner: 'Muhammad Rafly Isman',
        title: 'Linux VPS Hardening & Docker Reverse Proxy',
        desc: 'Konfigurasi server produksi berbasis Ubuntu Server menggunakan kontainerisasi Docker, Nginx Reverse Proxy, SSL/TLS otomatis, dan firewall UFW.',
        specs: ['Stack: Ubuntu Linux, Docker Compose, Nginx, UFW', 'Keamanan: SSH Key-Only Auth, Fail2Ban, HTTPS Enforcement', 'Hasil: Uptime stabil 99.9% untuk hosting aplikasi kolaborasi'],
        image: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 4,
        category: 'certificate',
        tag: 'SERTIFIKAT & KOMPETENSI',
        owner: 'Muhammad Rafly Isman',
        title: 'Networking, Linux & Cloud Fundamentals Certification',
        desc: 'Dokumentasi pencapaian pembelajaran terstruktur pada bidang administrasi jaringan komputer, sistem operasi Linux, dan keamanan infrastruktur dasar.',
        specs: ['Bidang: Computer Networking, Linux Essentials, Cloud Infra', 'Verifikasi: Kredensial Pelatihan & Praktikum Lab', 'Status: Terverifikasi & Diaplikasikan pada Proyek'],
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 5,
        category: 'certificate',
        tag: 'SERTIFIKAT & BELAJAR',
        owner: 'Defarel Permana',
        title: 'Systems Analysis, SQL & Front-End Web Certification',
        desc: 'Sertifikasi kompetensi perancangan basis data relasional, analisis kebutuhan perangkat lunak, serta pengembangan web responsif modern.',
        specs: ['Bidang: Database Design, Front-End Web Dev, UI/UX', 'Verifikasi: Studi Kasus & Evaluasi Proyek Akhir', 'Status: Terverifikasi & Diaplikasikan pada Proyek'],
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 6,
        category: 'work',
        tag: 'AKTIVITAS KOLABORASI',
        owner: 'DUO//SYNC (Rafly × Defarel)',
        title: 'End-to-End Architecture & Sprint Sync Session',
        desc: 'Dokumentasi sesi sinkronisasi arsitektur antara tim infrastruktur dan tim sistem informasi: menghubungkan API front-end ke server Linux yang diamankan.',
        specs: ['Kolaborasi: Integration Testing & Deployment Pipeline', 'Metode: Agile Sprint, Git Version Control, Live Demo', 'Output: Platform Portofolio & Sistem Monitoring Terpadu'],
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80'
    }
];

function renderGallery(filter = 'all') {
    const track = document.getElementById('gallery-track');
    const filtered = filter === 'all' ? galleryItems : galleryItems.filter(item => item.category === filter);

    track.innerHTML = filtered.map(item => `
        <article onclick="openGalleryModal(${item.id})" class="tilt-card snap-start shrink-0 w-[300px] sm:w-[370px] rounded-3xl bg-deepnavy/90 border border-white/10 hover:border-skyblue/60 overflow-hidden group cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-xl">
            <div>
                <div class="relative h-48 w-full overflow-hidden bg-obsidian">
                    <img src="${item.image}" alt="${item.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-deepnavy via-deepnavy/20 to-transparent"></div>
                    <span class="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-obsidian/85 backdrop-blur-md border border-skyblue/30 font-mono text-[10px] text-skyblue">
                        ${item.tag}
                    </span>
                    <span class="absolute bottom-3 right-3.5 w-8 h-8 rounded-full bg-royalblue/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <i data-lucide="maximize-2" class="w-4 h-4"></i>
                    </span>
                </div>
                <div class="p-6">
                    <div class="font-mono text-[11px] text-skyblue mb-1.5">${item.owner}</div>
                    <h3 class="text-lg font-bold text-white mb-2 group-hover:text-skyblue transition-colors leading-snug">${item.title}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed line-clamp-3">${item.desc}</p>
                </div>
            </div>
            <div class="px-6 pb-5 pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/5">
                <span>Klik untuk inspeksi detail</span>
                <span class="text-skyblue">EVIDENCE →</span>
            </div>
        </article>
    `).join('');

    lucide.createIcons();
    bindTiltCards();
}

function filterGallery(category, btn) {
    playLobbySound('select');
    document.querySelectorAll('.gallery-filter-btn').forEach(b => {
        b.className = 'gallery-filter-btn px-4 py-2 rounded-full text-xs font-semibold bg-deepnavy text-slate-300 border border-white/10 hover:border-skyblue/40 transition cursor-pointer';
    });
    btn.className = 'gallery-filter-btn active px-4 py-2 rounded-full text-xs font-semibold bg-royalblue text-white border border-royalblue transition cursor-pointer';
    renderGallery(category);
}

function scrollGallery(direction) {
    playLobbySound('select');
    const track = document.getElementById('gallery-track');
    track.scrollBy({ left: direction * 390, behavior: 'smooth' });
}

function openGalleryModal(id) {
    playLobbySound('select');
    const item = galleryItems.find(g => g.id === id);
    if (!item) return;

    document.getElementById('modal-img').src = item.image;
    document.getElementById('modal-tag').textContent = item.tag;
    document.getElementById('modal-owner').textContent = item.owner;
    document.getElementById('modal-date').textContent = 'DOCUMENTED EVIDENCE';
    document.getElementById('modal-title').textContent = item.title;
    document.getElementById('modal-desc').textContent = item.desc;
    document.getElementById('modal-specs').innerHTML = item.specs.map(s => `<div>• ${s}</div>`).join('');

    const modal = document.getElementById('detail-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/* -------------------------------------------------------------------
   7. ACHIEVEMENT & PROJECTS DATA & FILTERING
------------------------------------------------------------------- */
const projectsData = [
    {
        id: 101,
        track: 'duo',
        badge: 'DUO COLLABORATION',
        owner: 'Muhammad Rafly Isman × Defarel Permana',
        title: 'NetPulse — Real-Time Server & Network Monitoring Web',
        desc: 'Dashboard pemantauan kesehatan server, latensi ping, dan status layanan jaringan. Defarel merancang antarmuka visualisasi interaktif, sementara Rafly membangun agen pemantau Linux & keamanan API.',
        tags: ['Linux Agent', 'REST API', 'Tailwind UI', 'Network Ops'],
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
        specs: ['Arsitektur: Linux Python/Bash Telemetry + Modern Web Dashboard', 'Peran Rafly: Server Metrics Collector, Nginx Reverse Proxy & Firewall', 'Peran Defarel: Information Architecture, Data Visualization & Front-End']
    },
    {
        id: 102,
        track: 'duo',
        badge: 'DUO COLLABORATION',
        owner: 'Muhammad Rafly Isman × Defarel Permana',
        title: 'CampusFlow — Sistem Informasi Layanan & Cloud Hosting',
        desc: 'Platform digitalisasi administrasi kegiatan mahasiswa yang di-deploy di atas infrastruktur VPS Linux dengan kontainer Docker dan sertifikat SSL otomatis.',
        tags: ['Docker', 'Nginx', 'Information System', 'SQL'],
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
        specs: ['Arsitektur: Containerized Web App + Relational Database', 'Peran Rafly: VPS Provisioning, Docker Compose & Automated Backup', 'Peran Defarel: BPMN Workflow, ERD Database & Responsive Interface']
    },
    {
        id: 103,
        track: 'rafly',
        badge: 'INFRA & SECURITY',
        owner: 'Muhammad Rafly Isman',
        title: 'Multi-Branch Enterprise Network & Firewall Architecture',
        desc: 'Rancangan jaringan kantor pusat dan cabang dengan segmentasi VLAN, Inter-VLAN Routing, OSPF, NAT, serta kebijakan Access Control List (ACL) untuk isolasi trafik sensitif.',
        tags: ['Cisco / MikroTik', 'VLAN & OSPF', 'ACL Security'],
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80',
        specs: ['Topologi: Core-Distribution-Access 3-Tier Architecture', 'Fitur: Redundant Link, DHCP Snooping, Port Security', 'Dokumentasi: Skema IP Addressing Subnetting & Tabel Routing']
    },
    {
        id: 104,
        track: 'rafly',
        badge: 'CLOUD & LINUX',
        owner: 'Muhammad Rafly Isman',
        title: 'Automated Linux Server Hardening & Audit Script',
        desc: 'Kumpulan skrip otomasi Bash untuk konfigurasi keamanan awal server Ubuntu/Debian: pengaturan SSH non-standard, UFW firewall rules, dan pemantauan log intrusi.',
        tags: ['Bash Scripting', 'Ubuntu Server', 'Cybersecurity'],
        image: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=900&q=80',
        specs: ['Target OS: Ubuntu 22.04 / 24.04 LTS & Debian', 'Fitur: Auto-Update Security Patch, Fail2Ban Jail, SSH Hardening', 'Dampak: Mempercepat waktu provisioning server aman hingga 70%']
    },
    {
        id: 105,
        track: 'defarel',
        badge: 'SYSTEMS ANALYSIS',
        owner: 'Defarel Permana',
        title: 'SmartInventory — Sistem Informasi Manajemen Stok UMKM',
        desc: 'Analisis kebutuhan bisnis dan perancangan sistem pencatatan barang masuk-keluar, prediksi restock minimum, serta laporan keuangan ringkas berbasis web.',
        tags: ['BPMN & SRS', 'ERD SQL', 'Front-End Dev'],
        image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=900&q=80',
        specs: ['Metodologi: SDLC Waterfall / Agile Hybrid', 'Deliverables: Dokumen SRS, Diagram BPMN, Prototipe UI Interaktif', 'Fokus: Kemudahan penggunaan bagi staf non-teknis']
    },
    {
        id: 106,
        track: 'defarel',
        badge: 'UI/UX & FRONT-END',
        owner: 'Defarel Permana',
        title: 'Executive Analytics & Academic Portal UI Kit',
        desc: 'Sistem desain komponen antarmuka modern (Design System) untuk portal akademik dan dashboard eksekutif dengan dukungan mode gelap dan aksesibilitas tinggi.',
        tags: ['Design System', 'Tailwind CSS', 'UI/UX'],
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
        specs: ['Komponen: 25+ Modular UI Cards, Data Tables & Navigation', 'Standar: Responsive Mobile-First & Semantic HTML5', 'Fokus: Konsistensi visual dan kecepatan rendering halaman']
    }
];

function renderProjects(filter = 'all') {
    const grid = document.getElementById('projects-grid');
    const filtered = filter === 'all' ? projectsData : projectsData.filter(p => p.track === filter);

    grid.innerHTML = filtered.map(p => `
        <article onclick="openProjectModal(${p.id})" class="tilt-card rounded-3xl bg-deepnavy/80 border border-white/10 hover:border-skyblue/60 overflow-hidden group cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-lg">
            <div>
                <div class="relative h-44 w-full overflow-hidden bg-obsidian">
                    <img src="${p.image}" alt="${p.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-deepnavy via-deepnavy/30 to-transparent"></div>
                    <span class="absolute top-3.5 left-3.5 px-3 py-1 rounded-full ${p.track === 'duo' ? 'bg-royalblue text-white' : 'bg-obsidian/85 text-skyblue border border-skyblue/30'} font-mono text-[10px] font-semibold">
                        ${p.badge}
                    </span>
                </div>

                <div class="p-6">
                    <p class="font-mono text-[11px] text-skyblue mb-1.5">${p.owner}</p>
                    <h3 class="text-lg font-bold text-white mb-2.5 group-hover:text-skyblue transition-colors leading-snug">${p.title}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed mb-4">${p.desc}</p>
                </div>
            </div>

            <div class="px-6 pb-6">
                <div class="flex flex-wrap gap-1.5 mb-4">
                    ${p.tags.map(t => `<span class="px-2.5 py-1 rounded-md bg-obsidian border border-white/10 font-mono text-[10px] text-slate-300">${t}</span>`).join('')}
                </div>
                <div class="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-skyblue">
                    <span>Lihat Arsitektur &amp; Detail</span>
                    <i data-lucide="arrow-up-right" class="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                </div>
            </div>
        </article>
    `).join('');

    lucide.createIcons();
    bindTiltCards();
}

function filterProjects(track, btn) {
    playLobbySound('select');
    document.querySelectorAll('.project-tab-btn').forEach(b => {
        b.className = 'project-tab-btn px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-deepnavy text-slate-300 border border-white/10 hover:border-skyblue/40 transition cursor-pointer';
    });
    btn.className = 'project-tab-btn active px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-royalblue text-white shadow-lg transition cursor-pointer';
    renderProjects(track);
}

function openProjectModal(id) {
    playLobbySound('select');
    const p = projectsData.find(item => item.id === id);
    if (!p) return;

    document.getElementById('modal-img').src = p.image;
    document.getElementById('modal-tag').textContent = p.badge;
    document.getElementById('modal-owner').textContent = p.owner;
    document.getElementById('modal-date').textContent = 'PROJECT CASE STUDY';
    document.getElementById('modal-title').textContent = p.title;
    document.getElementById('modal-desc').textContent = p.desc;
    document.getElementById('modal-specs').innerHTML = p.specs.map(s => `<div>• ${s}</div>`).join('');

    const modal = document.getElementById('detail-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    const modal = document.getElementById('detail-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function closeModalOnBackdrop(e) {
    if (e.target.id === 'detail-modal') closeModal();
}

/* -------------------------------------------------------------------
   8. NAVIGATION, COPY EMAIL & SCROLL REVEAL OBSERVER
------------------------------------------------------------------- */
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

function copyCollabEmail() {
    playLobbySound('select');
    navigator.clipboard.writeText('duosync.collab@gmail.com').then(() => {
        const label = document.getElementById('copy-label');
        label.textContent = 'Tersalin!';
        setTimeout(() => { label.textContent = 'Salin Email'; }, 2200);
    });
}

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
        const top = sec.offsetTop - 160;
        if (window.scrollY >= top) current = sec.getAttribute('id');
    });

    navLinks.forEach(link => {
        link.classList.remove('bg-royalblue', 'text-white');
        link.classList.add('text-slate-300');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('bg-royalblue', 'text-white');
            link.classList.remove('text-slate-300');
        }
    });
});

// Initial Render
renderGallery('all');
renderProjects('all');
bindTiltCards();
