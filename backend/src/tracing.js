import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'amrutam-backend' }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_URL || 'http://localhost:4318/v1/traces'
  }),
  instrumentations: [getNodeAutoInstrumentations()] // Express, HTTP, pg, Redis — sab automatically trace honge
});

sdk.start();
console.log('Tracing initialized');