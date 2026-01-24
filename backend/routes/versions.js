const express = require('express');
const router = express.Router();

// In-memory store for versions (can be replaced with database)
// This would typically be updated when you publish new releases
const versionsData = {
  current: {
    version: '1.0.1',
    versionCode: 101,
    releaseDate: new Date('2026-01-24'),
    changelog: 'Fixed UI bugs, improved performance',
    downloads: {
      apk: 'https://github.com/CruzInc/Cruzer-dev-build/releases/download/v1.0.1/cruzer-1.0.1.apk',
      ios: 'https://apps.apple.com/app/cruzer',
      android: 'https://play.google.com/store/apps/details?id=com.cruzinc.cruzer'
    },
    downloadStats: {
      ios: 1250,
      android: 3480,
      apk: 892
    }
  },
  previous: [
    {
      version: '1.0.0',
      versionCode: 100,
      releaseDate: new Date('2026-01-20'),
      changelog: 'Initial release',
      downloads: {
        apk: 'https://github.com/CruzInc/Cruzer-dev-build/releases/download/v1.0.0/cruzer-1.0.0.apk',
        ios: 'https://apps.apple.com/app/cruzer',
        android: 'https://play.google.com/store/apps/details?id=com.cruzinc.cruzer'
      }
    }
  ]
};

// Get current version and download info
router.get('/current', (req, res) => {
  try {
    res.json({
      success: true,
      data: versionsData.current
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all version history
router.get('/history', (req, res) => {
  try {
    res.json({
      success: true,
      current: versionsData.current,
      previous: versionsData.previous
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check if update is available (for app to call)
router.post('/check-update', (req, res) => {
  try {
    const { currentVersion, platform } = req.body;
    
    if (!currentVersion) {
      return res.status(400).json({
        success: false,
        error: 'Current version is required'
      });
    }

    const current = versionsData.current;
    const updateAvailable = current.version !== currentVersion;
    
    res.json({
      success: true,
      updateAvailable,
      currentVersion: current.version,
      versionCode: current.versionCode,
      releaseDate: current.releaseDate,
      changelog: current.changelog,
      downloadUrl: platform ? current.downloads[platform.toLowerCase()] : current.downloads.apk,
      forceUpdate: false // Set to true if critical update
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get download stats
router.get('/download-stats', (req, res) => {
  try {
    res.json({
      success: true,
      data: versionsData.current.downloadStats,
      total: Object.values(versionsData.current.downloadStats).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
