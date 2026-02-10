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

function login() {
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value;
  if (user === 'admin' && pass === 'lab123') {
    currentUser = 'admin';
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
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login').classList.remove('hidden');
}

function prevDay() {
  currentDate.setDate(currentDate.getDate() - 1);
  renderDateNav();
  renderDayCalendar();
}

function nextDay() {
  currentDate.setDate(currentDate.getDate() + 1);
  renderDateNav();
  renderDayCalendar();
}

function goToToday() {
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

/** 按房间聚合：将时段按「可预约/已满/我的预约」合并成连续块。同一房间同一时段只允许一台设备被预约。 */
function getRunsByRoom(room, dayBookings) {
  const devices = getEquipmentByRoom(room).map(e => e.name);
  const runs = [];
  for (let i = 0; i < TIME_SLOTS.length; i++) {
    const slot = TIME_SLOTS[i];
    const myEquip = [];
    let anyBooked = false;
    devices.forEach(name => {
      const user = dayBookings[name] && dayBookings[name][slot];
      if (user) {
        anyBooked = true;
        if (user === currentUser) myEquip.push(name);
      }
    });
    // 该时段该房间只要有一台被预约则视为已占满，不能再预约其他设备
    const hasFree = !anyBooked;
    const status = myEquip.length > 0 ? 'mine' : (hasFree ? 'empty' : 'full');
    const equipmentNames = myEquip.length > 0 ? myEquip : null;
    if (runs.length > 0 && runs[runs.length - 1].status === status) {
      runs[runs.length - 1].endIdx = i;
      if (status === 'mine') {
        equipmentNames.forEach(n => {
          if (!runs[runs.length - 1].equipmentNames.includes(n)) runs[runs.length - 1].equipmentNames.push(n);
        });
      }
    } else {
      runs.push({ startIdx: i, endIdx: i, status, equipmentNames: status === 'mine' ? equipmentNames.slice() : null });
    }
  }
  return runs;
}

let dragStartSlot = null;
let dragEndSlot = null;
let isDragging = false;
let mouseDownOnMineRun = null;
let pendingBookingSlots = null;
let pendingCancelRun = null;

function onSlotPointerDown(e, slot) {
  const room = document.getElementById('room').value;
  if (!room) return;
  const dayBookings = getBookingsForDay(formatDate(currentDate));
  const devices = getEquipmentByRoom(room).map(e => e.name);
  // 同一房间同一时段只允许一台设备：该时段只要有一台被预约则不可再选
  const hasFree = !devices.some(name => dayBookings[name] && dayBookings[name][slot]);
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
  // 拖拽时按鼠标 Y 对应时间线行计算 slot，避免与时间线错位
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
  document.querySelectorAll('.slot-block[data-slot]').forEach(el => {
    const slot = el.dataset.slot;
    const inRange = dragStartSlot != null && dragEndSlot != null && getSlotRange(dragStartSlot, dragEndSlot).includes(slot);
    el.classList.toggle('drag-range', inRange);
  });
}

function onDocMouseUp() {
  document.removeEventListener('mousemove', onDocMouseMove);
  document.removeEventListener('mouseup', onDocMouseUp);
  if (dragStartSlot == null) return;
  const room = document.getElementById('room').value;
  const slots = getSlotRange(dragStartSlot, dragEndSlot);

  if (isDragging && slots.length > 0) {
    pendingBookingSlots = slots;
    openBookingModal();
  } else {
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
      pendingBookingSlots = [dragStartSlot];
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
  if (!bookings[dateStr]) bookings[dateStr] = {};
  if (!bookings[dateStr][equipName]) bookings[dateStr][equipName] = {};
  freeSlots.forEach(s => {
    bookings[dateStr][equipName][s] = currentUser;
  });
  localStorage.setItem('bookings', JSON.stringify(bookings));
  closeBookingModal();
  const msg = freeSlots.length < pendingBookingSlots.length ? '预约成功（部分时段已被占用）' : '预约成功';
  showToast(msg);
  renderDayCalendar();
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
      block.textContent = names ? '我的预约（' + names + '）' : '我的预约';
      runContent.appendChild(block);
    } else {
      const block = document.createElement('div');
      block.className = 'slot-block slot-taken';
      block.textContent = '已满';
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
  renderOverviewWeekContent();
  document.getElementById('overviewWeekModal').classList.remove('hidden');
  document.getElementById('overviewWeekModal').classList.add('flex');
}

function closeOverviewWeek() {
  document.getElementById('overviewWeekModal').classList.add('hidden');
  document.getElementById('overviewWeekModal').classList.remove('flex');
}

// ---------- 日历渲染 ----------
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

  for (let i = 0; i < TIME_SLOTS.length; i++) {
    const runAtSlot = getRunAtSlot(runs, i);
    const isSingleSlot = runAtSlot && runAtSlot.endIdx === runAtSlot.startIdx;

    const row = document.createElement('div');
    row.className = 'timeline-row';
    row.style.gridRow = String(i + 1);

    const label = document.createElement('div');
    label.className = 'time-slot-label';
    label.textContent = TIME_SLOTS[i];

    const contentCell = document.createElement('div');
    contentCell.className = 'timeline-row-content';

    if (isSingleSlot) {
      const startSlot = TIME_SLOTS[runAtSlot.startIdx];
      const endSlot = TIME_SLOTS[runAtSlot.endIdx];
      if (runAtSlot.status === 'empty') {
        const block = document.createElement('div');
        block.className = 'slot-block';
        block.dataset.slot = startSlot;
        block.textContent = '点击或拖拽';
        block.addEventListener('mousedown', e => onSlotPointerDown(e, startSlot));
        contentCell.appendChild(block);
      } else if (runAtSlot.status === 'mine') {
        const block = document.createElement('div');
        block.className = 'slot-block slot-mine slot-run';
        const names = (runAtSlot.equipmentNames || []).join('、');
        block.textContent = names ? '我的预约（' + names + '）点击取消' : '我的预约（点击取消）';
        block.addEventListener('mousedown', e => onMineRunPointerDown(e, startSlot, endSlot, runAtSlot.equipmentNames || []));
        contentCell.appendChild(block);
      } else {
        const block = document.createElement('div');
        block.className = 'slot-block slot-taken';
        block.textContent = '已满';
        contentCell.appendChild(block);
      }
    }
    row.appendChild(label);
    row.appendChild(contentCell);
    container.appendChild(row);
  }

  runs.forEach(run => {
    const N = run.endIdx - run.startIdx + 1;
    if (N <= 1) return;
    const startSlot = TIME_SLOTS[run.startIdx];
    const endSlot = TIME_SLOTS[run.endIdx];

    const runBlock = document.createElement('div');
    runBlock.className = 'run-block';
    runBlock.style.gridRow = (run.startIdx + 1) + ' / span ' + N;
    runBlock.style.gridColumn = '2';

    const runContent = document.createElement('div');
    runContent.className = 'run-content ' + (run.status === 'empty' ? 'empty-run' : '');

    if (run.status === 'empty') {
      for (let j = run.startIdx; j <= run.endIdx; j++) {
        const slot = TIME_SLOTS[j];
        const block = document.createElement('div');
        block.className = 'slot-block';
        block.dataset.slot = slot;
        block.textContent = '点击或拖拽';
        block.addEventListener('mousedown', e => onSlotPointerDown(e, slot));
        runContent.appendChild(block);
      }
    } else if (run.status === 'mine') {
      const block = document.createElement('div');
      block.className = 'slot-block slot-mine slot-run';
      const names = (run.equipmentNames || []).join('、');
      block.textContent = names ? '我的预约（' + names + '）点击取消' : '我的预约（点击取消）';
      block.addEventListener('mousedown', e => onMineRunPointerDown(e, startSlot, endSlot, run.equipmentNames || []));
      runContent.appendChild(block);
    } else {
      const block = document.createElement('div');
      block.className = 'slot-block slot-taken';
      block.textContent = '已满';
      runContent.appendChild(block);
    }

    runBlock.appendChild(runContent);
    container.appendChild(runBlock);
  });
}

// 初始化
initRoomSelect();
