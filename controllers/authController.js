const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserPerusahaan } = require('../models');

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
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await UserPerusahaan.create({
            nama_perusahaan: companyName,
            email,
            password: hashedPassword,
            no_telp: phoneNumber,
            NIB,
            alamat: address
        });
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error registering user", error: err.message });
    }
};

const loginUser = async (req, res) => {
    const { NIB, password } = req.body;
    try {
        const user = await UserPerusahaan.findOne({ where: { NIB } });
        if (!user) {
            return res.status(401).json({ message: "Invalid NIB or password" });
        }
        if (!password || typeof password !== 'string' || !user.password || typeof user.password !== 'string') {
            return res.status(500).json({ message: "Password is missing or invalid in request or database" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid NIB or password" });
        }
        const token = jwt.sign(
            { id: user.id_perusahaan },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: "Error logging in", error: err.message });
    }
};

module.exports = { registerUser, loginUser };
