const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const registerUser = async (req, res) => {
    const { companyName, email, password, phoneNumber, NIB, address } = req.body;
    
    // Validate password length
    if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    
    // Validate NIB
    if (!NIB) {
        return res.status(400).json({ message: "NIB cannot be empty" });
    }
    
    if (NIB.length > 13) {
        return res.status(400).json({ message: "NIB cannot exceed 13 characters" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO user_perusahaan (nama_perusahaan, email, password, no_telp, NIB, alamat) VALUES (?, ?, ?,?, ?, ?)";
    db.query(sql, [companyName, email, hashedPassword, phoneNumber, NIB, address], (err, result) => {
        if (err) return res.status(500).json({ message: "Error registering user", error: err });
        res.status(201).json({ message: "User registered successfully" });
    });
};


const loginUser = (req, res) => {
    const { NIB, password } = req.body;

    const sql = "SELECT * FROM user_perusahaan WHERE NIB = ?";
    db.query(sql, [NIB], async (err, results) => {
        if (err) return res.status(500).json({ message: "Error logging in", error: err });

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid NIB or password" });
        }

        const user = results[0];


        if (!user.password) { 
            return res.status(500).json({ message: "Password is missing in database" });
        }

        const isMatch = await bcrypt.compare(password, user.password); 

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid NIB or password" });
        }
        
            // setelah bcrypt.compare sukses
            console.log('>> DB user object:', user);
            console.log('>> user.id_perusahaan =', user.id_perusahaan);

            const token = jwt.sign(
            { id: user.id_perusahaan },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
            );        
            res.json({ token });
    });
};



module.exports = { registerUser, loginUser };
