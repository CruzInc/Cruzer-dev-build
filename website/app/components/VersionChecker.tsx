'use client';

import React, { useState, useEffect } from 'react';

interface VersionInfo {
  version: string;
  releaseDate: string;
  changelog: string;
  downloads: {
    ios: string;
    android: string;
    apk: string;
  };
  downloadStats?: {
    ios: number;
    android: number;
    apk: number;
  };
}

export default function VersionChecker() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadStats, setDownloadStats] = useState<{ ios: number; android: number; apk: number } | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        setLoading(true);
        // Try multiple API endpoints (fallback strategy)
        const endpoints = [
          'https://cruzer-api.vercel.app/api/versions/current',
          'http://localhost:3001/api/versions/current',
          '/api/versions/current'
        ];

        let response = null;
        let lastError: Error | unknown = null;

        for (const endpoint of endpoints) {
          try {
            response = await fetch(endpoint, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) break;
          } catch (err) {
            lastError = err;
            continue;
          }
        }

        if (!response || !response.ok) {
          const errorMessage = lastError instanceof Error ? lastError.message : 'Failed to fetch version info';
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setVersion(data.data);
          if (data.data.downloadStats) {
            setDownloadStats(data.data.downloadStats);
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching version:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch version info');
        // Set fallback data
        setVersion({
          version: '1.0.1',
          releaseDate: new Date().toISOString(),
          changelog: 'Latest updates and improvements',
          downloads: {
            ios: 'https://apps.apple.com/app/cruzer',
            android: 'https://play.google.com/store/apps/details?id=com.cruzinc.cruzer',
            apk: 'https://github.com/CruzInc/Cruzer-dev-build/releases'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
    // Refresh version info every 1 hour
    const interval = setInterval(fetchVersion, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="version-checker loading">
        <div className="spinner"></div>
        <p>Checking for latest version...</p>
      </div>
    );
  }

  return (
    <div className="version-checker">
      {error && (
        <div className="version-warning">
          <span>⚠️ Using offline data</span>
        </div>
      )}
      
      <div className="version-info">
        <div className="version-header">
          <h3>Latest Version: <span className="version-badge">{version?.version}</span></h3>
          {version?.releaseDate && (
            <p className="release-date">
              Released: {new Date(version.releaseDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {version?.changelog && (
          <div className="changelog">
            <p><strong>What's New:</strong> {version.changelog}</p>
          </div>
        )}

        <div className="download-links">
          <h4>Download Now:</h4>
          <div className="links-grid">
            <a 
              href={version?.downloads.ios} 
              target="_blank" 
              rel="noopener noreferrer"
              className="download-link ios-link"
              title="Download on App Store"
            >
              🍎 App Store
            </a>
            <a 
              href={version?.downloads.android} 
              target="_blank" 
              rel="noopener noreferrer"
              className="download-link android-link"
              title="Get on Google Play"
            >
              🤖 Google Play
            </a>
            <a 
              href={version?.downloads.apk} 
              target="_blank" 
              rel="noopener noreferrer"
              className="download-link apk-link"
              title="Download APK directly"
            >
              📦 Direct APK
            </a>
          </div>
        </div>

        {downloadStats && (
          <div className="download-stats">
            <h4>Downloads:</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-icon">🍎</span>
                <span className="stat-count">{downloadStats.ios}</span>
                <span className="stat-label">iOS</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🤖</span>
                <span className="stat-count">{downloadStats.android}</span>
                <span className="stat-label">Android</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📦</span>
                <span className="stat-count">{downloadStats.apk}</span>
                <span className="stat-label">Direct</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .version-checker {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid rgba(0, 122, 255, 0.2);
          border-radius: 12px;
          padding: 24px;
          margin: 20px 0;
          color: #fff;
        }

        .version-checker.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 150px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 122, 255, 0.2);
          border-top-color: #007AFF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .version-warning {
          background: rgba(255, 149, 0, 0.1);
          border: 1px solid #FF9500;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #FFB84D;
        }

        .version-header {
          margin-bottom: 16px;
        }

        .version-header h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .version-badge {
          background: linear-gradient(135deg, #007AFF, #34C759);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 16px;
          font-weight: bold;
        }

        .release-date {
          color: #aaa;
          font-size: 14px;
          margin: 0;
        }

        .changelog {
          background: rgba(0, 122, 255, 0.1);
          border-left: 3px solid #007AFF;
          padding: 12px 16px;
          margin-bottom: 16px;
          border-radius: 6px;
          font-size: 14px;
        }

        .changelog p {
          margin: 0;
        }

        .download-links h4,
        .download-stats h4 {
          margin: 16px 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .links-grid,
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .download-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(0, 122, 255, 0.15);
          border: 1px solid rgba(0, 122, 255, 0.3);
          border-radius: 10px;
          color: #fff;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: pointer;
          font-size: 13px;
          gap: 8px;
        }

        .download-link:hover {
          background: rgba(0, 122, 255, 0.25);
          border-color: rgba(0, 122, 255, 0.5);
          transform: translateY(-2px);
        }

        .download-link.ios-link:hover {
          background: rgba(52, 199, 89, 0.15);
          border-color: rgba(52, 199, 89, 0.5);
        }

        .download-link.android-link:hover {
          background: rgba(0, 122, 255, 0.15);
          border-color: rgba(0, 122, 255, 0.5);
        }

        .download-link.apk-link:hover {
          background: rgba(255, 149, 0, 0.15);
          border-color: rgba(255, 149, 0, 0.5);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          background: rgba(52, 199, 89, 0.1);
          border: 1px solid rgba(52, 199, 89, 0.3);
          border-radius: 8px;
          gap: 4px;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-count {
          font-size: 18px;
          font-weight: bold;
          color: #34C759;
        }

        .stat-label {
          font-size: 12px;
          color: #aaa;
        }

        @media (max-width: 640px) {
          .version-checker {
            padding: 16px;
          }

          .links-grid,
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .version-header h3 {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
