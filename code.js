document.addEventListener("DOMContentLoaded", () => {
    const revealElements = document.querySelectorAll(".reveal");
    const navLinks = document.querySelectorAll('.nav a[href^="#"]');
    const sections = document.querySelectorAll("main section[id]");
    const orbA = document.querySelector(".orb-a");
    const orbB = document.querySelector(".orb-b");
    const mathFigures = document.querySelectorAll(".math-figure");
    const graphCurves = document.querySelectorAll(".math-figure .curve:not(.faint)");
    const progressBar = document.getElementById("scroll-progress");
    const glassCursor = document.getElementById("glass-cursor");
    const statValues = document.querySelectorAll(".stats strong");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionState = {
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2,
        currentX: window.innerWidth / 2,
        currentY: window.innerHeight / 2
    };
    let sceneFrame = null;
    let scrollFrame = null;

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    const setActiveLink = (id) => {
        navLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("active", isActive);
        });
    };

    const sectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveLink(entry.target.id);
                }
            });
        },
        {
            threshold: 0.55,
            rootMargin: "-10% 0px -20% 0px"
        }
    );

    sections.forEach((section) => sectionObserver.observe(section));

    const updateScrollProgress = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
        progressBar.style.width = `${Math.min(percent, 100)}%`;
    };

    const scheduleScrollProgress = () => {
        if (scrollFrame) {
            return;
        }

        scrollFrame = requestAnimationFrame(() => {
            updateScrollProgress();
            scrollFrame = null;
        });
    };

    const interactiveTargets = document.querySelectorAll('a, button, .btn');
    interactiveTargets.forEach((target) => {
        target.addEventListener('mouseenter', () => glassCursor?.classList.add('active'));
        target.addEventListener('mouseleave', () => glassCursor?.classList.remove('active'));
    });

    mathFigures.forEach((figure) => {
        figure.dataset.baseTransform = getComputedStyle(figure).transform === "none"
            ? ""
            : getComputedStyle(figure).transform;
    });

    graphCurves.forEach((curve) => {
        const curveLength = curve.getTotalLength();
        curve.style.setProperty("--curve-length", `${curveLength}`);
        curve.closest(".math-figure")?.classList.add("curve-ready");
    });

    const animateCount = (element) => {
        const text = element.textContent.trim();
        const numericMatch = text.match(/\d+/);

        if (!numericMatch) {
            return;
        }

        const target = Number(numericMatch[0]);
        const suffix = text.replace(String(target), "");
        const duration = 1200;
        const start = performance.now();

        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(target * eased);
            element.textContent = `${value}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };

    const statsObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    statValues.forEach((value) => animateCount(value));
                    observer.disconnect();
                }
            });
        },
        { threshold: 0.5 }
    );

    const statsSection = document.querySelector(".stats");
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    const renderScene = () => {
        if (prefersReducedMotion.matches) {
            sceneFrame = null;
            return;
        }

        motionState.currentX += (motionState.targetX - motionState.currentX) * 0.14;
        motionState.currentY += (motionState.targetY - motionState.currentY) * 0.14;

        const x = (motionState.currentX / window.innerWidth - 0.5) * 18;
        const y = (motionState.currentY / window.innerHeight - 0.5) * 18;

        if (orbA) {
            orbA.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }

        if (orbB) {
            orbB.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
        }

        mathFigures.forEach((figure, index) => {
            const offsetX = x * (0.2 + index * 0.04);
            const offsetY = y * (0.2 + index * 0.04);

            if ("translate" in figure.style) {
                figure.style.translate = `${offsetX}px ${offsetY}px`;
            } else {
                const baseTransform = figure.dataset.baseTransform && figure.dataset.baseTransform !== "none"
                    ? `${figure.dataset.baseTransform} `
                    : "";
                figure.style.transform = `${baseTransform}translate3d(${offsetX}px, ${offsetY}px, 0)`;
            }
        });

        if (glassCursor) {
            glassCursor.style.transform = `translate3d(${motionState.currentX - 15}px, ${motionState.currentY - 15}px, 0)`;
        }

        const remainingX = Math.abs(motionState.targetX - motionState.currentX);
        const remainingY = Math.abs(motionState.targetY - motionState.currentY);
        sceneFrame = remainingX > 0.1 || remainingY > 0.1
            ? requestAnimationFrame(renderScene)
            : null;
    };

    const queueSceneFrame = () => {
        if (!sceneFrame && !prefersReducedMotion.matches) {
            sceneFrame = requestAnimationFrame(renderScene);
        }
    };

    const handlePointerMove = (event) => {
        motionState.targetX = event.clientX;
        motionState.targetY = event.clientY;
        queueSceneFrame();
    };

    const handlePointerLeave = () => {
        motionState.targetX = window.innerWidth / 2;
        motionState.targetY = window.innerHeight / 2;
        queueSceneFrame();
    };

    const handleResize = () => {
        scheduleScrollProgress();
        motionState.targetX = Math.min(motionState.targetX, window.innerWidth);
        motionState.targetY = Math.min(motionState.targetY, window.innerHeight);
        motionState.currentX = Math.min(motionState.currentX, window.innerWidth);
        motionState.currentY = Math.min(motionState.currentY, window.innerHeight);
        queueSceneFrame();
    };

    const handleMotionPreferenceChange = () => {
        if (prefersReducedMotion.matches) {
            if (sceneFrame) {
                cancelAnimationFrame(sceneFrame);
                sceneFrame = null;
            }

            return;
        }

        queueSceneFrame();
    };

    scheduleScrollProgress();
    queueSceneFrame();
    window.addEventListener("scroll", scheduleScrollProgress, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    prefersReducedMotion.addEventListener("change", handleMotionPreferenceChange);
});
