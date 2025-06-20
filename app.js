require ('./config/dotenv');

const cors = require("cors");
const express = require('express');
const authRoutes = require('./routes/authRoutes'); 
const notificationRoutes = require('./routes/notificationRoutes');
const csrRoutes = require('./routes/csrRoutes');
const workshopRoutes = require('./routes/workshopRoutes');
const profileRoutes = require('./routes/profileRoutes');
const certificationRoutes = require('./routes/certificationRoutes');
const carbonSubmissionRoutes = require('./routes/carbonSubmissions');

const app = express();

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
});

app.use("/auth", authRoutes);
app.use("/notifications", notificationRoutes);
app.use('/csr', csrRoutes);
app.use('/workshops', workshopRoutes);
app.use('/profile', profileRoutes);
app.use('/certifications', certificationRoutes);
app.use('/carbon-submissions', carbonSubmissionRoutes);
