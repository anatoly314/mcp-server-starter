import { OAuthProvider } from './providers/OAuthProvider';
import { GoogleOAuthProvider } from './providers/google/GoogleOAuthProvider';
import { CustomOAuthProvider } from './providers/custom/CustomOAuthProvider';
import { envProvider } from '../envProvider';

export class OAuthFactory {
  static createProvider(): OAuthProvider {
    switch (envProvider.oauthProvider) {
      case 'google':
        return new GoogleOAuthProvider();
      case 'custom':
        return new CustomOAuthProvider();
      default:
        throw new Error(`Unsupported OAuth provider: ${envProvider.oauthProvider}`);
    }
  }
}