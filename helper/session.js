require("dotenv").config();
const mongoose = require('mongoose');
const fs = require("fs/promises");
const path = require("path");
const MAX_SESSION_TURNS = process.env.MAX_SESSION_TURNS || 10;
const { UserMemory, Reminder } = require('../models/db');

async function saveSession(sessionFile, sessionMessages) {
    const messagesToSave = sessionMessages.filter((m) => m.role !== "system");
    const data = {
        version: 1,
        updatedAt: new Date().toISOString(),
        messages: messagesToSave,
    };
    await fs.writeFile(sessionFile, JSON.stringify(data, null, 2), "utf-8");
}

async function loadSession(sessionFile) {
    try {
        const content = await fs.readFile(sessionFile, "utf-8");
        const data = JSON.parse(content);
        if (!data || !Array.isArray(data.messages)) return [];
        return data.messages;
    } catch (error) {
        return [];
    }
}

function trimSessionHistory(sessionMessages) {
    const userIndexes = [];
    for (let i = 1; i < sessionMessages.length; i++) {
        if (sessionMessages[i].role === "user") userIndexes.push(i);
    }
    if (userIndexes.length <= MAX_SESSION_TURNS) return;
    const firstIndexToKeep = userIndexes[userIndexes.length - MAX_SESSION_TURNS];
    sessionMessages.splice(1, firstIndexToKeep - 1);
}
const toolDefinitions = [
    {
        type: "function",
        function: {
            name: "save_user_memory",
            description: "Menyimpan informasi pribadi, preferensi, atau catatan penting pengguna ke memori jangka panjang.",
            parameters: {
                type: "object",
                properties: {
                    category: {
                        type: "string",
                        enum: ["preference", "personal_info", "project_note", "schedule_habit"],
                        description: "Kategori informasi yang ingin disimpan."
                    },
                    key: { type: "string", description: "Kata kunci unik untuk identifikasi memori (contoh: preferred_stack, meeting_schedule)." },
                    content: { type: "string", description: "Detail isi informasi yang ingin diingat." }
                },
                required: ["category", "key", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_user_memory",
            description: "Mencari atau memanggil kembali memori/catatan yang pernah disimpan sebelumnya berdasarkan kata kunci.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Kata kunci atau topik yang ingin dicari di memori." }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_reminder",
            description: "Membuat pengingat atau tugas baru dengan jadwal tanggal dan waktu tertentu.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "Judul atau isi pengingat (contoh: Rapat koordinasi SIMRS)." },
                    reminder_date: { type: "string", description: "Tanggal pengingat dalam format YYYY-MM-DD." },
                    reminder_time: { type: "string", description: "Waktu pengingat dalam format HH:mm:ss (opsional, misal 08:00:00)." },
                    description: { type: "string", description: "Catatan tambahan atau detail pengingat." }
                },
                required: ["title", "reminder_date"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_reminders",
            description: "Melihat daftar pengingat atau tugas aktif yang telah dibuat.",
            parameters: {
                type: "object",
                properties: {
                    include_completed: { type: "boolean", description: "Apakah ingin menyertakan tugas yang sudah selesai (default false)." }
                }
            }
        }
    }
];

// Mock storage lokal untuk memori & pengingat (dapat dihubungkan ke DB/Google Tasks API)
const memoryStore = {};
const reminderStore = [];

async function executeTool(name, args, nowa) {
    // 1. Bersihkan nama tool dari token tak terduga (misal: <|channel|>analysis)
    const cleanName = name.replace(/<\|.*?\|>.*$/, "").trim();

    switch (cleanName) {
        case "save_user_memory":
            await UserMemory.findOneAndUpdate(
                { nowa: nowa, key: args.key },
                {
                    category: args.category,
                    content: args.content,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
            return JSON.stringify({ success: true, message: `Memori '${args.key}' berhasil disimpan untuk user ${nowa}.` });

        case "get_user_memory":
            const foundMemory = await UserMemory.findOne({
                nowa: nowa,
                $or: [
                    { key: { $regex: args.query, $options: "i" } },
                    { content: { $regex: args.query, $options: "i" } }
                ]
            });

            if (foundMemory) {
                return JSON.stringify({ found: true, key: foundMemory.key, data: foundMemory });
            }
            return JSON.stringify({ found: false, message: "Informasi tersebut tidak ditemukan dalam memori." });

        case "create_reminder":
            const count = await Reminder.countDocuments({ nowa: nowa });
            const newReminder = new Reminder({
                id: count + 1,
                nowa: nowa,
                title: args.title,
                reminder_date: args.reminder_date,
                reminder_time: args.reminder_time || "09:00:00",
                description: args.description || "",
                completed: false
            });

            await newReminder.save();
            return JSON.stringify({
                success: true,
                reminder_id: newReminder.id,
                message: `Pengingat '${args.title}' berhasil diset untuk tanggal ${args.reminder_date} pukul ${newReminder.reminder_time}.`
            });

        case "list_reminders":
            const filter = { nowa: nowa };
            if (!args.include_completed) {
                filter.completed = false;
            }

            const activeReminders = await Reminder.find(filter).lean();
            return JSON.stringify({ success: true, count: activeReminders.length, reminders: activeReminders });

        default:
            throw new Error(`Tool ${name} (cleaned: ${cleanName}) tidak dikenali.`);
    }
}
module.exports = {
    saveSession,
    loadSession,
    trimSessionHistory,
    toolDefinitions,
    executeTool
};