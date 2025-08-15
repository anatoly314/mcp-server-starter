import { metrics, Meter } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { logger } from '../../logger.js';

// Import metric initializers
import { initializeHttpMetrics } from './collectors/http.metrics.js';
import { initializeMcpMetrics } from './collectors/mcp/core.metrics.js';
import { initializeToolsMetrics } from './collectors/mcp/tools.metrics.js';
import { initializeResourcesMetrics } from './collectors/mcp/resources.metrics.js';
import { initializePromptsMetrics } from './collectors/mcp/prompts.metrics.js';
import { initializeAuthMetrics } from './collectors/auth.metrics.js';
import { initializeSystemMetrics } from './collectors/system.metrics.js';

export interface MetricsConfig {
  port: number;
  serviceName: string;
  serviceVersion: string;
}

export class MetricsProvider {
  private static instance?: MetricsProvider;
  private readonly provider: MeterProvider;
  private readonly prometheusExporter: PrometheusExporter;
  private initialized = false;
  private metrics: any;

  private constructor(config: MetricsConfig) {

    try {
      // Create resource with service information using v2 API
      const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: config.serviceName,
        [ATTR_SERVICE_VERSION]: config.serviceVersion,
      });

      // Create Prometheus exporter for pull-based metrics (hardcoded /metrics endpoint)
      this.prometheusExporter = new PrometheusExporter(
        {
          port: config.port,
          endpoint: '/metrics',
        },
        () => {
          logger.info(
            `Prometheus metrics endpoint ready at http://localhost:${config.port}/metrics`
          );
        }
      );

      // Create meter provider with Prometheus exporter as reader
      this.provider = new MeterProvider({
        resource,
        readers: [this.prometheusExporter],
      });

      // Register as global meter provider
      metrics.setGlobalMeterProvider(this.provider);

      // Initialize all metric collectors
      this.initializeCollectors();

      this.initialized = true;
      logger.info('Metrics provider initialized successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize metrics provider');
      throw error;
    }
  }

  private initializeCollectors(): void {
    try {
      // Initialize all metric categories and store them
      this.metrics = {
        ...initializeHttpMetrics(),
        ...initializeMcpMetrics(),
        ...initializeToolsMetrics(),
        ...initializeResourcesMetrics(),
        ...initializePromptsMetrics(),
        ...initializeAuthMetrics(),
        ...initializeSystemMetrics(),
      };
    } catch (error) {
      logger.error({ error }, 'Failed to initialize metrics collectors');
      throw new Error('Metrics initialization failed');
    }
  }

  public static initialize(config: MetricsConfig): MetricsProvider {
    if (MetricsProvider.instance) {
      logger.warn('Metrics provider already initialized');
      return MetricsProvider.instance;
    }

    MetricsProvider.instance = new MetricsProvider(config);
    return MetricsProvider.instance;
  }

  public static getInstance(): MetricsProvider | undefined {
    return MetricsProvider.instance;
  }

  public getMeter(name: string, version?: string): Meter {
    if (!this.initialized) {
      // Return a no-op meter if not properly initialized
      return metrics.getMeter('noop');
    }
    
    return metrics.getMeter(name, version);
  }

  public getMetrics(): any {
    if (!this.metrics) {
      throw new Error('Metrics not initialized');
    }
    return this.metrics;
  }

  public isEnabled(): boolean {
    return this.initialized;
  }

  public async shutdown(): Promise<void> {
    if (this.initialized) {
      try {
        await this.provider.shutdown();
        logger.info('Metrics provider shut down successfully');
        this.initialized = false;
        MetricsProvider.instance = undefined;
      } catch (error) {
        logger.error({ error }, 'Error shutting down metrics provider');
      }
    }
  }
}

// Export convenience functions that use the singleton
export function getMeter(name: string, version?: string): Meter {
  const instance = MetricsProvider.getInstance();
  if (!instance) {
    // Return no-op meter if provider not initialized
    return metrics.getMeter('noop');
  }
  return instance.getMeter(name, version);
}

export function isMetricsEnabled(): boolean {
  const instance = MetricsProvider.getInstance();
  return instance !== undefined && instance.isEnabled();
}