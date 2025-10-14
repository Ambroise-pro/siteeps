const vmaForm = document.getElementById('vma-form');
const courseForm = document.getElementById('course-form');
const coursesBody = document.getElementById('courses-body');
const currentVmaText = document.getElementById('current-vma');
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
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const nextBtn = document.getElementById('next-btn');

let student = {
  name: '',
  vma: null, // km/h
};

let courses = [];
let currentCourseIndex = -1;
let timer = {
  startTime: null,
  elapsed: 0,
  rafId: null,
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

  const targetTime = course.targetTime;
  const gap = timer.elapsed - targetTime;
  setGap(gap);
};

const renderCourses = () => {
  coursesBody.innerHTML = '';

  if (courses.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.textContent = 'Aucune course enregistrée pour le moment.';
    cell.style.textAlign = 'center';
    cell.style.color = 'var(--text-soft)';
    row.appendChild(cell);
    coursesBody.appendChild(row);
    return;
  }

  courses.forEach((course, index) => {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = course.name;

    const distanceCell = document.createElement('td');
    distanceCell.textContent = `${course.distance} m`;

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
    row.appendChild(percentCell);
    row.appendChild(paceCell);
    row.appendChild(targetCell);
    row.appendChild(actionCell);

    coursesBody.appendChild(row);
  });
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
  hareStatus.textContent = 'Prêt';
  setGap(0);

  noCourseMessage.classList.add('hidden');
  activeCourseContainer.classList.remove('hidden');

  resetTimer();
  renderCourses();
};

const goToNextCourse = () => {
  if (currentCourseIndex < courses.length - 1) {
    activateCourse(currentCourseIndex + 1);
  }
};

const updateVmaText = () => {
  if (student.vma) {
    currentVmaText.textContent = `VMA définie à ${student.vma.toFixed(1)} km/h${
      student.name ? ` pour ${student.name}` : ''
    }.`;
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

  if (!Number.isFinite(vma) || vma <= 0) {
    alert('Merci de saisir une VMA valide.');
    return;
  }

  student = {
    name,
    vma,
  };

  updateVmaText();
  persist();
});

courseForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!student.vma) {
    alert('Définissez d’abord la VMA de l’élève.');
    return;
  }

  const data = new FormData(courseForm);
  const name = data.get('course-name').trim();
  const distance = Number(data.get('distance'));
  const percent = Number(data.get('percent'));

  if (!name || !Number.isFinite(distance) || !Number.isFinite(percent)) {
    alert('Merci de compléter tous les champs de la course.');
    return;
  }

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
});

pauseBtn.addEventListener('click', () => {
  cancelAnimationFrame(timer.rafId);
  timer.startTime = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
});

resetBtn.addEventListener('click', () => {
  resetTimer();
});

nextBtn.addEventListener('click', () => {
  goToNextCourse();
});

window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(timer.rafId);
});

hydrateFromStorage();
