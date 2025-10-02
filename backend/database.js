// Database utility functions and schema definition
const sqlite3 = require('sqlite3').verbose();

class QuizDatabase {
    constructor(dbPath = './quiz.db') {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database.');
            }
        });
    }

    // User management methods
    createUser(name, email, passwordHash, callback) {
        const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        this.db.run(query, [name, email, passwordHash], callback);
    }

    getUserByEmail(email, callback) {
        const query = 'SELECT * FROM users WHERE email = ?';
        this.db.get(query, [email], callback);
    }

    getUserById(id, callback) {
        const query = 'SELECT id, name, email, created_at FROM users WHERE id = ?';
        this.db.get(query, [id], callback);
    }

    // Quiz methods
    getQuestions(category, difficulty, limit, callback) {
        let query = 'SELECT * FROM questions WHERE 1=1';
        const params = [];
        
        if (category && category !== 'all') {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (difficulty && difficulty !== 'all') {
            query += ' AND difficulty = ?';
            params.push(difficulty);
        }
        
        query += ' ORDER BY RANDOM() LIMIT ?';
        params.push(limit);
        
        this.db.all(query, params, callback);
    }

    saveQuizResult(userId, result, callback) {
        const query = `
            INSERT INTO quiz_results (user_id, category, difficulty, score, total_questions, percentage, time_taken) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            userId, 
            result.category, 
            result.difficulty, 
            result.score, 
            result.total_questions, 
            result.percentage, 
            result.time_taken
        ];
        
        this.db.run(query, params, callback);
    }

    // Analytics methods
    getUserQuizHistory(userId, callback) {
        const query = `
            SELECT * FROM quiz_results 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 20
        `;
        this.db.all(query, [userId], callback);
    }

    getLeaderboard(callback) {
        const query = `
            SELECT * FROM leaderboard 
            ORDER BY average_score DESC, total_quizzes DESC 
            LIMIT 50
        `;
        this.db.all(query, callback);
    }

    getUserStats(userId, callback) {
        const query = `
            SELECT 
                u.id, u.name, u.email, u.created_at,
                COUNT(qr.id) as total_quizzes,
                AVG(qr.percentage) as average_score,
                MAX(qr.created_at) as last_quiz_date
            FROM users u
            LEFT JOIN quiz_results qr ON u.id = qr.user_id
            WHERE u.id = ?
            GROUP BY u.id
        `;
        this.db.get(query, [userId], callback);
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    }
}

module.exports = QuizDatabase;