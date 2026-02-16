(function () {
    'use strict';

    // =====================================================
    // CONFIGURATION
    // =====================================================
    const CFG = {
        particles: { count: innerWidth < 768 ? 45 : 160, maxSpd: 0.22, connDist: 115, mRadius: 170, mForce: 0.045 },
        cursor: { dotSmooth: 0.14, ringSmooth: 0.08, spotSmooth: 0.05 },
        magnetic: { force: 0.3 }
    };

    // =====================================================
    // LOADING SCREEN
    // =====================================================
    const loader = document.getElementById('loader');
    const loaderBar = document.getElementById('loaderBar');
    let prog = 0;

    function animateLoader() {
        const iv = setInterval(() => {
            prog += Math.random() * 12 + 4;
            if (prog >= 100) {
                prog = 100; loaderBar.style.width = '100%'; clearInterval(iv);
                setTimeout(() => { loader.classList.add('hidden'); startExperience(); }, 500);
            } else { loaderBar.style.width = prog + '%'; }
        }, 100);
    }

    // =====================================================
    // PARTICLE CONSTELLATION SYSTEM
    // =====================================================
    const cvs = document.getElementById('particle-canvas');
    const ctx = cvs.getContext('2d');
    let parts = [], mx = -9999, my = -9999;

    function resizeCvs() {
        const dpr = devicePixelRatio || 1;
        cvs.width = innerWidth * dpr; cvs.height = innerHeight * dpr;
        cvs.style.width = innerWidth + 'px'; cvs.style.height = innerHeight + 'px';
        ctx.scale(dpr, dpr);
    }
    resizeCvs();
    addEventListener('resize', () => { ctx.setTransform(1, 0, 0, 1, 0, 0); resizeCvs(); });

    class Pt {
        constructor() { this.init(); }
        init() {
            this.x = Math.random() * innerWidth;
            this.y = Math.random() * innerHeight;
            this.r = Math.random() * 1.3 + 0.2;
            this.vx = (Math.random() - 0.5) * CFG.particles.maxSpd;
            this.vy = (Math.random() - 0.5) * CFG.particles.maxSpd;
            this.ba = Math.random() * 0.22 + 0.04;
            this.a = this.ba;
            this.ts = Math.random() * 0.015 + 0.004;
            this.tp = Math.random() * Math.PI * 2;
            // Parallax depth — each particle has a z value
            this.z = Math.random() * 0.5 + 0.5;
        }
        update(t) {
            // Twinkle
            this.a = this.ba + Math.sin(t * this.ts + this.tp) * this.ba * 0.7;
            this.x += this.vx * this.z;
            this.y += this.vy * this.z;

            // Mouse interaction — scaled by depth
            const dx = mx - this.x, dy = my - this.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            const mR = CFG.particles.mRadius * this.z;
            if (d < mR) {
                const f = (mR - d) / mR;
                this.x -= dx * f * CFG.particles.mForce * this.z;
                this.y -= dy * f * CFG.particles.mForce * this.z;
                this.a = Math.min(this.a + f * 0.5, 0.85);
            }

            // Wrap
            const w = innerWidth, h = innerHeight;
            if (this.x < -30) this.x = w + 30;
            if (this.x > w + 30) this.x = -30;
            if (this.y < -30) this.y = h + 30;
            if (this.y > h + 30) this.y = -30;
        }
        draw() {
            // Outer glow
            ctx.beginPath();
            const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4);
            g.addColorStop(0, `rgba(255,255,255,${this.a * 0.8})`);
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
            ctx.fill();
            // Core dot
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * this.z, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${this.a * 1.6})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < CFG.particles.count; i++) parts.push(new Pt());

    function drawConns() {
        const cd = CFG.particles.connDist;
        for (let i = 0; i < parts.length; i++) {
            for (let j = i + 1; j < parts.length; j++) {
                const dx = parts[i].x - parts[j].x, dy = parts[i].y - parts[j].y;
                const d2 = dx * dx + dy * dy;
                if (d2 < cd * cd) {
                    const dist = Math.sqrt(d2);
                    const alpha = (1 - dist / cd) * 0.08 * ((parts[i].z + parts[j].z) / 2);
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
                    ctx.lineWidth = 0.4;
                    ctx.moveTo(parts[i].x, parts[i].y);
                    ctx.lineTo(parts[j].x, parts[j].y);
                    ctx.stroke();
                }
            }
        }
        // Mouse connections
        if (mx > 0) {
            for (let i = 0; i < parts.length; i++) {
                const dx = mx - parts[i].x, dy = my - parts[i].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < CFG.particles.mRadius) {
                    const alpha = (1 - d / CFG.particles.mRadius) * 0.18;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
                    ctx.lineWidth = 0.3;
                    ctx.moveTo(mx, my);
                    ctx.lineTo(parts[i].x, parts[i].y);
                    ctx.stroke();
                }
            }
        }
    }

    const t0 = performance.now();
    function renderParts() {
        const t = performance.now() - t0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.scale(devicePixelRatio || 1, devicePixelRatio || 1);
        parts.forEach(p => { p.update(t); p.draw(); });
        drawConns();
        requestAnimationFrame(renderParts);
    }

    // =====================================================
    // CUSTOM CURSOR — SILKY SMOOTH
    // =====================================================
    const cDot = document.getElementById('cursorDot');
    const cRing = document.getElementById('cursorRing');
    const cSpot = document.getElementById('cursorSpotlight');
    let cx = 0, cy = 0, dX = 0, dY = 0, rX = 0, rY = 0, sX = 0, sY = 0;

    document.addEventListener('mousemove', e => {
        cx = e.clientX; cy = e.clientY; mx = cx; my = cy;
    });

    function animCursor() {
        dX += (cx - dX) * CFG.cursor.dotSmooth;
        dY += (cy - dY) * CFG.cursor.dotSmooth;
        rX += (cx - rX) * CFG.cursor.ringSmooth;
        rY += (cy - rY) * CFG.cursor.ringSmooth;
        sX += (cx - sX) * CFG.cursor.spotSmooth;
        sY += (cy - sY) * CFG.cursor.spotSmooth;
        cDot.style.left = dX + 'px'; cDot.style.top = dY + 'px';
        cRing.style.left = rX + 'px'; cRing.style.top = rY + 'px';
        cSpot.style.left = sX + 'px'; cSpot.style.top = sY + 'px';
        requestAnimationFrame(animCursor);
    }

    function setupHoverTargets() {
        const targets = 'a, button, .logo, .service-card, .portfolio-item, .feature-item, .testimonial, .nav-cta';
        document.querySelectorAll(targets).forEach(el => {
            el.addEventListener('mouseenter', () => { cDot.classList.add('hovering'); cRing.classList.add('hovering'); });
            el.addEventListener('mouseleave', () => { cDot.classList.remove('hovering'); cRing.classList.remove('hovering'); });
        });
    }

    // =====================================================
    // MAGNETIC BUTTONS
    // =====================================================
    function setupMagnetic() {
        document.querySelectorAll('.btn, .nav-cta').forEach(btn => {
            btn.addEventListener('mousemove', e => {
                const r = btn.getBoundingClientRect();
                const dx = (e.clientX - (r.left + r.width / 2)) * CFG.magnetic.force;
                const dy = (e.clientY - (r.top + r.height / 2)) * CFG.magnetic.force;
                btn.style.transform = `translate(${dx}px, ${dy}px)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
                btn.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1), color 0.4s, border-color 0.4s, letter-spacing 0.5s, box-shadow 0.5s, background 0.5s';
            });
            btn.addEventListener('mouseenter', () => {
                btn.style.transition = 'color 0.4s, border-color 0.4s, letter-spacing 0.5s, box-shadow 0.5s, background 0.5s';
            });
        });
    }

    // =====================================================
    // CARD SPOTLIGHT EFFECT
    // =====================================================
    function setupCardSpotlight() {
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width) * 100;
                const y = ((e.clientY - r.top) / r.height) * 100;
                card.style.setProperty('--mx', x + '%');
                card.style.setProperty('--my', y + '%');
            });
        });
    }

    // =====================================================
    // PORTFOLIO TILT EFFECT
    // =====================================================
    function setupPortfolioTilt() {
        document.querySelectorAll('.portfolio-item').forEach(item => {
            item.addEventListener('mousemove', e => {
                const r = item.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                item.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
            });
            item.addEventListener('mouseleave', () => {
                item.style.transform = '';
                item.style.transition = 'all 0.6s cubic-bezier(0.16,1,0.3,1)';
            });
            item.addEventListener('mouseenter', () => {
                item.style.transition = 'box-shadow 0.5s, border-color 0.5s';
            });
        });
    }

    // =====================================================
    // CINEMATIC TYPING ANIMATION
    // =====================================================
    const sStr = "Sajaa", gStr = "Graphics";
    const sEl = document.getElementById('sajaa-text'), gEl = document.getElementById('graphics-text');
    const subSec = document.getElementById('subSection');
    let si = 0, gi = 0;

    function typeS() {
        if (si < sStr.length) {
            const sp = document.createElement('span');
            sp.textContent = sStr[si];
            sp.style.cssText = 'opacity:0;transform:translateY(70px) rotateX(90deg) scale(0.2);filter:blur(15px);display:inline-block';
            sEl.appendChild(sp);
            requestAnimationFrame(() => requestAnimationFrame(() => {
                sp.style.transition = `opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1), filter 0.8s cubic-bezier(0.16,1,0.3,1)`;
                sp.style.opacity = '1';
                sp.style.transform = 'translateY(0) rotateX(0deg) scale(1)';
                sp.style.filter = 'blur(0)';
            }));
            si++;
            setTimeout(typeS, 130);
        } else {
            setTimeout(typeG, 300);
        }
    }

    function typeG() {
        if (gi < gStr.length) {
            const sp = document.createElement('span');
            sp.textContent = gStr[gi];
            sp.style.cssText = 'opacity:0;transform:translateX(25px) scale(0.8);filter:blur(8px);display:inline-block';
            gEl.appendChild(sp);
            requestAnimationFrame(() => requestAnimationFrame(() => {
                sp.style.transition = `opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1), filter 0.6s cubic-bezier(0.16,1,0.3,1)`;
                sp.style.opacity = '1';
                sp.style.transform = 'translateX(0) scale(1)';
                sp.style.filter = 'blur(0)';
            }));
            gi++;
            setTimeout(typeG, 70);
        } else {
            setTimeout(() => subSec.classList.add('visible'), 300);
        }
    }

    // =====================================================
    // 3D TEXT TILT + PROXIMITY GLOW
    // =====================================================
    const tc = document.getElementById('textContainer');
    const mt = document.getElementById('mainText');

    tc.addEventListener('mousemove', e => {
        const r = tc.getBoundingClientRect();
        const rx = (e.clientY - (r.top + r.height / 2)) / 25;
        const ry = ((r.left + r.width / 2) - e.clientX) / 25;
        mt.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;

        tc.querySelectorAll('.sajaa-part span, .graphics-part span').forEach(ch => {
            const cr = ch.getBoundingClientRect();
            const d = Math.hypot(e.clientX - (cr.left + cr.width / 2), e.clientY - (cr.top + cr.height / 2));
            ch.classList.toggle('glow', d < 110);
        });
    });

    tc.addEventListener('mouseleave', () => {
        mt.style.transform = 'rotateX(0deg) rotateY(0deg)';
        tc.querySelectorAll('.sajaa-part span, .graphics-part span').forEach(ch => ch.classList.remove('glow'));
    });

    // =====================================================
    // NAVIGATION — SCROLL + ACTIVE LINK + TOGGLE
    // =====================================================
    const nav = document.getElementById('navbar');
    const sections = document.querySelectorAll('section[id], .hero[id]');
    const navLinkEls = document.querySelectorAll('.nav-links a:not(.nav-cta)');

    function updateNav() {
        nav.classList.toggle('scrolled', scrollY > 50);

        // Active link highlighting
        let current = '';
        sections.forEach(sec => {
            const top = sec.offsetTop - 120;
            if (scrollY >= top) current = sec.getAttribute('id');
        });
        navLinkEls.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + current);
        });
    }
    addEventListener('scroll', updateNav, { passive: true });

    // Nav toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

    // Smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // =====================================================
    // SCROLL REVEAL — STAGGERED
    // =====================================================
    const revObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Stagger children if parent is reveal-stagger
                const el = entry.target;
                if (el.classList.contains('reveal')) {
                    el.classList.add('visible');
                }
                // Check for staggered children
                const parent = el.closest('.reveal-stagger');
                if (parent) {
                    const children = parent.querySelectorAll('.reveal');
                    children.forEach((child, i) => {
                        child.style.transitionDelay = (i * 0.12) + 's';
                        setTimeout(() => child.classList.add('visible'), 10);
                    });
                }
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

    // =====================================================
    // ANIMATED COUNTERS — SMOOTH EASING
    // =====================================================
    function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

    const cntObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count);
                const duration = 2000;
                const start = performance.now();

                function tick(now) {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = easeOutExpo(progress);
                    el.textContent = Math.floor(target * eased) + '+';
                    if (progress < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
                cntObs.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat-num[data-count]').forEach(el => cntObs.observe(el));

    // =====================================================
    // PARALLAX ON MOUSE MOVE (Hero Section)
    // =====================================================
    const geoShapes = document.querySelectorAll('.geo-shape');
    document.addEventListener('mousemove', e => {
        const x = (e.clientX / innerWidth - 0.5) * 2;
        const y = (e.clientY / innerHeight - 0.5) * 2;
        geoShapes.forEach((shape, i) => {
            const depth = (i + 1) * 6;
            shape.style.transform += '';
            shape.style.marginLeft = (x * depth) + 'px';
            shape.style.marginTop = (y * depth) + 'px';
        });
    });

    // =====================================================
    // START EXPERIENCE
    // =====================================================
    function startExperience() {
        renderParts();
        if (matchMedia('(pointer:fine)').matches) animCursor();
        setupHoverTargets();
        setupMagnetic();
        setupCardSpotlight();
        setupPortfolioTilt();
        setTimeout(typeS, 300);
    }

    // =====================================================
    // INIT
    // =====================================================
    addEventListener('load', () => document.fonts.ready.then(animateLoader));
})();
