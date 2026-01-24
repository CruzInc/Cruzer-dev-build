import React from 'react'
import VersionChecker from './components/VersionChecker'

export default function Home() {
  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">Cruzer</span>
          </div>
          <ul className="nav-menu">
            <li><a href="#features">Features</a></li>
            <li><a href="#download">Download</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">The Future of Social Communication</h1>
          <p className="hero-subtitle">All-in-one platform for messaging, calling, location sharing, music integration, and so much more.</p>
          <div className="hero-buttons">
            <a href="#download" className="btn btn-primary">Download Now</a>
            <a href="#features" className="btn btn-secondary">Learn More</a>
          </div>
          <div className="hero-badge">
            <span className="badge">✨ Now Available on iOS & Android</span>
          </div>
        </div>
        <div className="hero-graphic">
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="screen-content">
                <div className="screen-bar">Cruzer</div>
                <div className="screen-messages">
                  <div className="msg msg-in">Hey! 👋</div>
                  <div className="msg msg-out">Hi there! 🎉</div>
                  <div className="msg msg-in">How are you?</div>
                  <div className="msg msg-out">Doing great! 🚀</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-header">
          <h2 className="section-title">Packed with Features</h2>
          <p className="section-subtitle">Everything you need in one powerful app</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Instant Messaging</h3>
            <p>Send messages with read receipts, typing indicators, and message reactions. Stay connected in real-time.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📞</div>
            <h3>Voice & Video Calls</h3>
            <p>Crystal-clear voice calls and multi-party conference calling. Connect with anyone, anywhere.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>Location Sharing</h3>
            <p>Share your location safely with friends. See who's nearby and plan meetups effortlessly.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎵</div>
            <h3>Music Integration</h3>
            <p>Spotify, Apple Music, and YouTube Music integration. Share what you're listening to.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Assistant</h3>
            <p>Smart replies, translations, and intelligent assistant. Let AI help you communicate better.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Privacy & Security</h3>
            <p>Lock codes, biometric authentication, and encrypted communications. Your privacy matters.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Friend Management</h3>
            <p>Easy friend requests, blocking, and contact management. Control who you connect with.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Customization</h3>
            <p>Custom themes, notification settings, and personalization. Make it yours.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>Advanced Features</h3>
            <p>Group chats, activity feeds, gamification, and much more. Endless possibilities.</p>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="highlights">
        <div className="highlight-box highlight-1">
          <div className="highlight-number">110+</div>
          <div className="highlight-text">Features</div>
        </div>
        <div className="highlight-box highlight-2">
          <div className="highlight-number">2</div>
          <div className="highlight-text">Platforms</div>
        </div>
        <div className="highlight-box highlight-3">
          <div className="highlight-number">24/7</div>
          <div className="highlight-text">Support</div>
        </div>
        <div className="highlight-box highlight-4">
          <div className="highlight-number">100%</div>
          <div className="highlight-text">Free</div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="download">
        <div className="download-content">
          <h2>Ready to Connect?</h2>
          <p>Download Cruzer now and join millions of users worldwide.</p>
          
          <VersionChecker />
          
          <div className="download-buttons">
            <a href="https://apps.apple.com" className="download-btn ios">
              <span className="btn-icon">🍎</span>
              <div className="btn-text">
                <div className="btn-label">Download on</div>
                <div className="btn-name">App Store</div>
              </div>
            </a>
            
            <a href="https://play.google.com" className="download-btn android">
              <span className="btn-icon">🤖</span>
              <div className="btn-text">
                <div className="btn-label">Get it on</div>
                <div className="btn-name">Google Play</div>
              </div>
            </a>
          </div>

          <p className="download-info">Or visit us on web at <strong>cruzer.app</strong></p>
        </div>
      </section>

      {/* About Section */}
      <section className="about">
        <h2>About Cruzer</h2>
        <div className="about-content">
          <div className="about-text">
            <h3>Why Choose Cruzer?</h3>
            <p>Cruzer is more than just a messaging app. It's a complete communication ecosystem designed to bring people together. With 110+ features covering everything from instant messaging to location sharing, music integration, and advanced AI capabilities, Cruzer replaces the need for multiple separate apps.</p>
            
            <h3>Built for You</h3>
            <p>Whether you want to chat with friends, share your location for meetups, discover new music together, or use our AI assistant to make communication smarter, Cruzer has you covered. Completely free, secure, and private.</p>
            
            <h3>Community First</h3>
            <p>Join our growing community on Discord, get instant support, and help shape the future of Cruzer. Your feedback matters, and we're constantly improving.</p>
          </div>
          <div className="about-stats">
            <div className="stat">
              <div className="stat-value">v1.0.0</div>
              <div className="stat-label">Current Version</div>
            </div>
            <div className="stat">
              <div className="stat-value">Free</div>
              <div className="stat-label">Forever</div>
            </div>
            <div className="stat">
              <div className="stat-value">Open</div>
              <div className="stat-label">Community</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Cruzer</h4>
            <p>The all-in-one social communication platform.</p>
            <div className="social-links">
              <a href="https://discord.gg/vGQweSv7j4" title="Discord">🔗 Discord</a>
              <a href="https://github.com/CruzInc" title="GitHub">🔗 GitHub</a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#download">Download</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms & Conditions</a></li>
              <li><a href="/security">Security</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: <a href="mailto:cruzzerapps@gmail.com">cruzzerapps@gmail.com</a></p>
            <p>Support: 24/7 Available</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2026 Cruzer. All rights reserved. Built with ❤️ by the Cruzer Team.</p>
        </div>
      </footer>
    </>
  )
}
