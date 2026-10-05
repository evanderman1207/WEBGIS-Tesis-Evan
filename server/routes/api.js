const express = require('express');
const router = express.Router();

const db = require('../config/db');
const povertyController = require('../controllers/povertyController');
const spatialController = require('../controllers/spatialController');

// Status Koneksi PostGIS & Server Health
router.get('/health', async (req, res) => {
  const postgisStatus = await db.checkPostgisConnection();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    engine: 'OpenLayers v8 + WebGL Wind Simulation',
    postgis: {
      active: postgisStatus.connected,
      version: db.getVersion() || (postgisStatus.connected ? 'PostGIS Active' : 'Embedded Spatial Engine')
    }
  });
});

// Kluster Kemiskinan
router.get('/poverty-clusters/stats', povertyController.getPovertySummaryStats);
router.get('/poverty-clusters/:id', povertyController.getPovertyClusterById);
router.get('/poverty-clusters', povertyController.getPovertyClusters);

// Analisis Spasial PostGIS
router.post('/spatial/buffer', spatialController.calculateBuffer);
router.get('/spatial/buffer', spatialController.calculateBuffer);

router.post('/spatial/overlay', spatialController.calculateOverlay);
router.get('/spatial/overlay', spatialController.calculateOverlay);

// Seluruh 10 Layer Geospasial Kotawaringin Timur
router.get('/spatial/districts', spatialController.getDistrictBoundaries);
router.get('/spatial/facilities/education', spatialController.getEducationFacilities);
router.get('/spatial/facilities/healthcare', spatialController.getHealthcareFacilities);
router.get('/spatial/facilities/health', spatialController.getHealthcareFacilities); // alias
router.get('/spatial/isochrone/education', spatialController.getIsochroneEducation);
router.get('/spatial/isochrone/hospital', spatialController.getIsochroneHospital);
router.get('/spatial/rivers', spatialController.getRivers);
router.get('/spatial/roads', spatialController.getRoads);
router.get('/spatial/poverty-patterns', spatialController.getSpatialPatternPoverty);
router.get('/spatial/tourism', spatialController.getTourism);
router.get('/spatial/disaster-zones', spatialController.getDisasterZones);

module.exports = router;
