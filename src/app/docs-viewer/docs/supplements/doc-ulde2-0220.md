## Implement content-engine.ts

Here’s a clean, ULDE‑aligned content-engine.ts that:

- Wraps the plugin registry
- Runs the content + metadata pipelines
- Gives you a single place to evolve content behavior later

Stays framework‑agnostic (no Angular imports)

```
// src/app/ulde/core/content-engine/content-engine.ts

import {
  UldePluginRegistry,
  UldeDocNode,
  UldeContentResult,
} from '../runtime/ulde.types';

export interface UldeContentSource {
  id: string;
  path: string; // e.g. "/getting-started"
  title?: string;
  format: UldeDocNode['format'];
  rawContent: string;
  metadata?: Record<string, unknown>;
}

/**
 * ContentEngine is a thin orchestrator over the ULDE plugin registry.
 * It knows how to:
 *  - turn a content source into a UldeDocNode
 *  - run the metadata + content pipelines
 */
export class ContentEngine {
  constructor(private readonly registry: UldePluginRegistry) {}

  /**
   * Convert a generic content source into a UldeDocNode.
   */
  createDocNode(source: UldeContentSource): UldeDocNode {
    return {
      id: source.id,
      path: source.path,
      title: source.title,
      rawContent: source.rawContent,
      format: source.format,
      metadata: { ...(source.metadata ?? {}) },
    };
  }

  /**
   * Run both metadata and content pipelines for a given doc node.
   */
  async renderDoc(doc: UldeDocNode): Promise<UldeContentResult> {
    const pipeline = this.registry.buildPipeline();

    // First, let metadata transformers enrich/override metadata
    const enrichedMetadata = await pipeline.runMetadata(doc);

    // Then run the content pipeline with the enriched metadata
    const result = await pipeline.runContent({
      ...doc,
      metadata: enrichedMetadata,
    });

    return {
      ...result,
      metadata: enrichedMetadata,
    };
  }

  /**
   * Convenience: render directly from a content source.
   */
  async renderFromSource(source: UldeContentSource): Promise<UldeContentResult> {
    const doc = this.createDocNode(source);
    return this.renderDoc(doc);
  }
}

```
