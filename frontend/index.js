let turfs = [];
let bookings = [];
let blockedSlots = [];

let currentBookingTab = 'upcoming'; // upcoming or past

function switchRole() {
  const role = document.getElementById("role-select").value;
  document.getElementById("user-section").style.display = (role === "user") ? "block" : "none";
  document.getElementById("admin-section").style.display = (role === "admin") ? "block" : "none";
  renderBookings();
  renderRequests();
  renderCalendar();
}
function addlogin() {
  const name = document.getElementById("i-name").value.trim();
  const email = document.getElementById("i-email").value.trim();
  const mobile = document.getElementById("i-num").value.trim();

  if (!name || !email|| !mobile) {
    alert("Please fill all turf details.");
    return;
  }
 
  document.getElementById("i-name").value = '';
  document.getElementById("i-email").value = '';
  document.getElementById("i-num").value = '';
}

function addTurf() {
  const name = document.getElementById("turf-name").value.trim();
  const location = document.getElementById("turf-location").value.trim();
  const price = document.getElementById("turf-price").value.trim();

  if (!name || !location || !price) {
    alert("Please fill all turf details.");
    return;
  }
  turfs.push({ name, location, price });
  updateTurfSelect();
  document.getElementById("turf-name").value = '';
  document.getElementById("turf-location").value = '';
  document.getElementById("turf-price").value = '';
}

function updateTurfSelect() {
  const turfSelect = document.getElementById("turf-select");
  const blockTurf = document.getElementById("block-turf");
  turfSelect.innerHTML = '';
  blockTurf.innerHTML = '';

  turfs.forEach((turf, index) => {
    let option = document.createElement("option");
    option.value = index;
    option.text = `${turf.name} - ${turf.location}`;
    turfSelect.appendChild(option);
    blockTurf.appendChild(option.cloneNode(true));
  });
}

function blockSlot() {
  const turfIndex = document.getElementById("block-turf").value;
  const date = document.getElementById("block-date").value;
  const time = document.getElementById("block-time").value;


  if (!date || turfIndex === '') {
    alert("Please select turf and date.");
    return;
  } 
 
  const turf = turfs[turfIndex];
  const key = `${date}_${time}_${turf.name}_${turf.location}`;
  if (blockedSlots.includes(key)) {
    alert("This slot is already blocked.");
    return;
  }
  blockedSlots.push(key);
  alert(`Blocked ${turf.name} on ${date} at ${time}`);
  renderCalendar();
}

function blockCheck(key) {
  return blockedSlots.includes(key);
}

function bookSlot() {
  const turfIndex = document.getElementById("turf-select").value;
  const date = document.getElementById("booking-date").value;
  const time = document.getElementById("time-slot").value;
   const name = document.getElementById("i-name").value.trim();
  const email = document.getElementById("i-email").value.trim();
  const mobile = document.getElementById("i-num").value.trim();
  if (!date || turfIndex === '') {
    alert("Please select all booking options.");
    return;
  }
   if (!name || !email|| !mobile) {
    alert("Enter your name,email and mobile number");
    return;
  }
  const turf = turfs[turfIndex];
  const bookingKey = `${date}_${time}_${turf.name}_${turf.location}`;
  if (blockCheck(bookingKey)) {
    alert("This slot is blocked.");
    return;
  }
  if (bookings.some(b => b.key === bookingKey && b.status !== "rejected")) {
    alert("Slot already booked!");
    return;
  }
  const booking = {

    turf: turf.name,
    location: turf.location,
    price: turf.price,
    date,
    time,
    key: bookingKey,
    status: "pending",
    name,
    email,
    mobile
  };
  bookings.push(booking);
  alert("Booking requested! Awaiting admin approval.");
  renderBookings();
  renderRequests();
  renderCalendar();
}

function switchBookingTab(tab) {
  currentBookingTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.classList.toggle('active', btn.textContent.toLowerCase() === tab)
  );
  renderBookings();
}

function renderBookings() {
  const list = document.getElementById("booking-list");
  if (!bookings) return;
  list.innerHTML = "";
  let now = new Date();
  let filteredBookings = bookings.filter(b =>
    currentBookingTab === "upcoming"
      ? new Date(`${b.date}T${slotTo24(b.time).start}`) >= now
      : new Date(`${b.date}T${slotTo24(b.time).start}`) < now
  );
  if (!filteredBookings.length) {
    list.innerHTML = `<li style="text-align:center;color:#b1b1b1;">No bookings.</li>`;
    return;
  }
  filteredBookings.forEach((b, idx) => {
    let statusText = '';
    if(b.status==="pending") statusText = " <span style='color:#b78912;font-weight:bold;'>(Pending Approval)</span>";
    if(b.status==="approved") statusText = " <span style='color:#1fbe7b;font-weight:bold;'>(Approved)</span>";
    if(b.status==="rejected") statusText = " <span style='color:#be1f44;font-weight:bold;'>(Rejected)</span>";
    let canModify = (b.status === 'pending' || b.status === 'approved');
    let actions = "";
    // For the demo, idx is the filtered index; need to get real index in bookings array:
    let globalIdx = bookings.findIndex(x => x === b);
    if (currentBookingTab === "upcoming" && canModify && b.status!=="rejected") {
      actions = `<span class="booking-actions">
        <button onclick="cancelBooking(${globalIdx})">Cancel</button>
        <button onclick="showRescheduleModal(${globalIdx})">Reschedule</button>
      </span>`;
    }
    list.innerHTML += `
      <li class="booking-card ${currentBookingTab} ${b.status}">
        <div>
          <b>${b.turf} (${b.location})</b><br>
          ${b.date}, ${b.time} - ₹${b.price} 
          ${statusText}<br>
          <small>User: ${b.name}| Email:${b.email}| Mobile:${b.mobile}</small>
        </div>
        ${actions}
      </li>`;
  });
}

// Utility: convert slot like "6AM-7AM" to 24H time
function slotTo24(slot) {
  // Expects format "hAM-hAM" or similar
  let [s, e] = slot.replace("PM", " PM").replace("AM", " AM").split("-");
  let start = to24(s.trim());
  let end = to24(e.trim());
  return {start, end};
}
function to24(s) {
  let [h, ampm] = s.split(/(AM|PM)/);
  let hour = parseInt(h);
  if(ampm==="PM" && hour<12) hour += 12;
  if(ampm==="AM" && hour===12) hour = 0;
  return hour.toString().padStart(2,'0')+":00";
}
// --- Modal for reschedule ---
function showRescheduleModal(index) {
  const booking = bookings[index];
  let html = `
    <div style="background:#fff;padding:1.2em;border-radius:8px;box-shadow:0 1px 12px #ccc;max-width:320px;
                position:fixed;top:40%;left:50%;transform:translate(-50%,-40%);z-index:99;">
      <span style="font-size:1.12em;font-weight:600;">Reschedule Booking</span><br><br>
      <label>Date: <input type="date" id="new-date" value="${booking.date}" min="${new Date().toISOString().split('T')[0]}"/>
      </label>
      <br/>
      <label>Time Slot: 
        <select id="new-time">
          <option>6AM-7AM</option>
          <option>7AM-8AM</option>
          <option>8AM-9AM</option>
          <option>5PM-6PM</option>
        </select>
      </label><br/><br/>
      <button onclick="confirmReschedule(${index})">Confirm</button>
      <button style="background:#e2e2e2;color:#333;" onclick="closeModal()">Cancel</button>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.13);z-index:98;" onclick="closeModal()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', `<div id="modal">${html}</div>`);
  document.getElementById('new-time').value = booking.time;
}
function closeModal() {
  document.getElementById('modal')?.remove();
}
function confirmReschedule(idx) {
  const newDate = document.getElementById("new-date").value;
  const newTime = document.getElementById("new-time").value;
  const booking = bookings[idx];
  const turf = turfs.find(t => t.name === booking.turf && t.location === booking.location);
  if (!newDate || !turf) { alert("Select valid date"); return; }
  const newKey = `${newDate}_${newTime}_${turf.name}_${turf.location}`;
  if (blockCheck(newKey)) { alert("This slot is blocked."); return; }
  if (bookings.some(b => b.key === newKey && b.status!=="rejected")) { alert("Slot already booked!"); return; }
  booking.date = newDate;
  booking.time = newTime;
  booking.key = newKey;
  booking.status = "pending"; // Revoke approval
  closeModal();
  renderBookings();
  renderRequests();
  renderCalendar();
}

function cancelBooking(index) {
  bookings[index].status = "rejected"; // Mark as rejected, don't remove to preserve booking history
  renderBookings();
  renderRequests();
  renderCalendar();
}

// -- ADMIN Features: Approval/Reject --
function renderRequests() {
  const reqList = document.getElementById("admin-requests");
  if (!reqList) return;
  reqList.innerHTML = "";
  bookings.forEach((b, idx) => {
    if (b.status === "pending") {
      reqList.innerHTML += `
        <li class="request-card">
          <div>
            <strong>${b.turf}</strong> (${b.location})<br>
            ${b.date}, ${b.time} - ₹${b.price}
            <small>User: ${b.name}| Email:${b.email}| Mobile:${b.mobile}</small>
          </div>
          <span class="request-actions">
            <button style="background:#1fbe7b" onclick="approveBooking(${idx})">Approve</button>
            <button style="background:#e04d4d" onclick="rejectBooking(${idx})">Reject</button>
          </span>
        </li>
      `;
    }
  });
}

function approveBooking(idx) {
  bookings[idx].status = "approved";
  renderRequests();
  renderBookings();
  renderCalendar();
}
function rejectBooking(idx) {
  bookings[idx].status = "rejected";
  renderRequests();
  renderBookings();
  renderCalendar();
}

// -- CALENDAR: daily or weekly view (admin) --
function renderCalendar() {
  const calendar = document.getElementById("calendar");
  const view = document.getElementById("calendar-view")?.value || 'weekly';
  calendar.innerHTML = "";
  let days = [];
  const today = new Date();
  if (view === "weekly") {
    for(let i=0; i<7; ++i) {
      let d = new Date(today); d.setDate(today.getDate()+i);
      days.push(d.toISOString().split('T')[0]);
    }
  } else {
    days.push(today.toISOString().split('T')[0]);
  }
  let showSlots = [];
  // Gather for each day, all bookings and blocks
  days.forEach(date => {
    // for each turf and time slot
    turfs.forEach(turf => {
      ["6AM-7AM","7AM-8AM","8AM-9AM","5PM-6PM"].forEach(time => {
        const key = `${date}_${time}_${turf.name}_${turf.location}`;
        // If booking present
        let b = bookings.find(b => b.key === key && b.status!=='rejected');
        if (b) {
          showSlots.push({
            turf: turf.name, location: turf.location, date, time,
            status: b.status,
            name:b.name,
            email:b.email,
            mobile:b.mobile
          });
        } else if (blockedSlots.includes(key)) {
          showSlots.push({
            turf: turf.name, location: turf.location, date, time,
            status: 'blocked'
          });
        }
      });
    });
  });
  if(!showSlots.length) {
    calendar.innerHTML = `<div style="width:100%;text-align:center;color:#b1b1b1">No bookings/blocks for selected period.</div>`;
    return;
  }
  showSlots.forEach(slot => {
    let statusLabel = "";
    let statusClass = "";
    switch(slot.status) {
      case "pending": statusClass = "pending"; statusLabel="Pending"; break;
      case "approved": statusClass = "approved"; statusLabel="Approved"; break;
      case "blocked": statusClass = "blocked"; statusLabel="Blocked"; break;
      case "rejected": statusClass = "rejected"; statusLabel="Rejected"; break;
    }
    let userDetailsHTML="";
    if(slot.status=='blocked'&& slot.name && slot.email && slot.mobile){
       userDetailsHTML=`
       <div style="margin-top:6px; font size:0.75rem;color:#444">
       Name:${slot.name}
       Email:${slot.email}
       Mobile:${slot.mobile}
       </div>`;

    }
    calendar.innerHTML += `
      <div class="calendar-slot ${statusClass}">
        <strong>${slot.turf}</strong> <br>
        ${slot.location}<br>
        ${slot.date}<br>
        ${slot.time}<br>
        <span style="font-size:0.99em;font-weight:600;">${statusLabel}</span>
      </div>
    `;
  });
}

// ---- INITIALIZATION ----
window.onload = function() {
  // Optionally pre-fill today as min
  let today = new Date().toISOString().split("T")[0];
  document.getElementById('booking-date').min = today;
  document.getElementById('block-date').min = today;
  // Add starter turf for demo
  if (turfs.length === 0) {
    turfs.push({ name: "Green Field", location: "City Center", price: "800" });
    turfs.push({ name: "River Side", location: "North Town", price: "700" });
  }
  updateTurfSelect();
  switchRole();
};