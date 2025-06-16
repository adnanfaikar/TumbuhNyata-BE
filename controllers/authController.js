const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserPerusahaan } = require('../models');

const registerUser = async (req, res) => {
    const { companyName, email, password, phoneNumber, NIB, address } = req.body;
    
    // Validate required fields
    if (!companyName || !email || !password || !phoneNumber || !NIB || !address) {
        return res.status(400).json({ 
            message: "All fields are required",
            missingFields: {
                companyName: !companyName,
                email: !email,
                password: !password,
                phoneNumber: !phoneNumber,
                NIB: !NIB,
                address: !address
            }
        });
    }
    
    // Validate password length
    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    
    // Validate NIB length
    if (NIB.length > 13) {
        return res.status(400).json({ message: "NIB cannot exceed 13 characters" });
    }

    // Validate phone number length
    if (phoneNumber.length > 50) {
        return res.status(400).json({ message: "Phone number too long (max 50 characters)" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }
    
    try {
        // Check if user already exists
        const existingUserByEmail = await UserPerusahaan.findOne({ where: { email } });
        if (existingUserByEmail) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const existingUserByNIB = await UserPerusahaan.findOne({ where: { NIB } });
        if (existingUserByNIB) {
            return res.status(400).json({ message: "NIB already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('Creating user with data:', {
            nama_perusahaan: companyName,
            email,
            no_telp: phoneNumber,
            NIB,
            alamat: address
        });

        const newUser = await UserPerusahaan.create({
            nama_perusahaan: companyName,
            email,
            password: hashedPassword,
            no_telp: phoneNumber,
            NIB,
            alamat: address
        });

        console.log('User created successfully:', newUser.id_perusahaan);
        res.status(201).json({ message: "User registered successfully", userId: newUser.id_perusahaan });
    } catch (err) {
        console.error('Registration error:', err);
        
        // Handle Sequelize validation errors
        if (err.name === 'SequelizeValidationError') {
            const validationErrors = err.errors.map(error => ({
                field: error.path,
                message: error.message,
                value: error.value
            }));
            return res.status(400).json({ 
                message: "Validation failed", 
                errors: validationErrors 
            });
        }
        
        // Handle unique constraint errors
        if (err.name === 'SequelizeUniqueConstraintError') {
            const field = err.errors[0]?.path || 'unknown';
            return res.status(400).json({ 
                message: `${field} already exists`,
                field: field
            });
        }
        
        res.status(500).json({ 
            message: "Error registering user", 
            error: err.message,
            errorName: err.name
        });
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
