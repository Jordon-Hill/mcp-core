// src/index.ts

import { runDemoAlignmentGateway } from './demo/demoAlignmentGateway';
import { getDefaultLdsQueue } from './core/envelopeService';
import { LdsIngestProcessor } from './gateways/ldsProcessor';

async function main() {
  console.log('[MCP] Starting alignment evaluation demo...\n');

  // Run the demo alignment gateway
  const result = await runDemoAlignmentGateway();

  // Print the alignment result
  console.log('[DemoAlignmentGateway] alignment eval result:', result);
  console.log('');

  // Process the LDS queue to show the envelope was received
  const queue = getDefaultLdsQueue();
  const processor = new LdsIngestProcessor(queue);
  
  console.log('[MCP] Processing LDS ingest queue...\n');
  await processor.processAll();

  console.log('\n[MCP] End-to-end test complete.');
}

main().catch((err) => {
  console.error('[MCP] Test failed:', err);
  process.exit(1);
});

