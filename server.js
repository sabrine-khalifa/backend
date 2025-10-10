const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const reservationRoutes = require('./routes/reservation');
//comment

const app = express();

app.use(cors());
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
app.use('/api/users', require('./routes/auth'));

app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/reservations', reservationRoutes);
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/avis", require("./routes/avisRoutes"));


app.listen(process.env.PORT, () => {
console.log(`Server running on http://localhost:${process.env.PORT}`);
});


