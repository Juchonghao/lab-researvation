/**
 * 实验室预约系统 - 应用逻辑
 */

// 数据：设备名称、设备管理员、房间号
const EQUIPMENT_LIST = [
  { id: 'ebl', name: 'EBL光刻', manager: '汪飞', room: '501' },
  { id: '30ald', name: '30ALD曝光机', manager: '汪飞', room: '102黄光区' },
  { id: 'evap', name: '蒸镀机', manager: '刘思琦', room: '206' },
  { id: 'afm', name: 'AFM显微镜', manager: '赵嵩', room: '501' },
  { id: 'hfo', name: '氧化铪-ALD', manager: '王磊', room: '501' },
  { id: 'hzo', name: 'HZO-ALD', manager: '张仁远', room: '501' },
  { id: 'sputter', name: '磁控溅射', manager: '张仁远', room: '206' },
  { id: 'lakeshore', name: 'LakeShore探针台', manager: '刘兆锐', room: '501' },
  { id: 'anneal-rt', name: '常温退火设备', manager: '田颖', room: '201' },
  { id: 'glovebox', name: '手套箱PDA探针台', manager: '党明飞', room: '501' },
  { id: 'rta', name: '快速退火设备', manager: '杨静泊', room: '302' },
  { id: 'probe5', name: '五楼探针台', manager: '杨静泊', room: '501' },
  { id: 'probe8', name: '二楼8寸探针台', manager: '杨静泊', room: '202' }
];

const SLOT_START = 8;
const SLOT_END = 22;
const SLOT_MINUTES = 30;

function getTimeSlots() {
  const slots = [];
  for (let h = SLOT_START; h < SLOT_END; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
}

const TIME_SLOTS = getTimeSlots();

let currentUser = null;
let currentDate = new Date();
let bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
// bookings[date][equipmentName][slotTime] = username

function getRooms() {
  const set = new Set(EQUIPMENT_LIST.map(e => e.room));
  return Array.from(set).sort((a, b) => String(a).localeCompare(b));
}

function getEquipmentByRoom(room) {
  return EQUIPMENT_LIST.filter(e => e.room === room);
}

function initRoomSelect() {
  const select = document.getElementById('room');
  select.innerHTML = '';
  getRooms().forEach(room => {
    const opt = document.createElement('option');
    opt.value = room;
    opt.textContent = room;
    select.appendChild(opt);
  });
  updateRoomDevices();
}

/** 选房间后，在日历上方显示该房间的设备列表 */
function updateRoomDevices() {
  awaitingTimeForSwitch = false;
  const hintEl = document.getElementById('calendarHint');
  if (hintEl) hintEl.innerHTML = CALENDAR_HINT_DEFAULT;
  const room = document.getElementById('room').value;
  const wrap = document.getElementById('roomDevicesWrap');
  const container = document.getElementById('roomDevices');
  container.innerHTML = '';
  if (!room) {
    wrap.classList.add('hidden');
    renderDayCalendar();
    return;
  }
  wrap.classList.remove('hidden');
  getEquipmentByRoom(room).forEach(equip => {
    const chip = document.createElement('span');
    chip.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm';
    chip.textContent = equip.name + '（' + equip.manager + '）';
    container.appendChild(chip);
  });
  renderDayCalendar();
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateDisplay(d) {
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${week}`;
}

const STORAGE_KEY_USER = 'labReservationUser';

function login() {
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value;
  if (user === 'admin' && pass === 'lab123') {
    currentUser = 'admin';
    localStorage.setItem(STORAGE_KEY_USER, currentUser);
    document.getElementById('login').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('userLabel').textContent = user;
    currentDate = new Date();
    initRoomSelect();
    renderDateNav();
    renderDayCalendar();
  } else {
    alert('用户名或密码错误');
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem(STORAGE_KEY_USER);
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login').classList.remove('hidden');
}

/** 页面加载时恢复登录状态，避免刷新后重新登录 */
function restoreLoginIfSaved() {
  const saved = localStorage.getItem(STORAGE_KEY_USER);
  if (saved) {
    currentUser = saved;
    document.getElementById('login').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('userLabel').textContent = saved;
    currentDate = new Date();
    initRoomSelect();
    renderDateNav();
    renderDayCalendar();
  }
}

function prevDay() {
  awaitingTimeForSwitch = false;
  const hintEl = document.getElementById('calendarHint');
  if (hintEl) hintEl.innerHTML = CALENDAR_HINT_DEFAULT;
  currentDate.setDate(currentDate.getDate() - 1);
  renderDateNav();
  renderDayCalendar();
}

function nextDay() {
  awaitingTimeForSwitch = false;
  const hintEl = document.getElementById('calendarHint');
  if (hintEl) hintEl.innerHTML = CALENDAR_HINT_DEFAULT;
  currentDate.setDate(currentDate.getDate() + 1);
  renderDateNav();
  renderDayCalendar();
}

function goToToday() {
  awaitingTimeForSwitch = false;
  const hintEl = document.getElementById('calendarHint');
  if (hintEl) hintEl.innerHTML = CALENDAR_HINT_DEFAULT;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  currentDate.setTime(today.getTime());
  renderDateNav();
  renderDayCalendar();
}

function renderDateNav() {
  document.getElementById('dateDisplay').textContent = formatDateDisplay(currentDate);
  document.getElementById('dayTitle').textContent = formatDateDisplay(currentDate) + ' · 当日预约';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cur = new Date(currentDate);
  cur.setHours(0, 0, 0, 0);
  const btnToday = document.getElementById('btnToday');
  if (cur.getTime() === today.getTime()) {
    btnToday.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
    btnToday.classList.remove('border-slate-200');
  } else {
    btnToday.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
    btnToday.classList.add('border-slate-200');
  }
}

function getBookingsForDay(dateStr) {
  return bookings[dateStr] || {};
}

function getSlotRange(slotA, slotB) {
  const i = TIME_SLOTS.indexOf(slotA);
  const j = TIME_SLOTS.indexOf(slotB);
  if (i === -1 || j === -1) return [];
  const lo = Math.min(i, j);
  const hi = Math.max(i, j);
  return TIME_SLOTS.slice(lo, hi + 1);
}

/** 按房间聚合：空档合并为 empty run；每台设备的预约按（设备、用户、连续时段）拆成 run，同一时段多设备可并排展示。 */
function getRunsByRoom(room, dayBookings) {
  const devices = getEquipmentByRoom(room).map(e => e.name);
  const runs = [];

  // 1) 空档：至少有一台设备空闲的连续时段合并为一个 empty run
  for (let i = 0; i < TIME_SLOTS.length; i++) {
    const slot = TIME_SLOTS[i];
    const hasFree = devices.some(name => !(dayBookings[name] && dayBookings[name][slot]));
    if (!hasFree) continue;
    if (runs.length > 0 && runs[runs.length - 1].status === 'empty') {
      runs[runs.length - 1].endIdx = i;
    } else {
      runs.push({ startIdx: i, endIdx: i, status: 'empty', equipmentNames: null, user: null });
    }
  }

  // 2) 每台设备：按「同一用户连续时段」拆成 run（mine / full），可重叠
  devices.forEach(equipName => {
    const slotToUser = dayBookings[equipName] || {};
    let j = 0;
    while (j < TIME_SLOTS.length) {
      const user = slotToUser[TIME_SLOTS[j]];
      if (!user) {
        j++;
        continue;
      }
      const startIdx = j;
      while (j < TIME_SLOTS.length && slotToUser[TIME_SLOTS[j]] === user) j++;
      const endIdx = j - 1;
      const status = user === currentUser ? 'mine' : 'full';
      runs.push({
        startIdx,
        endIdx,
        status,
        equipmentNames: [equipName],
        user
      });
    }
  });

  return runs;
}

/** 两 run 时间重叠：共享至少一个时间格 */
function runsOverlap(a, b) {
  return a.startIdx <= b.endIdx && b.startIdx <= a.endIdx;
}

/** 为有重叠的 run 分配列号，使重叠的预约左右分栏显示 */
function assignOverlapColumns(runs) {
  const n = runs.length;
  if (n === 0) return;
  // 建图：重叠则连边
  const overlap = (i, j) => runsOverlap(runs[i], runs[j]);
  // 找连通分量（并查集）
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(i) {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  }
  function unite(i, j) {
    parent[find(i)] = find(j);
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (overlap(i, j)) unite(i, j);
    }
  }
  const compId = runs.map((_, i) => find(i));
  const compRuns = {};
  runs.forEach((run, i) => {
    const c = compId[i];
    if (!compRuns[c]) compRuns[c] = [];
    compRuns[c].push({ run, idx: i });
  });
  // 每个分量内按 startIdx 排序，依次分配列 0,1,2,...
  Object.values(compRuns).forEach(arr => {
    arr.sort((a, b) => a.run.startIdx - b.run.startIdx);
    const totalColumns = arr.length;
    arr.forEach(({ run, idx }, col) => {
      run.column = col;
      run.totalColumns = totalColumns;
    });
  });
  // 无重叠的 run（单独成组）设为 1 列
  runs.forEach(run => {
    if (run.column == null) {
      run.column = 0;
      run.totalColumns = 1;
    }
  });
}

let dragStartSlot = null;
let dragEndSlot = null;
let isDragging = false;
let mouseDownOnMineRun = null;
let pendingBookingSlots = null;
let pendingCancelRun = null;
/** 从「我的预约」选择「改约其他设备」时，确认新预约前需先取消的旧设备 */
let pendingSwitchFromEquipment = null;
/** 改约时需取消的旧时段（选完新时间后确认时用） */
let pendingSwitchFromSlots = null;
/** 为 true 时，下一次在日历上选时间会打开预约弹窗（改约其他设备流程） */
let awaitingTimeForSwitch = false;

function onSlotPointerDown(e, slot) {
  const room = document.getElementById('room').value;
  if (!room) return;
  const dayBookings = getBookingsForDay(formatDate(currentDate));
  const devices = getEquipmentByRoom(room).map(e => e.name);
  // 该时段至少有一台设备空闲即可选
  const hasFree = devices.some(name => !(dayBookings[name] && dayBookings[name][slot]));
  if (!hasFree) return;
  e.preventDefault();
  dragStartSlot = slot;
  dragEndSlot = slot;
  isDragging = false;
  updateDragRange();
  document.addEventListener('mousemove', onDocMouseMove);
  document.addEventListener('mouseup', onDocMouseUp);
}

function onMineRunPointerDown(e, slotStart, slotEnd, equipmentNames) {
  if (e.target.closest('.mine-action-btn')) return;
  e.preventDefault();
  mouseDownOnMineRun = { slotStart, slotEnd, equipmentNames };
  document.addEventListener('mouseup', onMineRunMouseUp);
}

function onMineRunMouseUp() {
  document.removeEventListener('mouseup', onMineRunMouseUp);
  if (mouseDownOnMineRun == null) return;
  pendingCancelRun = {
    slotStart: mouseDownOnMineRun.slotStart,
    slotEnd: mouseDownOnMineRun.slotEnd,
    equipmentNames: mouseDownOnMineRun.equipmentNames
  };
  mouseDownOnMineRun = null;
  const room = document.getElementById('room').value;
  openCancelModal();
}

function onDocMouseMove(e) {
  if (dragStartSlot == null) return;
  const target = e.target;
  let slot = null;
  const block = target.closest('.slot-block[data-slot]');
  if (block && !block.classList.contains('slot-taken')) {
    slot = block.dataset.slot;
  }
  // 拖到空白处（如块与块之间）时用 Y 坐标对应时间行
  if (slot == null) {
    const timeline = document.getElementById('dayTimeline');
    if (timeline && timeline.contains(target)) {
      const rect = timeline.getBoundingClientRect();
      const rowHeight = rect.height / TIME_SLOTS.length;
      const relY = e.clientY - rect.top;
      let rowIndex = Math.floor(relY / rowHeight);
      rowIndex = Math.max(0, Math.min(rowIndex, TIME_SLOTS.length - 1));
      slot = TIME_SLOTS[rowIndex];
    }
  }
  if (slot) {
    isDragging = true;
    dragEndSlot = slot;
    updateDragRange();
  }
}

function updateDragRange() {
  const range = dragStartSlot != null && dragEndSlot != null ? getSlotRange(dragStartSlot, dragEndSlot) : [];
  document.querySelectorAll('.slot-block[data-slot]').forEach(el => {
    el.classList.toggle('drag-range', range.includes(el.dataset.slot));
  });
}

function onDocMouseUp() {
  document.removeEventListener('mousemove', onDocMouseMove);
  document.removeEventListener('mouseup', onDocMouseUp);
  if (dragStartSlot == null) return;
  const room = document.getElementById('room').value;
  let slots;
  if (isDragging) {
    slots = getSlotRange(dragStartSlot, dragEndSlot);
  } else {
    slots = [dragStartSlot];
  }

  if (awaitingTimeForSwitch && slots.length > 0) {
    pendingBookingSlots = slots;
    awaitingTimeForSwitch = false;
    openBookingModal();
  } else if (isDragging && slots.length > 0) {
    pendingBookingSlots = slots;
    openBookingModal();
  } else if (slots.length > 0) {
    const dateStr = formatDate(currentDate);
    const dayBookings = getBookingsForDay(dateStr);
    const devices = getEquipmentByRoom(room).map(e => e.name);
    const user = devices.some(name => (dayBookings[name] && dayBookings[name][dragStartSlot]) === currentUser);
    if (user) {
      pendingCancelRun = {
        slotStart: dragStartSlot,
        slotEnd: dragStartSlot,
        equipmentNames: devices.filter(name => dayBookings[name] && dayBookings[name][dragStartSlot] === currentUser)
      };
      openCancelModal();
    } else {
      pendingBookingSlots = slots;
      openBookingModal();
    }
  }

  dragStartSlot = null;
  dragEndSlot = null;
  isDragging = false;
  updateDragRange();
}

// ---------- 预约确认弹窗 ----------
function openBookingModal() {
  if (!pendingBookingSlots || pendingBookingSlots.length === 0) return;
  const hintEl = document.getElementById('calendarHint');
  if (hintEl) hintEl.innerHTML = CALENDAR_HINT_DEFAULT;
  const room = document.getElementById('room').value;
  const startSlot = pendingBookingSlots[0];
  const endSlot = pendingBookingSlots[pendingBookingSlots.length - 1];
  const timeText = startSlot === endSlot ? startSlot : startSlot + ' － ' + endSlot;
  document.getElementById('bookingModalTime').textContent = '时间段：' + timeText;
  const list = document.getElementById('bookingModalEquipmentList');
  list.innerHTML = '';
  getEquipmentByRoom(room).forEach(equip => {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 cursor-pointer hover:bg-slate-100 rounded px-2 py-1.5';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'bookingEquipment';
    input.className = 'rounded border-slate-300 text-primary focus:ring-primary';
    input.value = equip.name;
    input.dataset.equipName = equip.name;
    const span = document.createElement('span');
    span.className = 'text-sm text-slate-700';
    span.textContent = equip.name + '（' + equip.manager + '）';
    label.appendChild(input);
    label.appendChild(span);
    list.appendChild(label);
  });
  document.getElementById('bookingModal').classList.remove('hidden');
  document.getElementById('bookingModal').classList.add('flex');
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.add('hidden');
  document.getElementById('bookingModal').classList.remove('flex');
  pendingBookingSlots = null;
  pendingSwitchFromEquipment = null;
  pendingSwitchFromSlots = null;
}

// ---------- 新建预约弹窗（选时间 + 设备，无需拖拽） ----------
function openNewBookingModal() {
  const room = document.getElementById('room').value;
  if (!room) {
    alert('请先选择房间。');
    return;
  }
  document.getElementById('newBookingDate').textContent = '预约日期：' + formatDateDisplay(currentDate);
  const startSelect = document.getElementById('newBookingStart');
  startSelect.innerHTML = '';
  TIME_SLOTS.forEach(slot => {
    const opt = document.createElement('option');
    opt.value = slot;
    opt.textContent = slot;
    startSelect.appendChild(opt);
  });
  updateNewBookingEndOptions();
  const list = document.getElementById('newBookingEquipmentList');
  list.innerHTML = '';
  getEquipmentByRoom(room).forEach(equip => {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 cursor-pointer hover:bg-slate-100 rounded px-2 py-1.5';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'newBookingEquipment';
    input.className = 'rounded border-slate-300 text-primary focus:ring-primary';
    input.value = equip.name;
    const span = document.createElement('span');
    span.className = 'text-sm text-slate-700';
    span.textContent = equip.name + '（' + equip.manager + '）';
    label.appendChild(input);
    label.appendChild(span);
    list.appendChild(label);
  });
  document.getElementById('newBookingModal').classList.remove('hidden');
  document.getElementById('newBookingModal').classList.add('flex');
}

function updateNewBookingEndOptions() {
  const startSelect = document.getElementById('newBookingStart');
  const endSelect = document.getElementById('newBookingEnd');
  const startSlot = startSelect.value;
  const startIdx = TIME_SLOTS.indexOf(startSlot);
  if (startIdx === -1) return;
  endSelect.innerHTML = '';
  for (let i = startIdx; i < TIME_SLOTS.length; i++) {
    const opt = document.createElement('option');
    opt.value = TIME_SLOTS[i];
    opt.textContent = TIME_SLOTS[i];
    endSelect.appendChild(opt);
  }
}

function closeNewBookingModal() {
  document.getElementById('newBookingModal').classList.add('hidden');
  document.getElementById('newBookingModal').classList.remove('flex');
}

function confirmNewBooking() {
  const room = document.getElementById('room').value;
  if (!room) return;
  const startSlot = document.getElementById('newBookingStart').value;
  const endSlot = document.getElementById('newBookingEnd').value;
  const chosen = document.querySelector('#newBookingEquipmentList input:checked');
  const equipName = chosen ? chosen.value : null;
  if (!equipName) {
    alert('请选择一台设备。');
    return;
  }
  const slots = getSlotRange(startSlot, endSlot);
  if (slots.length === 0) {
    alert('请选择有效的时段（结束时间不早于开始时间）。');
    return;
  }
  const dateStr = formatDate(currentDate);
  const dayBookings = getBookingsForDay(dateStr);
  const occupied = slots.some(s => (dayBookings[equipName] || {})[s]);
  if (occupied) {
    alert('该设备在此时段已被预约，请选择其他时段或设备。');
    return;
  }
  if (!bookings[dateStr]) bookings[dateStr] = {};
  if (!bookings[dateStr][equipName]) bookings[dateStr][equipName] = {};
  slots.forEach(s => {
    bookings[dateStr][equipName][s] = currentUser;
  });
  localStorage.setItem('bookings', JSON.stringify(bookings));
  closeNewBookingModal();
  showToast('预约成功');
  renderDayCalendar();
  if (!document.getElementById('overviewTodayModal').classList.contains('hidden')) {
    renderOverviewTodayContent(new Date());
  }
  if (!document.getElementById('overviewWeekModal').classList.contains('hidden')) {
    bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    renderOverviewWeekContent();
  }
}

function confirmBooking() {
  if (!pendingBookingSlots || pendingBookingSlots.length === 0) return;
  const chosen = document.querySelector('#bookingModalEquipmentList input:checked');
  const equipName = chosen ? chosen.value : null;
  if (!equipName) {
    alert('请选择一台设备。');
    return;
  }
  const dateStr = formatDate(currentDate);
  const dayBookings = getBookingsForDay(dateStr);
  const eq = dayBookings[equipName] || {};
  const freeSlots = pendingBookingSlots.filter(s => !eq[s]);
  if (freeSlots.length === 0) {
    alert('该设备在此时间段已被预约，请选择其他设备或时段。');
    return;
  }
  // 若从「改约其他设备」进入，先取消原设备在「原时段」的预约（pendingSwitchFromSlots）
  if (pendingSwitchFromEquipment && pendingSwitchFromEquipment.length > 0 && pendingSwitchFromSlots) {
    pendingSwitchFromEquipment.forEach(oldEquip => {
      if (!bookings[dateStr] || !bookings[dateStr][oldEquip]) return;
      pendingSwitchFromSlots.forEach(s => delete bookings[dateStr][oldEquip][s]);
      if (Object.keys(bookings[dateStr][oldEquip]).length === 0) delete bookings[dateStr][oldEquip];
    });
    if (Object.keys(bookings[dateStr] || {}).length === 0) delete bookings[dateStr];
    pendingSwitchFromEquipment = null;
    pendingSwitchFromSlots = null;
  }
  if (!bookings[dateStr]) bookings[dateStr] = {};
  if (!bookings[dateStr][equipName]) bookings[dateStr][equipName] = {};
  freeSlots.forEach(s => {
    bookings[dateStr][equipName][s] = currentUser;
  });
  localStorage.setItem('bookings', JSON.stringify(bookings));
  const msg = freeSlots.length < pendingBookingSlots.length ? '预约成功（部分时段已被占用）' : '预约成功';
  showToast(msg);
  closeBookingModal();
  renderDayCalendar();
  if (!document.getElementById('overviewTodayModal').classList.contains('hidden')) {
    renderOverviewTodayContent(new Date());
  }
  if (!document.getElementById('overviewWeekModal').classList.contains('hidden')) {
    renderOverviewWeekContent();
  }
}

// ---------- 点击「我的预约」时的选择弹窗 ----------
function openMineChoiceModal() {
  if (!pendingCancelRun || !pendingCancelRun.equipmentNames.length) return;
  const timeText = pendingCancelRun.slotStart === pendingCancelRun.slotEnd
    ? pendingCancelRun.slotStart
    : pendingCancelRun.slotStart + ' － ' + pendingCancelRun.slotEnd;
  document.getElementById('mineChoiceModalText').textContent =
    '时间段：' + timeText + '，已预约：' + pendingCancelRun.equipmentNames.join('、') + '。';
  document.getElementById('mineChoiceModal').classList.remove('hidden');
  document.getElementById('mineChoiceModal').classList.add('flex');
}

function closeMineChoiceModal() {
  document.getElementById('mineChoiceModal').classList.add('hidden');
  document.getElementById('mineChoiceModal').classList.remove('flex');
  pendingCancelRun = null;
}

const CALENDAR_HINT_DEFAULT = '请先选择房间。在日历中<strong>点击</strong>或<strong>拖拽</strong>选择时间段，再在弹窗中选择设备确认预约；点击自己的预约可取消。';
const CALENDAR_HINT_SWITCH_TIME = '请在地图上<strong>点击</strong>或<strong>拖拽</strong>选择新的时间段，再在弹窗中选择设备。';

/** 选择「预约本实验室其他设备」：关闭弹窗，让用户在地图上选新时间段，选完再打开预约弹窗 */
function chooseSwitchEquipment() {
  if (!pendingCancelRun) return;
  pendingSwitchFromEquipment = pendingCancelRun.equipmentNames.slice();
  pendingSwitchFromSlots = getSlotRange(pendingCancelRun.slotStart, pendingCancelRun.slotEnd);
  closeMineChoiceModal();
  awaitingTimeForSwitch = true;
  const hintEl = document.getElementById('calendarHint');
  if (hintEl) hintEl.innerHTML = CALENDAR_HINT_SWITCH_TIME;
  showToast('请在地图上点击或拖拽选择新的时间段');
}

/** 选择「取消该预约」：仅关闭选择弹窗并打开取消弹窗（不清 pendingCancelRun） */
function chooseCancelBooking() {
  document.getElementById('mineChoiceModal').classList.add('hidden');
  document.getElementById('mineChoiceModal').classList.remove('flex');
  openCancelModal();
}

// ---------- 取消预约弹窗 ----------
function openCancelModal() {
  if (!pendingCancelRun || !pendingCancelRun.equipmentNames.length) return;
  document.getElementById('cancelModalText').textContent =
    '此时间段您预约了：' + pendingCancelRun.equipmentNames.join('、') + '。确定全部取消？';
  document.getElementById('cancelModal').classList.remove('hidden');
  document.getElementById('cancelModal').classList.add('flex');
}

function closeCancelModal() {
  document.getElementById('cancelModal').classList.add('hidden');
  document.getElementById('cancelModal').classList.remove('flex');
  pendingCancelRun = null;
}

function confirmCancel() {
  if (!pendingCancelRun) return;
  const dateStr = formatDate(currentDate);
  pendingCancelRun.equipmentNames.forEach(equipName => {
    if (!bookings[dateStr] || !bookings[dateStr][equipName]) return;
    const slots = getSlotRange(pendingCancelRun.slotStart, pendingCancelRun.slotEnd);
    slots.forEach(s => delete bookings[dateStr][equipName][s]);
    if (Object.keys(bookings[dateStr][equipName]).length === 0) delete bookings[dateStr][equipName];
  });
  if (Object.keys(bookings[dateStr] || {}).length === 0) delete bookings[dateStr];
  localStorage.setItem('bookings', JSON.stringify(bookings));
  closeCancelModal();
  renderDayCalendar();
  // 若今日/本周概览弹窗正打开，用最新数据刷新（与 localStorage 一致）
  if (!document.getElementById('overviewTodayModal').classList.contains('hidden')) {
    bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    renderOverviewTodayContent(new Date());
  }
  if (!document.getElementById('overviewWeekModal').classList.contains('hidden')) {
    bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    renderOverviewWeekContent();
  }
}

function showToast(message) {
  const el = document.getElementById('toast');
  el.textContent = message || '预约成功';
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
}

// ---------- 今日 / 本周概览 ----------
/** 某设备在某日的预约时段（连续同用户合并为 run） */
function getBookedRunsForEquipment(dateStr, equipName) {
  const eq = (bookings[dateStr] || {})[equipName] || {};
  const runs = [];
  for (let i = 0; i < TIME_SLOTS.length; i++) {
    const slot = TIME_SLOTS[i];
    const user = eq[slot];
    if (!user) continue;
    if (runs.length > 0 && runs[runs.length - 1].user === user && runs[runs.length - 1].endIdx === i - 1) {
      runs[runs.length - 1].endIdx = i;
    } else {
      runs.push({ startIdx: i, endIdx: i, user });
    }
  }
  return runs.map(r => ({
    startSlot: TIME_SLOTS[r.startIdx],
    endSlot: TIME_SLOTS[r.endIdx],
    user: r.user
  }));
}

/** 指定日期所在周（周一至周日）的 7 个日期，不传则用 currentDate */
function getWeekDates(forDate) {
  const d = forDate ? new Date(forDate) : new Date(currentDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    dates.push(x);
  }
  return dates;
}

/** 渲染某日某房间的只读时间轴（用于今日概览弹窗） */
function renderDayTimelineReadonly(container, room, dateStr) {
  const dayBookings = getBookingsForDay(dateStr);
  const runs = getRunsByRoom(room, dayBookings);
  assignOverlapColumns(runs);
  container.classList.add('day-timeline', 'overview-day-timeline');
  container.style.setProperty('--time-slots-count', TIME_SLOTS.length);

  for (let i = 0; i < TIME_SLOTS.length; i++) {
    const label = document.createElement('div');
    label.className = 'time-slot-label';
    label.style.gridRow = String(i + 1);
    label.textContent = TIME_SLOTS[i];
    container.appendChild(label);
  }

  runs.forEach(run => {
    const N = run.endIdx - run.startIdx + 1;

    const runBlock = document.createElement('div');
    runBlock.className = 'run-block';
    runBlock.style.gridRow = (run.startIdx + 1) + ' / span ' + N;
    runBlock.style.setProperty('--run-column', String(run.column ?? 0));
    runBlock.style.setProperty('--run-total-columns', String(run.totalColumns ?? 1));

    const runContent = document.createElement('div');
    runContent.className = 'run-content overview-run ' + (run.status === 'empty' ? 'empty-run' : '');

    if (run.status === 'empty') {
      const block = document.createElement('div');
      block.className = 'slot-block slot-taken overview-empty';
      block.textContent = '空闲';
      runContent.appendChild(block);
    } else if (run.status === 'mine') {
      const block = document.createElement('div');
      block.className = 'slot-block slot-mine slot-run';
      const names = (run.equipmentNames || []).join('、');
      block.textContent = names || '';
      runContent.appendChild(block);
    } else {
      const block = document.createElement('div');
      block.className = 'slot-block slot-taken';
      const deviceUser = (run.equipmentNames && run.equipmentNames[0] && run.user)
        ? run.equipmentNames[0] + ' ' + run.user
        : '已满';
      block.textContent = deviceUser;
      runContent.appendChild(block);
    }

    runBlock.appendChild(runContent);
    container.appendChild(runBlock);
  });
}

function renderOverviewTodayContent(forDate) {
  const d = forDate || currentDate;
  const dateStr = formatDate(d);
  const dayBookings = getBookingsForDay(dateStr);
  const rooms = getRooms();
  const container = document.getElementById('overviewTodayContent');
  container.innerHTML = '';

  rooms.forEach(room => {
    const section = document.createElement('div');
    section.className = 'overview-today-room mb-5';
    const title = document.createElement('h4');
    title.className = 'font-semibold text-slate-800 mb-2 text-sm';
    title.textContent = '房间 ' + room;
    section.appendChild(title);
    const timelineWrap = document.createElement('div');
    timelineWrap.className = 'overview-timeline-wrap';
    renderDayTimelineReadonly(timelineWrap, room, dateStr);
    section.appendChild(timelineWrap);
    container.appendChild(section);
  });
}

/** 本周概览：在容器内渲染周历网格（时间行 × 7 天） */
function renderOverviewWeekContent() {
  const dates = getWeekDates(new Date());
  document.getElementById('overviewWeekRange').textContent = formatDateDisplay(dates[0]) + ' 至 ' + formatDateDisplay(dates[6]);
  const container = document.getElementById('overviewWeekContent');
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'week-overview-grid';
  grid.style.setProperty('--time-slots-count', TIME_SLOTS.length);

  // 表头：空白角 + 7 天
  const headerRow = document.createElement('div');
  headerRow.className = 'week-overview-row week-overview-header';
  const corner = document.createElement('div');
  corner.className = 'week-overview-cell week-overview-time';
  headerRow.appendChild(corner);
  dates.forEach(d => {
    const th = document.createElement('div');
    th.className = 'week-overview-cell week-overview-day-head';
    th.textContent = (d.getMonth() + 1) + '/' + d.getDate();
    th.title = formatDateDisplay(d);
    headerRow.appendChild(th);
  });
  grid.appendChild(headerRow);

  // 每一时间行
  for (let ti = 0; ti < TIME_SLOTS.length; ti++) {
    const row = document.createElement('div');
    row.className = 'week-overview-row';
    const timeCell = document.createElement('div');
    timeCell.className = 'week-overview-cell week-overview-time';
    timeCell.textContent = TIME_SLOTS[ti];
    row.appendChild(timeCell);

    dates.forEach(d => {
      const dateStr = formatDate(d);
      const dayBookings = getBookingsForDay(dateStr);
      const cell = document.createElement('div');
      cell.className = 'week-overview-cell week-overview-cell-content';

      const items = [];
      EQUIPMENT_LIST.forEach(equip => {
        const user = (dayBookings[equip.name] || {})[TIME_SLOTS[ti]];
        if (user) items.push({ name: equip.name, user });
      });
      if (items.length === 0) {
        cell.textContent = '—';
        cell.classList.add('week-overview-empty');
      } else {
        items.forEach(({ name, user }) => {
          const span = document.createElement('div');
          span.className = 'week-overview-booking' + (user === currentUser ? ' week-overview-mine' : '');
          span.textContent = name + ' ' + user;
          cell.appendChild(span);
        });
      }
      row.appendChild(cell);
    });
    grid.appendChild(row);
  }

  container.appendChild(grid);
}

function openOverviewToday() {
  bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
  const today = new Date();
  document.getElementById('overviewTodayDate').textContent = formatDateDisplay(today);
  renderOverviewTodayContent(today);
  document.getElementById('overviewTodayModal').classList.remove('hidden');
  document.getElementById('overviewTodayModal').classList.add('flex');
}

function closeOverviewToday() {
  document.getElementById('overviewTodayModal').classList.add('hidden');
  document.getElementById('overviewTodayModal').classList.remove('flex');
}

function openOverviewWeek() {
  bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
  renderOverviewWeekContent();
  document.getElementById('overviewWeekModal').classList.remove('hidden');
  document.getElementById('overviewWeekModal').classList.add('flex');
}

function closeOverviewWeek() {
  document.getElementById('overviewWeekModal').classList.add('hidden');
  document.getElementById('overviewWeekModal').classList.remove('flex');
}

// ---------- 日历渲染 ----------
/** 在「我的预约」块内追加「取消」按钮（仅当本房间设备数 > 1 时） */
function appendMineActionButtons(block, room, startSlot, endSlot, equipmentNames) {
  if (!room || getEquipmentByRoom(room).length <= 1) return;
  block.classList.add('slot-mine-has-actions');
  const wrap = document.createElement('div');
  wrap.className = 'mine-actions';
  const btnCancel = document.createElement('button');
  btnCancel.type = 'button';
  btnCancel.className = 'mine-action-btn mine-action-cancel';
  btnCancel.textContent = '取消';
  btnCancel.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    pendingCancelRun = { slotStart: startSlot, slotEnd: endSlot, equipmentNames: equipmentNames.slice() };
    openCancelModal();
  });
  wrap.appendChild(btnCancel);
  block.appendChild(wrap);
}

/** 找到包含 slotIndex 的 run */
function getRunAtSlot(runs, slotIndex) {
  for (let r = 0; r < runs.length; r++) {
    if (runs[r].startIdx <= slotIndex && slotIndex <= runs[r].endIdx) return runs[r];
  }
  return null;
}

function renderDayCalendar() {
  const dateStr = formatDate(currentDate);
  const dayBookings = getBookingsForDay(dateStr);
  const room = document.getElementById('room').value;
  const container = document.getElementById('dayTimeline');
  container.innerHTML = '';

  if (!room) {
    container.classList.remove('day-timeline');
    const runRow = document.createElement('div');
    runRow.className = 'run-row';
    runRow.style.gridRow = '1 / span ' + TIME_SLOTS.length;
    runRow.innerHTML = '<div class="run-time">请先选择房间</div><div class="run-content"></div>';
    container.appendChild(runRow);
    return;
  }

  container.classList.add('day-timeline');
  container.style.setProperty('--time-slots-count', TIME_SLOTS.length);
  const runs = getRunsByRoom(room, dayBookings);
  assignOverlapColumns(runs);

  for (let i = 0; i < TIME_SLOTS.length; i++) {
    const row = document.createElement('div');
    row.className = 'timeline-row';
    row.style.gridRow = String(i + 1);

    const label = document.createElement('div');
    label.className = 'time-slot-label';
    label.textContent = TIME_SLOTS[i];

    const contentCell = document.createElement('div');
    contentCell.className = 'timeline-row-content';

    row.appendChild(label);
    row.appendChild(contentCell);
    container.appendChild(row);
  }

  runs.forEach(run => {
    const N = run.endIdx - run.startIdx + 1;
    const startSlot = TIME_SLOTS[run.startIdx];
    const endSlot = TIME_SLOTS[run.endIdx];

    const runBlock = document.createElement('div');
    runBlock.className = 'run-block';
    runBlock.style.gridRow = (run.startIdx + 1) + ' / span ' + N;
    runBlock.style.gridColumn = '2';
    runBlock.style.setProperty('--run-column', String(run.column ?? 0));
    runBlock.style.setProperty('--run-total-columns', String(run.totalColumns ?? 1));

    const runContent = document.createElement('div');
    runContent.className = 'run-content ' + (run.status === 'empty' ? 'empty-run' : '');

    if (run.status === 'empty') {
      /* 每格一块、固定 44px，与时间轴对齐；拖拽时只高亮选中范围 */
      for (let j = run.startIdx; j <= run.endIdx; j++) {
        const slot = TIME_SLOTS[j];
        const block = document.createElement('div');
        block.className = 'slot-block slot-block-fixed';
        block.dataset.slot = slot;
        block.textContent = '点击或拖拽';
        block.addEventListener('mousedown', e => onSlotPointerDown(e, slot));
        runContent.appendChild(block);
      }
    } else if (run.status === 'mine') {
      const block = document.createElement('div');
      block.className = 'slot-block slot-mine slot-run';
      const names = (run.equipmentNames || []).join('、');
      const label = document.createElement('span');
      label.className = 'mine-label';
label.textContent = names || '';
        block.appendChild(label);
      const equipCount = getEquipmentByRoom(room).length;
      if (equipCount <= 1) {
        const hint = document.createElement('span');
        hint.className = 'mine-hint';
        hint.textContent = ' 点击取消';
        block.appendChild(hint);
        block.addEventListener('mousedown', e => onMineRunPointerDown(e, startSlot, endSlot, run.equipmentNames || []));
      } else {
        appendMineActionButtons(block, room, startSlot, endSlot, run.equipmentNames || []);
        block.addEventListener('mousedown', e => onMineRunPointerDown(e, startSlot, endSlot, run.equipmentNames || []));
      }
      runContent.appendChild(block);
    } else {
      const block = document.createElement('div');
      block.className = 'slot-block slot-taken';
      const deviceUser = (run.equipmentNames && run.equipmentNames[0] && run.user)
        ? run.equipmentNames[0] + ' ' + run.user
        : '已满';
      block.textContent = deviceUser;
      runContent.appendChild(block);
    }

    runBlock.appendChild(runContent);
    container.appendChild(runBlock);
  });
}

// 初始化：恢复登录状态（若有），并初始化房间下拉
restoreLoginIfSaved();
initRoomSelect();
