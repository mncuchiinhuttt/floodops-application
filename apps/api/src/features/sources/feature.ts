import type { RuntimeRegistry } from "../../shared/index";
import { fail } from "../../shared/index";
import { createScenarioRouter } from "../scenario/index";
import type { SourcesPorts } from "../scenario/index";
import { createKnowledgeRouter } from "../knowledge/index";
import { createScenarioAssetsRouter } from "../scenario-assets/index";
import { createMediaRegistry, createMediaRouter, createSourcesSessionObject } from "../media/index";
import { createReportsRegistry, createReportsRouter } from "../reports/index";
import { createSourcesRegistry } from "./runtime";
import { createSourcesRouter } from "./router";
export function createSourcesFeature(ports: SourcesPorts) {
  const registry: RuntimeRegistry = { commands: {}, views: {} };
  for (const part of [createSourcesRegistry(ports), createReportsRegistry(ports), createMediaRegistry()]) {
    for (const [key, value] of Object.entries(part.commands ?? {})) {
      if (registry.commands![key]) fail(503, "CONFIG_INCOMPLETE"); registry.commands![key] = value;
    }
    for (const [key, value] of Object.entries(part.views ?? {})) {
      if (registry.views![key]) fail(503, "CONFIG_INCOMPLETE"); registry.views![key] = value;
    }
  }
  return { registry, routers: [createScenarioRouter(ports), createSourcesRouter(), createKnowledgeRouter(), createReportsRouter(), createMediaRouter(), createScenarioAssetsRouter()],
    createSessionObject: (combinedRegistry: RuntimeRegistry = registry) => createSourcesSessionObject(combinedRegistry) };
}
