(function () {
  'use strict';
  const canvas = document.getElementById('universe');
  const body = document.body;
  const motionButton = document.getElementById('motion-toggle');
  const soundButton = document.getElementById('sound-toggle');
  const phaseCaption = document.getElementById('phase-caption');
  const phaseNumber = document.getElementById('phase-number');
  const phaseElement = document.querySelector('.intro-caption');
  const progressFill = document.getElementById('progress-fill');
  const elapsed = document.getElementById('elapsed');
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 36;
  const phases = [
    { at: 0, text: 'In the beginning.' },
    { at: 3, text: 'The sky breaks.' },
    { at: 8.5, text: 'The waters rise.' },
    { at: 16, text: 'A light remains.' },
    { at: 25, text: 'Love makes a way.' }
  ];
  let gl, ocean, figure, sound;
  let introTime = reducedQuery.matches ? duration : 0;
  let worldTime = 0, paused = reducedQuery.matches, ready = false;
  let animationFrame = 0, lastFrame = 0, lastPhase = -1, captionTimer = 0;
  let scene = 0, targetScene = 0, quality = 1, slowFrames = 0, navigationFrame = 0;
  const pointer = [0, 0], targetPointer = [0, 0];
  const state = { width: 1, height: 1, dpr: 1, time: 0, introTime, storm: 0, flood: 0, light: 0, reveal: 0, parting: 0, pointer, scene: 0, reducedMotion: reducedQuery.matches };
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth = (a, b, value) => { const x = clamp((value - a) / (b - a)); return x * x * (3 - 2 * x); };

  function resize() {
    const resolutionCap = Math.sqrt(1900000 / (innerWidth * innerHeight));
    state.dpr = Math.min(devicePixelRatio || 1, innerWidth < 800 ? 1.35 : 1.6, resolutionCap) * quality;
    state.width = canvas.width = Math.round(innerWidth * state.dpr);
    state.height = canvas.height = Math.round(innerHeight * state.dpr);
    state.centerX = innerWidth < 800 ? .5 : .6;
    if (gl) gl.viewport(0, 0, state.width, state.height);
    readScroll();
    if (ready && paused) render();
  }

  function readScroll() {
    const sections = Array.from(document.querySelectorAll('.chapter'));
    const y = scrollY;
    let index = 0;
    while (index < sections.length - 1 && y > sections[index + 1].offsetTop) index++;
    const start = sections[index].offsetTop;
    const next = sections[index + 1];
    targetScene = next ? index + clamp((y - start) / (next.offsetTop - start)) : index;
    const active = Math.round(targetScene);
    document.querySelectorAll('.top-nav a').forEach((link, i) => {
      link.classList.toggle('is-active', i === active);
      if (i === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    const cue = document.getElementById('scroll-cue');
    cue.href = active < 2 ? active === 0 ? '#englesang' : '#teknologi' : '#love';
    cue.firstChild.textContent = active < 2 ? 'Scroll to explore ' : 'Back to the light ';
    if (y > innerHeight * .2 && introTime < duration) skip();
    if (paused && ready) { scene = targetScene; render(); }
  }

  function updateUI() {
    const intro = introTime < duration;
    body.classList.toggle('in-intro', intro);
    document.querySelector('.hero .chapter-copy').inert = intro;
    body.classList.toggle('is-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Fortsæt animationen' : 'Sæt animation på pause');
    document.getElementById('skip-intro').disabled = !intro;
    progressFill.style.width = `${clamp(introTime / duration) * 100}%`;
    const seconds = Math.floor(introTime);
    elapsed.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    let phase = 0;
    phases.forEach((entry, i) => { if (introTime >= entry.at) phase = i; });
    if (phase !== lastPhase) {
      clearTimeout(captionTimer);
      const changeCaption = () => {
        phaseCaption.textContent = phases[phase].text;
        phaseNumber.textContent = `${String(phase + 1).padStart(2, '0')} / 05`;
        phaseElement.classList.remove('changing');
      };
      if (lastPhase === -1 || paused) changeCaption();
      else { phaseElement.classList.add('changing'); captionTimer = setTimeout(changeCaption, 430); }
      lastPhase = phase;
    }
  }

  function render() {
    state.time = worldTime;
    state.introTime = introTime;
    state.storm = smooth(1.8, 7.2, introTime);
    state.flood = smooth(6.2, 14.8, introTime);
    state.light = smooth(14.5, 23, introTime);
    state.reveal = smooth(20.8, 29, introTime);
    state.parting = smooth(24.8, 34.2, introTime);
    state.scene = scene;
    state.reducedMotion = reducedQuery.matches;
    if (gl && !gl.isContextLost()) {
      try {
        gl.viewport(0, 0, state.width, state.height);
        gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        ocean.draw(state);
        if (figure.ready && state.reveal > 0) figure.draw(state);
      } catch (error) { fallback(error); }
    }
    updateUI();
    if (sound) sound.update(state, paused);
  }

  function tick(timestamp) {
    animationFrame = 0;
    const delta = lastFrame ? Math.min((timestamp - lastFrame) / 1000, 1) : 0;
    lastFrame = timestamp;
    if (!paused) {
      // Preserve the timeline on slower devices and lower fill cost gradually.
      if (delta > .055 && introTime > 2) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames >= 10 && quality > .58) { quality = Math.max(.58, quality * .84); slowFrames = 0; resize(); }
      worldTime += delta;
      introTime = Math.min(duration, introTime + delta);
      scene += (targetScene - scene) * (1 - Math.exp(-delta * 3.4));
      pointer[0] += (targetPointer[0] - pointer[0]) * (1 - Math.exp(-delta * 3));
      pointer[1] += (targetPointer[1] - pointer[1]) * (1 - Math.exp(-delta * 3));
    }
    render();
    if (!paused && ready) animationFrame = requestAnimationFrame(tick);
  }

  function startFrames() {
    lastFrame = 0;
    if (!animationFrame && !paused && ready) animationFrame = requestAnimationFrame(tick);
    else if (ready) render();
  }
  function setPaused(value) {
    paused = value;
    if (paused && animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = 0; }
    startFrames(); updateUI();
  }
  function skip() { introTime = duration; updateUI(); if (ready) render(); }
  function replay() {
    if (!gl || gl.isContextLost()) return;
    stopNavigation();
    window.scrollTo({ top: 0, behavior: 'instant' });
    introTime = reducedQuery.matches ? duration : 0; worldTime = 0; lastPhase = -1;
    pointer[0] = pointer[1] = 0; scene = targetScene = 0;
    setPaused(reducedQuery.matches);
    render();
  }
  function fallback(error) {
    console.warn('The cinematic canvas is unavailable; showing the accessible artwork fallback.', error && error.message ? error.message : '');
    gl = null; body.classList.remove('has-webgl');
    canvas.hidden = true;
    introTime = duration; paused = true;
    Object.assign(state, { introTime, storm: 1, flood: 1, light: 1, reveal: 1, parting: 1 });
    document.getElementById('replay').disabled = true;
    motionButton.disabled = true;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0; updateUI();
  }

  motionButton.addEventListener('click', () => { if (gl) setPaused(!paused); });
  document.getElementById('skip-intro').addEventListener('click', skip);
  document.getElementById('replay').addEventListener('click', replay);
  soundButton.addEventListener('click', async () => {
    if (!sound) return;
    try {
      const enabled = await sound.toggle();
      soundButton.setAttribute('aria-pressed', String(enabled));
      soundButton.setAttribute('aria-label', enabled ? 'Slå lyd fra' : 'Slå lyd til');
      document.getElementById('sound-label').textContent = enabled ? 'Sound on' : 'Sound off';
      sound.update(state, paused);
    } catch (error) { console.warn('Audio could not start.', error.message); }
  });
  function stopNavigation() {
    if (navigationFrame) cancelAnimationFrame(navigationFrame);
    navigationFrame = 0;
  }
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault(); stopNavigation();
    if (link.hash !== '#love') skip();
    history.pushState(null, '', link.hash);
    const from = scrollY;
    const to = Math.max(0, target.getBoundingClientRect().top + scrollY - (target.tagName === 'SECTION' ? 0 : 130));
    const started = performance.now();
    function glide(now) {
      const x = reducedQuery.matches ? 1 : clamp((now - started) / 1250);
      const ease = x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      window.scrollTo({ top: from + (to - from) * ease, behavior: 'instant' });
      if (x < 1) navigationFrame = requestAnimationFrame(glide);
      else {
        navigationFrame = 0;
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
    navigationFrame = requestAnimationFrame(glide);
  }));
  window.addEventListener('wheel', stopNavigation, { passive: true });
  window.addEventListener('touchstart', stopNavigation, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reducedQuery.matches) return;
    targetPointer[0] = clamp(event.clientX / innerWidth * 2 - 1, -1, 1);
    targetPointer[1] = clamp(1 - event.clientY / innerHeight * 2, -1, 1);
    if (paused && ready) { pointer[0] = targetPointer[0]; pointer[1] = targetPointer[1]; render(); }
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (animationFrame) cancelAnimationFrame(animationFrame); animationFrame = 0; lastFrame = 0; }
    else startFrames();
  });
  reducedQuery.addEventListener('change', () => { if (reducedQuery.matches) { skip(); setPaused(true); } });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback('WebGL context lost'); });

  // Stable inspection hooks also make it possible to capture a particular scene.
  window.CinematicExperience = {
    get ready() { return ready; },
    get state() { return { ...state, paused, pointer: [...pointer] }; },
    pause: () => setPaused(true), play: () => setPaused(false), skip, replay,
    seek(seconds) { introTime = clamp(Number(seconds) || 0, 0, duration); worldTime = introTime; lastPhase = -1; if (ready) render(); },
  };

  async function init() {
    updateUI(); resize();
    try {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
      if (!gl) throw new Error('WebGL is not available');
      ocean = new window.StormOcean(gl);
      figure = new window.JesusFigure(gl);
      sound = window.Soundscape ? new window.Soundscape() : null;
      await figure.load('./jesus-figure.png');
      if (!figure.ready) throw new Error('The figure did not finish loading');
      body.classList.add('has-webgl');
      ready = true; resize();
      // Deep links go directly to the finished scene instead of delaying navigation.
      if (location.hash && location.hash !== '#love') introTime = duration;
      startFrames();
    } catch (error) { ready = true; fallback(error); }
  }
  init();
}());
