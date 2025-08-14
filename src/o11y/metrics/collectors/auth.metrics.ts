import { getMeter } from '../provider.js';

const METER_NAME = 'mcp-server.auth';

export function initializeAuthMetrics() {
  const meter = getMeter(METER_NAME);

  const authValidationDuration = meter.createHistogram('auth_validation_duration_seconds', {
    description: 'Duration of authentication validation in seconds',
    unit: 's',
  });

  const authValidationTotal = meter.createCounter('auth_validations_total', {
    description: 'Total number of authentication validations',
  });

  const authValidationErrors = meter.createCounter('auth_validation_errors_total', {
    description: 'Total number of authentication validation errors',
  });

  const authCacheHits = meter.createCounter('auth_cache_hits_total', {
    description: 'Total number of authentication cache hits',
  });

  const authCacheMisses = meter.createCounter('auth_cache_misses_total', {
    description: 'Total number of authentication cache misses',
  });

  const authCacheEvictions = meter.createCounter('auth_cache_evictions_total', {
    description: 'Total number of authentication cache evictions',
  });

  const authCacheSize = meter.createObservableGauge('auth_cache_size', {
    description: 'Current size of authentication cache',
  });

  const oauthTokenExchangeDuration = meter.createHistogram('oauth_token_exchange_duration_seconds', {
    description: 'Duration of OAuth token exchange in seconds',
    unit: 's',
  });

  const oauthTokenExchangeTotal = meter.createCounter('oauth_token_exchanges_total', {
    description: 'Total number of OAuth token exchanges',
  });

  const oauthTokenExchangeErrors = meter.createCounter('oauth_token_exchange_errors_total', {
    description: 'Total number of OAuth token exchange errors',
  });

  return {
    authValidationDuration,
    authValidationTotal,
    authValidationErrors,
    authCacheHits,
    authCacheMisses,
    authCacheEvictions,
    authCacheSize,
    oauthTokenExchangeDuration,
    oauthTokenExchangeTotal,
    oauthTokenExchangeErrors,
  };
}