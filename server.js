const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const apiRoutes = require('./server/routes/api');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing API RESTful PostGIS & Data Spasial
app.use('/api', apiRoutes);

// Direktori aset data statis & legenda
app.use('/legend', express.static(path.join(__dirname, 'legend')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/webfonts', express.static(path.join(__dirname, 'webfonts')));

// Sajikan index.html utama dan aset root
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`[WebGIS Tesis Evan] Server Express & PostGIS Engine berjalan di http://${HOST}:${PORT}`);
});
