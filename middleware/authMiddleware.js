const jwt = require('jsonwebtoken');

// modul untuk menghasilkan dan memverifikasi JWT

// memverifikasi token dalam request
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];

    if(!token) return res.status(403).json({ message: "Token Required" });
    
    const tokenParts = token.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
        return res.status(403).json({ message: "Invalid token format" });
    }

    jwt.verify(tokenParts[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token" });
        }
        req.user = decoded;
        next();
    });
};
module.exports = verifyToken;