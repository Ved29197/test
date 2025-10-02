const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Database setup - Use absolute path and better error handling
const dbPath = path.join(__dirname, 'quiz.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
        initializeDatabase();
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database tables with better error handling
function initializeDatabase() {
    console.log('Initializing database tables...');
    
    // Create tables sequentially to avoid race conditions
    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            question TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            incorrect_answers TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            score INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            percentage INTEGER NOT NULL,
            time_taken INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS leaderboard (
            user_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            total_quizzes INTEGER DEFAULT 0,
            average_score REAL DEFAULT 0,
            total_correct_answers INTEGER DEFAULT 0,
            last_activity DATETIME,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`
    ];

    // Create tables one by one
    let currentTable = 0;
    
    function createNextTable() {
        if (currentTable >= tables.length) {
            console.log('All tables created successfully');
            checkAndInsertSampleData();
            return;
        }
        
        db.run(tables[currentTable], function(err) {
            if (err) {
                console.error(`Error creating table ${currentTable + 1}:`, err.message);
            } else {
                console.log(`Table ${currentTable + 1} created/verified`);
            }
            currentTable++;
            createNextTable();
        });
    }
    
    createNextTable();
}

function checkAndInsertSampleData() {
    // Check if we have questions
    db.get("SELECT COUNT(*) as count FROM questions", (err, row) => {
        if (err) {
            console.error('Error checking questions:', err);
            return;
        }
        
        console.log(`Found ${row.count} questions in database`);
        
        if (row.count === 0) {
            console.log('Inserting sample questions...');
            insertSampleQuestions();
        } else {
            console.log('Questions already exist, skipping insertion');
        }
    });

    // Check if we have admin user
    db.get("SELECT COUNT(*) as count FROM users WHERE email = 'admin@quizmaster.com'", (err, row) => {
        if (err) {
            console.error('Error checking admin user:', err);
            return;
        }
        
        if (row.count === 0) {
            console.log('Creating default admin user...');
            const defaultPassword = bcrypt.hashSync('admin123', 10);
            db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, 
                ['Admin User', 'admin@quizmaster.com', defaultPassword], 
                function(err) {
                    if (err) {
                        console.error('Error creating admin user:', err.message);
                    } else {
                        console.log('Admin user created successfully');
                    }
                }
            );
        } else {
            console.log('Admin user already exists');
        }
    });
}

function insertSampleQuestions() {
    const sampleQuestions = [
        // Technology - Easy
        {
            category: "technology",
            difficulty: "easy",
            question: "What does HTML stand for?",
            correct_answer: "Hyper Text Markup Language",
            incorrect_answers: JSON.stringify([
                "High Tech Modern Language",
                "Hyper Transfer Markup Language",
                "Home Tool Markup Language"
            ])
        },
        {
            category: "technology",
            difficulty: "easy",
            question: "Which language runs in a web browser?",
            correct_answer: "JavaScript",
            incorrect_answers: JSON.stringify(["Java", "C", "Python"])
        },
        {
            category: "technology",
            difficulty: "easy",
            question: "What does CSS stand for?",
            correct_answer: "Cascading Style Sheets",
            incorrect_answers: JSON.stringify([
                "Creative Style Sheets",
                "Computer Style Sheets",
                "Colorful Style Sheets"
            ])
        },
        {
            category: "technology",
            difficulty: "easy",
            question: "Which company developed JavaScript?",
            correct_answer: "Netscape",
            incorrect_answers: JSON.stringify(["Microsoft", "Apple", "Google"])
        },
        {
            category: "technology",
            difficulty: "easy",
            question: "What year was JavaScript launched?",
            correct_answer: "1995",
            incorrect_answers: JSON.stringify(["1996", "1994", "None of the above"])
        },

        // Technology - Medium
        {
            category: "technology",
            difficulty: "medium",
            question: "Which of these is a JavaScript framework?",
            correct_answer: "React",
            incorrect_answers: JSON.stringify(["Django", "Laravel", "Spring"])
        },
        {
            category: "technology",
            difficulty: "medium",
            question: "What does API stand for?",
            correct_answer: "Application Programming Interface",
            incorrect_answers: JSON.stringify([
                "Advanced Programming Interface",
                "Automated Programming Interface",
                "Application Process Integration"
            ])
        },

        // Science - Easy
        {
            category: "science",
            difficulty: "easy",
            question: "Which planet is known as the Red Planet?",
            correct_answer: "Mars",
            incorrect_answers: JSON.stringify(["Venus", "Jupiter", "Saturn"])
        },
        {
            category: "science",
            difficulty: "easy",
            question: "What is H2O more commonly known as?",
            correct_answer: "Water",
            incorrect_answers: JSON.stringify(["Oxygen", "Hydrogen", "Carbon Dioxide"])
        },

        // History - Easy
        {
            category: "history",
            difficulty: "easy",
            question: "In which year did World War II end?",
            correct_answer: "1945",
            incorrect_answers: JSON.stringify(["1944", "1946", "1943"])
        },

        // Arts - Easy
        {
            category: "arts",
            difficulty: "easy",
            question: "Who painted the Mona Lisa?",
            correct_answer: "Leonardo da Vinci",
            incorrect_answers: JSON.stringify(["Pablo Picasso", "Vincent van Gogh", "Michelangelo"])
        }
    ];

    const stmt = db.prepare(`INSERT INTO questions (category, difficulty, question, correct_answer, incorrect_answers) 
                             VALUES (?, ?, ?, ?, ?)`);
    
    let inserted = 0;
    sampleQuestions.forEach(q => {
        stmt.run([q.category, q.difficulty, q.question, q.correct_answer, q.incorrect_answers], function(err) {
            if (err) {
                console.error('Error inserting question:', err.message);
            } else {
                inserted++;
                if (inserted === sampleQuestions.length) {
                    console.log(`Successfully inserted ${inserted} sample questions`);
                    stmt.finalize();
                }
            }
        });
    });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// User Registration
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error('Database error during registration:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (row) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password and create user
            const hashedPassword = await bcrypt.hash(password, 10);
            
            db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
                [name, email, hashedPassword], 
                function(err) {
                    if (err) {
                        console.error('Error creating user:', err);
                        return res.status(500).json({ error: 'Failed to create user' });
                    }

                    // Create token
                    const token = jwt.sign(
                        { userId: this.lastID, email: email },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    res.status(201).json({
                        message: 'User created successfully',
                        token: token,
                        user: {
                            id: this.lastID,
                            name: name,
                            email: email
                        }
                    });
                }
            );
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// User Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error('Database error during login:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        try {
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            // Create token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token: token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });
});

// Get questions by category and difficulty
app.get('/api/questions', authenticateToken, (req, res) => {
    const { category, difficulty, limit = 10 } = req.query;
    
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
    params.push(parseInt(limit));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching questions:', err);
            return res.status(500).json({ error: 'Failed to fetch questions' });
        }
        
        // Format the response
        const questions = rows.map(row => ({
            id: row.id,
            category: row.category,
            difficulty: row.difficulty,
            question: row.question,
            correct_answer: row.correct_answer,
            options: JSON.parse(row.incorrect_answers).concat([row.correct_answer]).sort(() => Math.random() - 0.5)
        }));
        
        res.json(questions);
    });
});

// Save quiz results
app.post('/api/results', authenticateToken, (req, res) => {
    const { category, difficulty, score, total_questions, percentage, time_taken } = req.body;
    const user_id = req.user.userId;
    
    if (!category || !difficulty || !score || !total_questions || !percentage) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const query = `INSERT INTO quiz_results (user_id, category, difficulty, score, total_questions, percentage, time_taken) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [user_id, category, difficulty, score, total_questions, percentage, time_taken], function(err) {
        if (err) {
            console.error('Error saving result:', err);
            return res.status(500).json({ error: 'Failed to save result' });
        }

        // Update leaderboard
        updateLeaderboard(user_id);
        
        res.json({ 
            success: true, 
            id: this.lastID,
            message: 'Result saved successfully'
        });
    });
});

// Update leaderboard
function updateLeaderboard(userId) {
    // Get user's quiz statistics
    const query = `
        SELECT 
            u.name,
            COUNT(qr.id) as total_quizzes,
            AVG(qr.percentage) as average_score,
            SUM(qr.score) as total_correct_answers,
            MAX(qr.created_at) as last_activity
        FROM users u
        LEFT JOIN quiz_results qr ON u.id = qr.user_id
        WHERE u.id = ?
        GROUP BY u.id
    `;
    
    db.get(query, [userId], (err, row) => {
        if (err) {
            console.error('Error updating leaderboard:', err);
            return;
        }
        
        // Insert or update leaderboard
        db.run(`
            INSERT OR REPLACE INTO leaderboard (user_id, name, total_quizzes, average_score, total_correct_answers, last_activity)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [userId, row.name, row.total_quizzes, row.average_score, row.total_correct_answers, row.last_activity]);
    });
}

// Get user's quiz history
app.get('/api/results/history', authenticateToken, (req, res) => {
    const user_id = req.user.userId;
    
    const query = `
        SELECT * FROM quiz_results 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 20
    `;
    
    db.all(query, [user_id], (err, rows) => {
        if (err) {
            console.error('Error fetching quiz history:', err);
            return res.status(500).json({ error: 'Failed to fetch quiz history' });
        }
        
        res.json(rows);
    });
});

// Get leaderboard
app.get('/api/leaderboard', authenticateToken, (req, res) => {
    const query = `
        SELECT * FROM leaderboard 
        ORDER BY average_score DESC, total_quizzes DESC 
        LIMIT 50
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching leaderboard:', err);
            return res.status(500).json({ error: 'Failed to fetch leaderboard' });
        }
        
        res.json(rows);
    });
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
    const user_id = req.user.userId;
    
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
    
    db.get(query, [user_id], (err, row) => {
        if (err) {
            console.error('Error fetching profile:', err);
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }
        
        res.json(row);
    });
});

// Update user profile
app.put('/api/profile', authenticateToken, (req, res) => {
    const user_id = req.user.userId;
    const { name, email, password } = req.body;
    
    let query = 'UPDATE users SET ';
    const params = [];
    
    if (name) {
        query += 'name = ?, ';
        params.push(name);
    }
    
    if (email) {
        query += 'email = ?, ';
        params.push(email);
    }
    
    if (password) {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to hash password' });
            }
            
            query += 'password = ?, ';
            params.push(hashedPassword);
            
            completeUpdate();
        });
    } else {
        completeUpdate();
    }
    
    function completeUpdate() {
        // Remove trailing comma and space
        query = query.slice(0, -2);
        query += ' WHERE id = ?';
        params.push(user_id);
        
        db.run(query, params, function(err) {
            if (err) {
                console.error('Error updating profile:', err);
                return res.status(500).json({ error: 'Failed to update profile' });
            }
            
            res.json({ success: true, message: 'Profile updated successfully' });
        });
    }
});

// Get categories
app.get('/api/categories', authenticateToken, (req, res) => {
    const query = 'SELECT DISTINCT category FROM questions ORDER BY category';
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
        
        const categories = rows.map(row => row.category);
        res.json(categories);
    });
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Quiz server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});