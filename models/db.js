// models.js
const mongoose = require('mongoose');

// Skema untuk User Memory
const userMemorySchema = new mongoose.Schema({
    nowa: { type: String, required: true, index: true },
    key: { type: String, required: true },
    category: {
        type: String,
        enum: ["preference", "personal_info", "project_note", "schedule_habit"],
        required: true
    },
    content: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now }
});

// Skema untuk Reminder
const reminderSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    nowa: { type: String, required: true, index: true },
    title: { type: String, required: true },
    reminder_date: { type: String, required: true },
    reminder_time: { type: String, default: "09:00:00" },
    description: { type: String, default: "" },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Mencegah OverwriteModelError jika model dipanggil ulang
const UserMemory = mongoose.models.UserMemory || mongoose.model('UserMemory', userMemorySchema);
const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);

module.exports = { UserMemory, Reminder };