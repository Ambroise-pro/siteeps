const vmaForm = document.getElementById('vma-form');
const courseForm = document.getElementById('course-form');
const coursesBody = document.getElementById('courses-body');
const currentVmaText = document.getElementById('current-vma');
const courseNameInput = document.getElementById('course-name');
const plotDistanceInput = document.getElementById('plot-distance');
const observationPanel = document.getElementById('observation-panel');
const noCourseMessage = document.getElementById('no-course');
const activeCourseContainer = document.getElementById('active-course');
const activeName = document.getElementById('active-name');
const activeDistance = document.getElementById('active-distance');
const activePercent = document.getElementById('active-percent');
const activePace = document.getElementById('active-pace');
const activeTarget = document.getElementById('active-target');
const hareStatus = document.getElementById('hare-status');
const chronometer = document.getElementById('chronometer');
const timeGap = document.getElementById('time-gap');
const nextMarkerLabel = document.getElementById('next-marker-label');
const nextMarkerTarget = document.getElementById('next-marker-target');
const passPlotBtn = document.getElementById('pass-plot-btn');
const splitList = document.getElementById('split-list');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const nextBtn = document.getElementById('next-btn');

let student = {
  name: '',
  vma: null, // km/h
  plotDistance: null,
};

let courses = [];
let currentCourseIndex = -1;
let timer = {
  startTime: null,
  elapsed: 0,
  rafId: null,
};

const observation = {
  markers: [],
  nextMarkerIndex: 0,
  passes: [],
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toFixed(1).padStart(4, '0');
  return `${minutes}:${secs}`;
};

const formatPace = (paceSecondsPerKm) => {
  const minutes = Math.floor(paceSecondsPerKm / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.round(paceSecondsPerKm % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const vmaKmHToMs = (kmh) => (kmh * 1000) / 3600;

const getCourseTargetTime = (course) => {
  const vmaMs = vmaKmHToMs(student.vma);
  const targetSpeed = vmaMs * (course.percent / 100);
  return course.distance / targetSpeed;
};

const getCourseTargetPace = (course) => {
  const vmaMs = vmaKmHToMs(student.vma);
  const targetSpeed = vmaMs * (course.percent / 100);
  const paceSecondsPerKm = 1000 / targetSpeed;
  return paceSecondsPerKm;
};

const resetTimer = () => {
  timer.startTime = null;
  timer.elapsed = 0;
  cancelAnimationFrame(timer.rafId);
  chronometer.textContent = '00:00.0';
  setGap(0);
  startBtn.disabled = currentCourseIndex === -1;
  pauseBtn.disabled = true;
  nextBtn.disabled = courses.length === 0 || currentCourseIndex === -1;
  passPlotBtn.disabled = true;
};

const completeCourse = () => {
  cancelAnimationFrame(timer.rafId);
  timer.startTime = null;
  startBtn.disabled = true;
  pauseBtn.disabled = true;
  passPlotBtn.disabled = true;
  nextBtn.disabled = currentCourseIndex >= courses.length - 1;
  hareStatus.textContent = 'Terminé';
};

const updateChronometer = () => {
  if (!timer.startTime) return;
  const now = performance.now();
  timer.elapsed = (now - timer.startTime) / 1000;
  chronometer.textContent = formatTime(timer.elapsed);
  updateGap();
  timer.rafId = requestAnimationFrame(updateChronometer);
};

const setGap = (gapSeconds) => {
  const formatted = `${gapSeconds > 0 ? '+' : ''}${gapSeconds.toFixed(1)} s`;
  timeGap.textContent = formatted;
  timeGap.classList.remove('gap-neutral', 'gap-positive', 'gap-negative');

  if (gapSeconds === 0) {
    timeGap.classList.add('gap-neutral');
    hareStatus.textContent = 'Pile';
  } else if (gapSeconds < 0) {
    timeGap.classList.add('gap-positive');
    hareStatus.textContent = 'En avance';
  } else {
    timeGap.classList.add('gap-negative');
    hareStatus.textContent = 'En retard';
  }
};

const updateGap = () => {
  const course = courses[currentCourseIndex];
  if (!course) return;

  let targetTime = course.targetTime;
  if (observation.markers.length > 0) {
    const index = Math.min(
      observation.nextMarkerIndex,
      observation.markers.length - 1,
    );
    targetTime = observation.markers[index].targetTime;
  }
  const gap = timer.elapsed - targetTime;
  setGap(gap);
};

const formatGapText = (gapSeconds) =>
  `${gapSeconds > 0 ? '+' : ''}${gapSeconds.toFixed(1)} s`;

const computeMarkers = (course) => {
  if (!student.plotDistance || student.plotDistance <= 0) {
    return [];
  }

  const markers = [];
  const segment = student.plotDistance;
  const targetSpeed = course.distance / course.targetTime;
  let covered = 0;
  let markerIndex = 1;

  while (covered < course.distance) {
    const remaining = course.distance - covered;
    const step = Math.min(segment, remaining);
    covered += step;
    const targetTime = covered / targetSpeed;
    markers.push({
      index: markerIndex,
      distance: covered,
      targetTime,
    });
    markerIndex += 1;
  }

  return markers;
};

const updateMarkerDisplay = () => {
  if (observation.markers.length === 0) {
    nextMarkerLabel.textContent = '—';
    nextMarkerTarget.textContent = '—';
    return;
  }

  if (observation.nextMarkerIndex >= observation.markers.length) {
    nextMarkerLabel.textContent = 'Terminé';
    const lastMarker = observation.markers[observation.markers.length - 1];
    nextMarkerTarget.textContent = formatTime(lastMarker.targetTime);
    return;
  }

  const marker = observation.markers[observation.nextMarkerIndex];
  nextMarkerLabel.textContent = `${marker.index} / ${observation.markers.length}`;
  nextMarkerTarget.textContent = formatTime(marker.targetTime);
};

const clearSplits = () => {
  observation.passes = [];
  splitList.innerHTML = '';
};

const renderSplit = (marker, elapsed, gap) => {
  const item = document.createElement('li');
  item.className = 'split-item';

  const label = document.createElement('span');
  label.className = 'split-label';
  label.textContent = `Plot ${marker.index}`;

  const metrics = document.createElement('span');
  metrics.className = 'split-metrics';
  metrics.textContent = `${formatTime(elapsed)} · ${formatGapText(gap)}`;

  item.appendChild(label);
  item.appendChild(metrics);

  if (gap === 0) {
    item.classList.add('split-neutral');
  } else if (gap < 0) {
    item.classList.add('split-positive');
  } else {
    item.classList.add('split-negative');
  }

  splitList.appendChild(item);
};

const updateCourseNameField = () => {
  if (!courseNameInput) return;
  const nextNumber = courses.length + 1;
  courseNameInput.value = `Course ${nextNumber}`;
};

const renderCourses = () => {
  coursesBody.innerHTML = '';

  if (courses.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'Aucune course enregistrée pour le moment.';
    cell.style.textAlign = 'center';
    cell.style.color = 'var(--text-soft)';
    row.appendChild(cell);
    coursesBody.appendChild(row);
    updateCourseNameField();
    return;
  }

  courses.forEach((course, index) => {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = course.name;

    const distanceCell = document.createElement('td');
    distanceCell.textContent = `${course.distance} m`;

    const markersCell = document.createElement('td');
    const markers = computeMarkers(course);
    markersCell.textContent = markers.length > 0 ? markers.length : '—';

    const percentCell = document.createElement('td');
    percentCell.textContent = `${course.percent}%`;

    const paceCell = document.createElement('td');
    paceCell.textContent = `${course.pace} min/km`;

    const targetCell = document.createElement('td');
    targetCell.textContent = course.target;

    const actionCell = document.createElement('td');
    const selectButton = document.createElement('button');
    selectButton.className = 'secondary';
    selectButton.textContent = index === currentCourseIndex ? 'Sélectionnée' : 'Observer';
    selectButton.disabled = index === currentCourseIndex;
    selectButton.addEventListener('click', () => {
      activateCourse(index);
    });
    actionCell.appendChild(selectButton);

    row.appendChild(nameCell);
    row.appendChild(distanceCell);
    row.appendChild(markersCell);
    row.appendChild(percentCell);
    row.appendChild(paceCell);
    row.appendChild(targetCell);
    row.appendChild(actionCell);

    coursesBody.appendChild(row);
  });

  updateCourseNameField();
};

const activateCourse = (index) => {
  currentCourseIndex = index;
  const course = courses[index];
  if (!course) return;

  activeName.textContent = student.name
    ? `${course.name} – ${student.name}`
    : course.name;
  activeDistance.textContent = course.distance;
  activePercent.textContent = course.percent;
  activePace.textContent = course.pace;
  activeTarget.textContent = course.target;

  resetTimer();
  setGap(0);
  hareStatus.textContent = 'Prêt';

  observation.markers = computeMarkers(course);
  observation.nextMarkerIndex = 0;
  clearSplits();
  updateMarkerDisplay();

  noCourseMessage.classList.add('hidden');
  activeCourseContainer.classList.remove('hidden');

  renderCourses();
};

const goToNextCourse = () => {
  if (currentCourseIndex < courses.length - 1) {
    activateCourse(currentCourseIndex + 1);
  }
};

const updateVmaText = () => {
  if (student.vma) {
    const baseText = `VMA définie à ${student.vma.toFixed(1)} km/h${
      student.name ? ` pour ${student.name}` : ''
    }.`;
    const plotText = student.plotDistance
      ? ` Distance entre plots : ${student.plotDistance} m.`
      : '';
    currentVmaText.textContent = `${baseText}${plotText}`;
  } else {
    currentVmaText.textContent =
      'Définissez la VMA pour générer les allures et temps cibles.';
  }
};

const hydrateFromStorage = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('eps-runner') || '{}');
    if (stored.student) {
      student = stored.student;
    }
    if (Array.isArray(stored.courses)) {
      courses = stored.courses;
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données :', error);
  }

  updateVmaText();
  const nameInput = vmaForm.querySelector('#student-name');
  const vmaInput = vmaForm.querySelector('#vma');
  if (nameInput && student.name) {
    nameInput.value = student.name;
  }
  if (vmaInput && student.vma) {
    vmaInput.value = student.vma;
  }
  if (plotDistanceInput && student.plotDistance) {
    plotDistanceInput.value = student.plotDistance;
  }
  if (courses.length > 0) {
    noCourseMessage.classList.add('hidden');
    activeCourseContainer.classList.add('hidden');
  }
  renderCourses();
};

const persist = () => {
  const payload = {
    student,
    courses,
  };
  localStorage.setItem('eps-runner', JSON.stringify(payload));
};

vmaForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(vmaForm);
  const vma = parseFloat(data.get('vma'));
  const name = data.get('student-name')?.trim() ?? '';
  const plotDistance = Number(data.get('plot-distance'));

  if (!Number.isFinite(vma) || vma <= 0) {
    alert('Merci de saisir une VMA valide.');
    return;
  }

  if (!Number.isFinite(plotDistance) || plotDistance <= 0) {
    alert('Merci de saisir une distance entre les plots valide.');
    return;
  }

  student = {
    name,
    vma,
    plotDistance,
  };

  updateVmaText();
  persist();
  updateCourseNameField();
});

courseForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!student.vma) {
    alert('Définissez d’abord la VMA de l’élève.');
    return;
  }

  if (!student.plotDistance) {
    alert('Définissez la distance entre les plots dans les paramètres.');
    return;
  }

  const data = new FormData(courseForm);
  const distance = Number(data.get('distance'));
  const percent = Number(data.get('percent'));

  if (!Number.isFinite(distance) || !Number.isFinite(percent)) {
    alert('Merci de compléter tous les champs de la course.');
    return;
  }

  const nextNumber = courses.length + 1;
  const name = `Course ${nextNumber}`;
  const targetTimeSeconds = getCourseTargetTime({ distance, percent });
  const paceSecondsPerKm = getCourseTargetPace({ distance, percent });

  const course = {
    name,
    distance,
    percent,
    targetTime: targetTimeSeconds,
    target: formatTime(targetTimeSeconds),
    pace: formatPace(paceSecondsPerKm),
  };

  courses.push(course);
  courseForm.reset();
  updateCourseNameField();
  renderCourses();
  persist();

  if (currentCourseIndex === -1) {
    activateCourse(0);
  }
});

startBtn.addEventListener('click', () => {
  if (currentCourseIndex === -1) return;
  if (!timer.startTime) {
    timer.startTime = performance.now() - timer.elapsed * 1000;
  }
  timer.rafId = requestAnimationFrame(updateChronometer);
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  nextBtn.disabled = false;
  passPlotBtn.disabled = observation.markers.length === 0;
  hareStatus.textContent = 'En course';
});

pauseBtn.addEventListener('click', () => {
  cancelAnimationFrame(timer.rafId);
  timer.startTime = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  passPlotBtn.disabled = true;
  hareStatus.textContent = 'En pause';
});

resetBtn.addEventListener('click', () => {
  if (currentCourseIndex === -1) {
    resetTimer();
    return;
  }

  const course = courses[currentCourseIndex];
  observation.markers = computeMarkers(course);
  observation.nextMarkerIndex = 0;
  clearSplits();
  updateMarkerDisplay();
  resetTimer();
  hareStatus.textContent = 'Prêt';
});

nextBtn.addEventListener('click', () => {
  goToNextCourse();
});

passPlotBtn.addEventListener('click', () => {
  if (currentCourseIndex === -1) return;
  const marker = observation.markers[observation.nextMarkerIndex];
  if (!marker) return;

  const elapsed = timer.elapsed;
  const gap = elapsed - marker.targetTime;
  observation.passes.push({ marker, elapsed, gap });
  renderSplit(marker, elapsed, gap);
  observation.nextMarkerIndex += 1;
  updateMarkerDisplay();
  updateGap();

  if (observation.nextMarkerIndex >= observation.markers.length) {
    completeCourse();
  }
});

window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(timer.rafId);
});

hydrateFromStorage();
updateCourseNameField();
