// backend/server.js
import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";
import {turfs, bookings, blocked} from "./data.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// USER ROUTES
app.get('/user/turfs', (req, res) => { res.json(turfs); });

app.get('/user/available', (req, res) => {
  const { turf, date } = req.query;
  const allSlots = ["6AM-7AM", "7AM-8AM", "8AM-9AM", "5PM-6PM"];
  const available = allSlots.filter(slot => {
    const key = `${date}_${slot}_${turf}`;
    const isBlocked = blocked.includes(key);
    const isBooked = bookings.find(b => b.key === key);
    return !isBlocked && !isBooked;
  });
  res.json(available);
});

app.post('/user/book', (req, res) => {
  const { turf, date, time } = req.body;
  const key = `${date}_${time}_${turf}`;
  if (blocked.includes(key)) return res.status(400).json({ error: 'This slot is blocked.' });
  if (bookings.find(b => b.key === key)) return res.status(400).json({ error: 'Slot already booked.' });
  const turfObj = turfs.find(t => t.name === turf);
  bookings.push({ turf, date, time, key, price: turfObj ? turfObj.price : 0 });
  res.json({ message: 'Booked successfully' });
});

app.post('/user/cancel', (req, res) => {
  const { key } = req.body;
  const index = bookings.findIndex(b => b.key === key);
  if (index >= 0) {
    bookings.splice(index, 1);
    return res.json({ message: 'Booking canceled' });
  }
  res.status(404).json({ error: 'Booking not found' });
});

// ADMIN ROUTES
app.post('/admin/add-turf', (req, res) => {
  const { name, location, price } = req.body;
  turfs.push({ name, location, price });
  res.json({ message: 'Turf added' });
});

app.post('/admin/block', (req, res) => {
  const { turf, date, time } = req.body;
  const key = `${date}_${time}_${turf}`;
  if (!blocked.includes(key)) blocked.push(key);
  res.json({ message: 'Slot blocked' });
});

app.get('/admin/bookings', (req, res) => res.json(bookings));
app.get('/admin/blocked', (req, res) => res.json(blocked));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
