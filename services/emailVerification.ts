// Email verification service for the frontend
// Handles sending verification codes and verifying emails

interface VerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  expiresIn?: number;
}

class EmailVerificationService {
  /**
   * Send verification code to user's email
   */
  async sendVerificationCode(userId: string, email: string): Promise<VerificationResponse> {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';
      const url = `${baseUrl}/users/${userId}/send-verification`;
      
      console.log('[EmailVerification] Sending code to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EmailVerification] Server error:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('[EmailVerification] Code sent:', data);
      return {
        success: data.success,
        message: data.message,
        expiresIn: data.expiresIn,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[EmailVerification] Failed to send code:', errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Verify email with code
   */
  async verifyEmail(userId: string, verificationCode: string): Promise<VerificationResponse> {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';
      const url = `${baseUrl}/users/${userId}/verify-email`;
      
      console.log('[EmailVerification] Verifying code at:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verificationCode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EmailVerification] Server error:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('[EmailVerification] Email verified:', data);
      return {
        success: data.success,
        message: data.message,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[EmailVerification] Verification failed:', errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Resend verification code (for rate limiting, should wait before resending)
   */
  async resendVerificationCode(userId: string, email: string): Promise<VerificationResponse> {
    return this.sendVerificationCode(userId, email);
  }
}

export const emailVerificationService = new EmailVerificationService();
