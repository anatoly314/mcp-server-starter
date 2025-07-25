import { OAuthUserInfo } from '../OAuthProvider';

interface TokenInfo {
  valid: boolean;
  userInfo?: OAuthUserInfo;
  expiresAt?: number;
  error?: string;
}

interface CachedTokenInfo extends TokenInfo {
  cachedAt: number;
}

interface GoogleTokenInfo {
  sub?: string;
  user_id?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  exp?: number;
  error?: string;
  error_description?: string;
}

export class GoogleTokenValidator {
  private cache: Map<string, CachedTokenInfo> = new Map();
  private readonly cacheMaxAge = 5 * 60 * 1000; // 5 minutes
  private readonly negativeCacheMaxAge = 30 * 1000; // 30 seconds for errors
  private readonly googleTokenInfoEndpoint = 'https://oauth2.googleapis.com/tokeninfo';
  private readonly maxCacheSize = 10000; // Prevent unbounded growth
  
  constructor() {
    // Clean up expired cache entries every minute
    setInterval(() => this.cleanupCache(), 60 * 1000);
  }

  /**
   * Validate a Google OAuth token using the tokeninfo endpoint
   * with caching to improve performance
   */
  async validateToken(token: string): Promise<TokenInfo> {
    // Check cache first
    const cached = this.cache.get(token);
    if (cached && this.isCacheValid(cached)) {
      console.error('Token validation cache hit');
      return {
        valid: cached.valid,
        userInfo: cached.userInfo,
        expiresAt: cached.expiresAt,
        error: cached.error
      };
    }

    // Cache miss - validate with Google
    console.error('Token validation cache miss - checking with Google');
    try {
      const response = await fetch(this.googleTokenInfoEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          access_token: token
        })
      });

      if (!response.ok) {
        const error = await response.text();
        const result: TokenInfo = {
          valid: false,
          error: `Token validation failed: ${error}`
        };
        
        // Cache negative results for a short time
        this.cacheResult(token, result);
        return result;
      }

      const tokenData = await response.json() as GoogleTokenInfo;
      
      // Extract user info from token data
      const userInfo: OAuthUserInfo = {
        id: tokenData.sub || tokenData.user_id,
        email: tokenData.email,
        name: tokenData.name,
        picture: tokenData.picture,
        email_verified: tokenData.email_verified,
        // Include other fields that might be useful
        given_name: tokenData.given_name,
        family_name: tokenData.family_name,
        locale: tokenData.locale
      };

      const result: TokenInfo = {
        valid: true,
        userInfo,
        expiresAt: tokenData.exp ? tokenData.exp * 1000 : undefined
      };

      // Cache successful validation
      this.cacheResult(token, result);
      return result;

    } catch (error: any) {
      console.error('Token validation error:', error);
      const result: TokenInfo = {
        valid: false,
        error: `Token validation error: ${error.message}`
      };
      
      // Cache errors for a short time
      this.cacheResult(token, result, this.negativeCacheMaxAge);
      return result;
    }
  }

  /**
   * Validate token and extract user info
   * Throws error if token is invalid
   */
  async getUserInfo(token: string): Promise<OAuthUserInfo> {
    const validation = await this.validateToken(token);
    
    if (!validation.valid || !validation.userInfo) {
      throw new Error(validation.error || 'Token validation failed');
    }
    
    return validation.userInfo;
  }

  private cacheResult(token: string, result: TokenInfo, maxAge?: number) {
    // Prevent cache from growing too large
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    const cached: CachedTokenInfo = {
      ...result,
      cachedAt: Date.now()
    };
    
    this.cache.set(token, cached);
    
    // If token has explicit expiry, use that for cache expiry
    if (result.expiresAt) {
      const timeUntilExpiry = result.expiresAt - Date.now();
      if (timeUntilExpiry > 0 && timeUntilExpiry < this.cacheMaxAge) {
        // Token expires before our cache would, so expire cache when token expires
        setTimeout(() => {
          this.cache.delete(token);
        }, timeUntilExpiry);
      }
    } else if (maxAge) {
      // Use provided max age
      setTimeout(() => {
        this.cache.delete(token);
      }, maxAge);
    }
  }

  private isCacheValid(cached: CachedTokenInfo): boolean {
    const now = Date.now();
    
    // Check if cache is too old
    if (now - cached.cachedAt > this.cacheMaxAge) {
      return false;
    }
    
    // Check if token has expired
    if (cached.expiresAt && now >= cached.expiresAt) {
      return false;
    }
    
    return true;
  }

  private cleanupCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [token, cached] of this.cache.entries()) {
      if (!this.isCacheValid(cached)) {
        this.cache.delete(token);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.error(`Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Clear all cached validations
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
export const googleTokenValidator = new GoogleTokenValidator();