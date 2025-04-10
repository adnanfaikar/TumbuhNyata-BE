require ('./config/dotenv');

const cors = require("cors");
const express = require('express');
const authRoutes = require('./routes/authRoutes'); 

const app = express();

app.use(cors()); 
app.use(express.json()); // parsing req.body dalam format JSON
app.use(express.urlencoded({ extended: true })); // parsing data URL-encoded

const PORT = process.env.PORT || 5000;
app.use("/auth", authRoutes);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

