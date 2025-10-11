const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const reservationRoutes = require('./routes/reservation');
//comment

const app = express();


const allowedOrigins = [
  "https://openup-one.vercel.app", // ton site en ligne
  "http://localhost:3000"          // utile pour tes tests en local
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log("🔄 Déploiement forcé - 10 octobre 2025");
console.log("server est chargée");

// Connexion DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.get("/", (req, res) => {
  res.send("✅ Backend Render is running with CORS enabled!");
});
app.use('/api/users', require('./routes/auth'));

app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/reservations', reservationRoutes);
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/avis", require("./routes/avisRoutes"));


app.listen(process.env.PORT, () => {
console.log(`Server running on http://localhost:${process.env.PORT}`);
});


