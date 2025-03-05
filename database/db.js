const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, '../tickets.db'), sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Ошибка открытия БД', err.message);
    } else {
        console.log('Подключена БД');
        db.run(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT,
                channelId TEXT,
                createdAt TEXT,
                closed INTEGER DEFAULT 0
            )
        `, (err) => {
            if (err) {
                console.error('Ошибка при создании БД таблицы:', err.message);
            } else {
                console.log('Таблица "Tickets" готова');
            }
        });
    }
});

module.exports = db;
