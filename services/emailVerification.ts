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
      const url = `${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000/api'}/users/${userId}/send-verification`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }).then(res => res.json());

      console.log('[EmailVerification] Code sent:', response);
      return {
        success: response.success,
        message: response.message,
        expiresIn: response.expiresIn,
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
      const url = `${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000/api'}/users/${userId}/verify-email`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verificationCode }),
      }).then(res => res.json());

      console.log('[EmailVerification] Email verified:', response);
      return {
        success: response.success,
        message: response.message,
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
