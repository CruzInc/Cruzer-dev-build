import Link from 'next/link'

export default function Security() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem', minHeight: '100vh' }}>
      <Link href="/" style={{ color: '#007AFF', marginBottom: '2rem', display: 'block' }}>← Back to Home</Link>
      
      <h1 style={{ marginBottom: '2rem' }}>Security Information</h1>
      
      <div style={{ lineHeight: '1.8', color: '#333' }}>
        <p><strong>Last Updated: January 24, 2026</strong></p>
        
        <h2 style={{ marginTop: '2rem' }}>Standard Account Security</h2>
        <p>Every Cruzer account includes basic protection with identity verification, session tracking, and login alerts.</p>

        <h2 style={{ marginTop: '2rem' }}>🔐 What We Protect</h2>
        <ul style={{ marginLeft: '2rem' }}>
          <li>Account credentials and authentication</li>
          <li>Personal information and profile data</li>
          <li>Messages and communication content</li>
          <li>Location data (only when you share it)</li>
          <li>Payment information (where applicable)</li>
        </ul>

        <h2 style={{ marginTop: '2rem' }}>🔒 Security Features</h2>
        <ul style={{ marginLeft: '2rem' }}>
          <li>Lock codes and biometric authentication</li>
          <li>Encrypted communications</li>
          <li>Session management and logout controls</li>
          <li>Suspicious activity detection</li>
          <li>Device verification</li>
          <li>VIP permission controls</li>
        </ul>

        <h2 style={{ marginTop: '2rem' }}>Location Sharing Safety</h2>
        <p>Location sharing is optional and user-controlled. You choose:</p>
        <ul style={{ marginLeft: '2rem' }}>
          <li>When to share your location</li>
          <li>Who can see your location</li>
          <li>How long location sharing lasts</li>
          <li>When to pause or disable sharing</li>
        </ul>

        <h2 style={{ marginTop: '2rem' }}>Monitoring & Enforcement</h2>
        <p>Cruzer monitors for:</p>
        <ul style={{ marginLeft: '2rem' }}>
          <li>Feature abuse and unauthorized access</li>
          <li>Violations of platform rules</li>
          <li>Suspicious behavior and spam</li>
        </ul>
        <p><strong>Private messages are respected</strong> and only reviewed if required for legal compliance or severe safety risks.</p>

        <h2 style={{ marginTop: '2rem' }}>Your Responsibility</h2>
        <p>Keep your credentials secure, don't share access, and report suspicious activity immediately.</p>

        <h2 style={{ marginTop: '2rem' }}>Transparency & Control</h2>
        <p>You can:</p>
        <ul style={{ marginLeft: '2rem' }}>
          <li>View active sessions</li>
          <li>Control security settings</li>
          <li>Disable features like location sharing</li>
          <li>Request account review or deletion</li>
        </ul>

        <h2 style={{ marginTop: '2rem' }}>Need Help?</h2>
        <p>If you experience security issues, contact us immediately at <strong>cruzzerapps@gmail.com</strong></p>
      </div>
    </div>
  )
}
