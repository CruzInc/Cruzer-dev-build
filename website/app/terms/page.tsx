import Link from 'next/link'

export default function Terms() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem', minHeight: '100vh' }}>
      <Link href="/" style={{ color: '#007AFF', marginBottom: '2rem', display: 'block' }}>← Back to Home</Link>
      
      <h1 style={{ marginBottom: '2rem' }}>Terms & Conditions</h1>
      
      <div style={{ lineHeight: '1.8', color: '#333' }}>
        <p><strong>Last Updated: January 24, 2026</strong></p>
        
        <h2 style={{ marginTop: '2rem' }}>1. What Cruzer Is</h2>
        <p>Cruzer is a feature-rich social communication platform combining messaging, calling, location sharing, media, and productivity tools.</p>

        <h2 style={{ marginTop: '2rem' }}>2. Eligibility</h2>
        <p>You must be at least 13 years old to use Cruzer. Some features may require users to be 18+.</p>

        <h2 style={{ marginTop: '2rem' }}>3. User Accounts & Responsibility</h2>
        <p>You are responsible for:</p>
        <ul style={{ marginLeft: '2rem' }}>
          <li>Maintaining the security of your account and credentials</li>
          <li>All activity that occurs under your account</li>
          <li>Keeping your login credentials private</li>
        </ul>

        <h2 style={{ marginTop: '2rem' }}>4. Communication & Features</h2>
        <p>Cruzer provides messaging, voice calls, group chats, AI assistance, location sharing, media sharing, and social discovery tools.</p>

        <h2 style={{ marginTop: '2rem' }}>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul style={{ marginLeft: '2rem' }}>
          <li>Harass, threaten, or harm other users</li>
          <li>Share illegal, abusive, or exploitative content</li>
          <li>Attempt to hack or reverse-engineer the App</li>
          <li>Impersonate others or provide false information</li>
        </ul>

        <h2 style={{ marginTop: '2rem' }}>6. Content & User Data</h2>
        <p>You retain ownership of content you create. Cruzer processes content solely to provide the Service.</p>

        <h2 style={{ marginTop: '2rem' }}>7. Disclaimer</h2>
        <p>Cruzer is provided "as is" and "as available." We do not guarantee uninterrupted service or error-free performance.</p>

        <h2 style={{ marginTop: '2rem' }}>8. Limitation of Liability</h2>
        <p>Cruzer is not liable for data loss, damages, or disputes between users. Use of the App is at your own risk.</p>

        <h2 style={{ marginTop: '2rem' }}>9. Changes to Terms</h2>
        <p>We may update these Terms. Continued use means you accept the updated Terms.</p>

        <h2 style={{ marginTop: '2rem' }}>10. Contact</h2>
        <p>Questions? Email us at <strong>cruzzerapps@gmail.com</strong></p>
      </div>
    </div>
  )
}
