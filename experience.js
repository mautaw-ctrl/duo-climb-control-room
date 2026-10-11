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
  const chapters = Array.from(document.querySelectorAll('.chapter'));
  const entryDuration = 2.8;
  const duration = 46;
  const phases = [
    { at: 0, text: 'Before the light.' },
    { at: 2.3, text: 'A universe within.' },
    { at: 9, text: 'Every part of you.' },
    { at: 17, text: 'Coming together.' },
    { at: 29, text: 'Whole again.' },
    { at: 36, text: 'Love is the light.' }
  ];
  let gl, dream, anatomy, figure, sound;
  let introTime = reducedQuery.matches ? duration : 0;
  let worldTime = 0, paused = reducedQuery.matches, ready = false;
  let animationFrame = 0, lastFrame = 0, lastPhase = -1, captionTimer = 0;
  let scene = 0, targetScene = 0, quality = 1, slowFrames = 0, navigationFrame = 0;
  let activeChapter = 0, entryTarget = 0, entryElapsed = entryDuration;
  let scrollVelocity = 0, targetVelocity = 0, lastScrollY = scrollY, lastScrollAt = performance.now();
  const pointer = [0, 0], targetPointer = [0, 0];
  const state = { width: 1, height: 1, dpr: 1, time: 0, introTime, introMode: 'anatomy-dreamscape', storm: 0, flood: 0, light: 0, reveal: 0, parting: 0, anatomyReveal: 0, anatomyPullback: 0, anatomyAssembly: 0, anatomyOpacity: 1, anatomyCenterX: .5, dreamReveal: 0, dreamOpacity: 1, pointer, scene: 0, reducedMotion: reducedQuery.matches, flight: [0, 0, 0], rotation: [0, 0, 0], figureScale: 1, entry: 0, entryProgress: 1, scrollVelocity: 0 };
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
    const sections = chapters;
    const y = scrollY;
    const now = performance.now();
    targetVelocity = clamp((y - lastScrollY) / Math.max(16, now - lastScrollAt) * 1000 / innerHeight, -2, 2);
    lastScrollY = y; lastScrollAt = now;
    let index = 0;
    while (index < sections.length - 1 && y > sections[index + 1].offsetTop) index++;
    const start = sections[index].offsetTop;
    const next = sections[index + 1];
    targetScene = next ? index + clamp((y - start) / (next.offsetTop - start)) : index;
    const active = Math.round(targetScene);
    if (active !== activeChapter) { activeChapter = active; beginEntry(active); }
    chapters.forEach(section => {
      const rect = section.getBoundingClientRect();
      section.classList.toggle('is-entered', rect.top < innerHeight * .82 && rect.bottom > innerHeight * .16);
    });
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
    body.classList.toggle('in-void', introTime < 2);
    document.querySelector('.hero .chapter-copy').inert = intro;
    body.classList.toggle('is-paused', paused);
    body.classList.toggle('motion-enhanced', !reducedQuery.matches);
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
        phaseNumber.textContent = `${String(phase + 1).padStart(2, '0')} / ${String(phases.length).padStart(2, '0')}`;
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
    state.storm = 0;
    state.flood = 0;
    state.anatomyReveal = smooth(2, 6, introTime);
    state.anatomyPullback = smooth(5, 17, introTime);
    state.anatomyAssembly = smooth(16, 31.5, introTime);
    state.anatomyOpacity = 1 - smooth(30.5, 35, introTime);
    state.dreamReveal = smooth(8, 21, introTime);
    state.light = smooth(22, 36, introTime);
    state.reveal = smooth(31, 41, introTime);
    state.parting = smooth(36, 44, introTime);
    state.scene = scene;
    state.reducedMotion = reducedQuery.matches;
    state.audioPaused = gl ? undefined : false;
    state.entry = entryTarget;
    const entryPhase = smooth(0, 1, entryElapsed / entryDuration);
    state.entryProgress = reducedQuery.matches ? 1 : 1 - Math.sin(entryPhase * Math.PI) * .88;
    state.scrollVelocity = reducedQuery.matches ? 0 : scrollVelocity;
    const mobile = innerWidth < 800;
    const travel = Math.sin(scene * Math.PI);
    const bank = Math.sin(scene * Math.PI * 2);
    const glide = Math.sin(scene * Math.PI) * (mobile ? .18 : .26);
    const motionAllowed = !reducedQuery.matches && introTime >= duration;
    state.rotation = motionAllowed ? [bank * .12, scene * Math.PI * 2, travel * .23 - scrollVelocity * .035] : [0, 0, 0];
    state.flight = motionAllowed ? [bank * (mobile ? .045 : .12), glide, -Math.pow(travel, 2) * .38] : [0, 0, 0];
    state.figureScale = motionAllowed ? 1 - Math.pow(travel, 2) * .12 : 1;
    // Keep the settled figure and its atmospheric opening aligned.
    state.centerX = mobile ? .5 : .6 + smooth(0, 1, scene) * .045 - smooth(1, 2, scene) * .015;
    if (gl && !gl.isContextLost()) {
      try {
        gl.viewport(0, 0, state.width, state.height);
        gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        dream.draw(state);
        anatomy.draw(state);
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
      entryElapsed = Math.min(entryDuration, entryElapsed + delta);
      scrollVelocity += (targetVelocity - scrollVelocity) * (1 - Math.exp(-delta * 6));
      targetVelocity *= Math.exp(-delta * 7);
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
  function beginEntry(index, force = false) {
    if (!force && entryTarget === index && entryElapsed < entryDuration) return;
    entryTarget = index;
    entryElapsed = paused || reducedQuery.matches ? entryDuration : 0;
  }
  function replay() {
    if (!gl || gl.isContextLost()) return;
    stopNavigation();
    window.scrollTo({ top: 0, behavior: 'instant' });
    introTime = reducedQuery.matches ? duration : 0; worldTime = 0; lastPhase = -1;
    pointer[0] = pointer[1] = 0; scene = targetScene = 0;
    activeChapter = entryTarget = 0; entryElapsed = entryDuration;
    scrollVelocity = targetVelocity = 0;
    setPaused(reducedQuery.matches);
    render();
  }
  function fallback(error) {
    console.warn('The cinematic canvas is unavailable; showing the accessible artwork fallback.', error && error.message ? error.message : '');
    gl = null; body.classList.remove('has-webgl');
    canvas.hidden = true;
    introTime = duration; paused = true;
    Object.assign(state, { introTime, storm: 1, flood: 1, light: 1, reveal: 1, parting: 1, audioPaused: false });
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
      soundButton.setAttribute('aria-label', enabled ? 'Slå baggrundsmusik fra' : 'Slå baggrundsmusik til');
      document.getElementById('sound-label').textContent = enabled ? 'Music on' : 'Music off';
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
    const section = target.closest('.chapter');
    if (section) beginEntry(chapters.indexOf(section), true);
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
    get state() { return { ...state, duration, paused, pointer: [...pointer], flight: [...state.flight], rotation: [...state.rotation], anatomy: anatomy && anatomy.getDiagnostics ? anatomy.getDiagnostics() : null, figureMotion: figure && figure.lastMotion ? { ...figure.lastMotion } : null, audio: sound && sound.getDiagnostics ? sound.getDiagnostics() : null }; },
    pause: () => setPaused(true), play: () => setPaused(false), skip, replay,
    seek(seconds) { introTime = clamp(Number(seconds) || 0, 0, duration); worldTime = introTime; lastPhase = -1; if (ready) render(); },
    enter(index) { beginEntry(clamp(Math.round(index), 0, chapters.length - 1), true); if (ready) render(); },
  };

  async function init() {
    updateUI(); resize();
    sound = window.Soundscape ? new window.Soundscape() : null;
    try {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
      if (!gl) throw new Error('WebGL is not available');
      dream = new window.Dreamscape(gl);
      anatomy = new window.AnatomyFigure(gl);
      figure = new window.JesusFigure(gl);
      await figure.load('./jesus-figure.png');
      if (!figure.ready) throw new Error('The figure did not finish loading');
      body.classList.add('has-webgl');
      ready = true; resize();
      // Deep links go directly to the finished scene instead of delaying navigation.
      if (location.hash && location.hash !== '#love') {
        introTime = duration;
        const target = document.getElementById(location.hash.slice(1));
        if (target) {
          window.scrollTo({ top: target.getBoundingClientRect().top + scrollY, behavior: 'instant' });
          readScroll(); scene = targetScene;
          const section = target.closest('.chapter');
          if (section) beginEntry(chapters.indexOf(section), true);
        }
      }
      startFrames();
    } catch (error) { ready = true; fallback(error); render(); }
  }
  init();
}());
