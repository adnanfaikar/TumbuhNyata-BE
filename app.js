require ('./config/dotenv');

const cors = require("cors");
const express = require('express');
const authRoutes = require('./routes/authRoutes'); 
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use("/auth", authRoutes);
app.use("/notifications", notificationRoutes);
