// Import and re-export provider class and functions
import { MetricsProvider } from './provider.js';

export {
  MetricsProvider,
  isMetricsEnabled,
  type MetricsConfig,
} from './provider.js';

// Convenience function for shutdown
export async function shutdownMetrics(): Promise<void> {
  const provider = MetricsProvider.getInstance();
  if (provider) {
    await provider.shutdown();
  }
}

// Export all metrics as a unified object for convenience
export function getAllMetrics() {
  const provider = MetricsProvider.getInstance();
  if (!provider) {
    throw new Error('Metrics not initialized. Call MetricsProvider.initialize() first.');
  }
  return provider.getMetrics();
}