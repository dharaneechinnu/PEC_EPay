require('dotenv').config();
const express = require('express');
const cors = require('cors');

const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB)
   .then(()=>{console.log("DataBase Connect Successfully...")})
  .catch(err=>{
        console.log("Error in While connection  : ",err);
    })

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Epay server running' });
});

app.get('/api/health', (req, res) => {
  res.json({ uptime: process.uptime(), env: process.env.NODE_ENV || 'development' });
});

// Mount API routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
