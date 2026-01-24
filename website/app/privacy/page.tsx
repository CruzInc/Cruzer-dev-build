import Link from 'next/link'

export default function Privacy() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem', minHeight: '100vh' }}>
      <Link href="/" style={{ color: '#007AFF', marginBottom: '2rem', display: 'block' }}>← Back to Home</Link>
      
      <h1 style={{ marginBottom: '2rem' }}>Privacy Policy</h1>
      
      <div style={{ lineHeight: '1.8', color: '#333' }}>
        <p><strong>Last Updated: January 24, 2026</strong></p>
        
        <h2 style={{ marginTop: '2rem' }}>Introduction</h2>
        <p>By using Cruzer, you agree to this Privacy Policy. We take your privacy seriously and are committed to protecting your personal information.</p>

        <h2 style={{ marginTop: '2rem' }}>1. Information We Collect</h2>
        <p><strong>Account Information:</strong> Username, display name, profile information</p>
        <p><strong>Communication Data:</strong> Messages, calls, media you send or receive</p>
        <p><strong>Device Information:</strong> Device type, OS version, app version</p>
        <p><strong>Location Data:</strong> Only when you explicitly enable location sharing</p>

        <h2 style={{ marginTop: '2rem' }}>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul style={{ marginLeft: '2rem' }}>
          <li>Provide messaging, calling, and social features</li>
          <li>Enable AI-powered responses and translations</li>
          <li>Improve app performance and security</li>
          <li>Prevent abuse and unauthorized access</li>
        </ul>

        <h2 style={{ marginTop: '2rem' }}>3. Data Sharing</h2>
        <p>We do not sell your personal data. We only share information when required to operate core features or comply with legal obligations.</p>

        <h2 style={{ marginTop: '2rem' }}>4. Security</h2>
        <p>We implement industry-standard security measures including lock codes, biometric authentication, and encrypted communications.</p>

        <h2 style={{ marginTop: '2rem' }}>5. Your Rights</h2>
        <p>You can manage privacy settings, control location sharing, and request account deletion at any time.</p>

        <h2 style={{ marginTop: '2rem' }}>6. Contact Us</h2>
        <p>Questions about our privacy policy? Email us at <strong>cruzzerapps@gmail.com</strong></p>
      </div>
    </div>
  )
}
