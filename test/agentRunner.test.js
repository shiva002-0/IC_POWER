import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getLlmServerStatus,
  runDeterministicAgentWorkflow,
  runLlmAgentLoop,
  formatGeminiSchema,
  formatGeminiTools,
  formatOpenAiTools,
} from '../server/agentRunner.js';
import { clearExperiments, getExperiments } from '../src/utils/experimentStorage.js';

describe('Agentic AI Runner - Deterministic Workflow Execution', () => {
  beforeEach(() => {
    clearExperiments();
  });

  test('executes complete 5-step deterministic tool workflow for feasible goal', async () => {
    const goal = 'Reduce dynamic power below 0.35 mW for a 20 pF block while keeping clock frequency at least 80 MHz.';
    const result = await runDeterministicAgentWorkflow({ goal });

    assert.equal(result.success, true);
    assert.equal(result.hasFeasibleSolution, true);
    assert.equal(result.mode, 'deterministic');

    // Verify timeline has plan + 5 tool calls
    assert.ok(result.timeline.length >= 5);
    const toolCalls = result.timeline.filter((t) => t.type === 'tool_call').map((t) => t.toolName);
    assert.deepEqual(toolCalls, [
      'calculatePower',
      'searchConfigurations',
      'verifyCandidate',
      'compareConfigurations',
      'recordExperiment',
    ]);

    // Verify verification passed
    assert.equal(result.verification.isVerified, true);
    assert.equal(result.verification.checks.minFrequency.passed, true);
    assert.equal(result.verification.checks.voltageRange.passed, true);
    assert.equal(result.verification.checks.powerBudget.passed, true);

    // Verify final report has verified numbers
    assert.equal(result.finalReport.success, true);
    assert.equal(result.finalReport.baselinePowerMw, 0.576);
    assert.equal(result.finalReport.optimalVoltageV, 0.8);
    assert.equal(result.finalReport.optimalFrequencyMhz, 80);
    assert.ok(result.finalReport.savingsPercent > 50);

    // Verify experiment was actually persisted
    const experiments = getExperiments();
    assert.equal(experiments.length, 1);
    assert.equal(experiments[0].id, result.finalReport.experimentId);
  });

  test('honestly halts and reports no feasible solution when power budget is impossible', async () => {
    const impossibleGoal = 'Achieve power budget of 0.100 mW with minimum clock frequency of 90 MHz.';
    const result = await runDeterministicAgentWorkflow({ goal: impossibleGoal });

    assert.equal(result.success, false);
    assert.equal(result.hasFeasibleSolution, false);
    assert.equal(result.verification.isVerified, false);
    assert.equal(result.finalReport.success, false);
    assert.ok(result.finalReport.summary.includes('No feasible candidate'));

    // No experiment should be recorded for unfeasible sign-off
    const experiments = getExperiments();
    assert.equal(experiments.length, 0);
  });
});

describe('Agentic AI Runner - Credential Management & Missing API Key', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_PROVIDER;
  });

  test('reports unconfigured status when no keys are present in process.env', () => {
    const status = getLlmServerStatus();
    assert.equal(status.isConfigured, false);
    assert.equal(status.hasGemini, false);
    assert.equal(status.hasOpenai, false);
  });

  test('runLlmAgentLoop returns MISSING_CREDENTIALS setup message instead of throwing when key is unset', async () => {
    const res = await runLlmAgentLoop({ goal: 'Optimize power' });
    assert.equal(res.success, false);
    assert.equal(res.code, 'MISSING_CREDENTIALS');
    assert.ok(res.message.includes('No LLM API key detected'));
  });

  test('REGRESSION: runDeterministicAgentWorkflow executes successfully with string inputs from React forms', async () => {
    const stringBaseline = {
      alpha: '0.20',
      effectiveCapacitancePf: '20',
      supplyVoltageV: '1.2',
      clockFrequencyMhz: '100',
    };
    const stringConstraints = {
      maxPowerMw: '0.350',
      minFrequencyMhz: '80',
      maxFrequencySearchMhz: '100',
      minVoltageV: '0.8',
      maxVoltageV: '1.2',
      voltageStepV: '0.1',
      frequencyStepMhz: '10',
    };

    const result = await runDeterministicAgentWorkflow({
      goal: 'Reduce dynamic power below 0.35 mW',
      baseline: stringBaseline,
      constraints: stringConstraints,
    });

    assert.equal(result.success, true);
    assert.equal(result.hasFeasibleSolution, true);
    assert.equal(result.verification.isVerified, true);
    assert.ok(Array.isArray(result.verification.violations));
    assert.doesNotThrow(() => result.verification.violations.join('; '));
    assert.ok(result.finalReport.savingsPercent > 50);
  });
});

describe('Agentic AI Runner - Mocked External LLM Tool Calling', () => {
  beforeEach(() => {
    clearExperiments();
  });

  test('orchestrates Gemini tool calling loop with mock fetch', async () => {
    process.env.GEMINI_API_KEY = 'mock-gemini-key-12345';
    process.env.LLM_PROVIDER = 'gemini';

    let requestIndex = 0;

    // Mock fetch simulating Gemini multi-turn tool calling
    const mockFetch = async (_url, options) => {
      requestIndex++;
      const body = JSON.parse(options.body);

      if (requestIndex === 1) {
        // Turn 1: Gemini decides to call calculatePower and searchConfigurations
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [
                    {
                      functionCall: {
                        name: 'calculatePower',
                        args: {
                          alpha: 0.2,
                          effectiveCapacitancePf: 20,
                          supplyVoltageV: 1.2,
                          clockFrequencyMhz: 100,
                        },
                      },
                    },
                    {
                      functionCall: {
                        name: 'searchConfigurations',
                        args: {
                          baseline: {
                            alpha: 0.2,
                            effectiveCapacitancePf: 20,
                            supplyVoltageV: 1.2,
                            clockFrequencyMhz: 100,
                          },
                          constraints: {
                            minVoltageV: 0.8,
                            maxVoltageV: 1.2,
                            voltageStepV: 0.1,
                            minFrequencyMhz: 80,
                            frequencyStepMhz: 10,
                            maxPowerMw: 0.35,
                          },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          }),
        };
      }

      if (requestIndex === 2) {
        // Turn 2: Inspects tool results and calls verifyCandidate + recordExperiment
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [
                    {
                      functionCall: {
                        name: 'verifyCandidate',
                        args: {
                          candidate: { voltageV: 0.8, frequencyMhz: 80 },
                          baseline: { alpha: 0.2, effectiveCapacitancePf: 20 },
                          constraints: { minFrequencyMhz: 80, minVoltageV: 0.8, maxVoltageV: 1.2, maxPowerMw: 0.35 },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          }),
        };
      }

      // Turn 3: Final recommendation text
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                role: 'model',
                parts: [
                  {
                    text: 'Optimization complete. Verified optimal operating point at 0.8V and 80MHz reduces dynamic power to 0.2048 mW.',
                  },
                ],
              },
            },
          ],
        }),
      };
    };

    const result = await runLlmAgentLoop({
      goal: 'Reduce dynamic power below 0.35 mW',
      fetchImpl: mockFetch,
    });

    assert.equal(result.success, true);
    assert.equal(result.mode, 'llm-gemini');
    assert.ok(result.timeline.length >= 3);
    assert.ok(result.finalReport.summary.includes('0.2048 mW'));

    delete process.env.GEMINI_API_KEY;
  });

  test('handles upstream API error cleanly without crash', async () => {
    process.env.GEMINI_API_KEY = 'mock-key';
    process.env.LLM_PROVIDER = 'gemini';

    const failingFetch = async () => ({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded.',
    });

    await assert.rejects(
      () => runLlmAgentLoop({ goal: 'Test error', fetchImpl: failingFetch }),
      /Gemini API error \(429\)/
    );

    delete process.env.GEMINI_API_KEY;
  });
});

describe('Agentic AI Runner - Tool Schema Formatting (Gemini & OpenAI)', () => {
  test('formatGeminiSchema recursively formats nested OBJECT properties with UPPERCASE types', () => {
    const jsonSchema = {
      type: 'object',
      description: 'Test container',
      properties: {
        num: { type: 'number', description: 'A number' },
        nestedObj: {
          type: 'object',
          description: 'Nested configuration',
          properties: {
            innerStr: { type: 'string' },
            innerBool: { type: 'boolean' },
          },
          required: ['innerStr'],
        },
        strList: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['num'],
    };

    const formatted = formatGeminiSchema(jsonSchema);

    assert.equal(formatted.type, 'OBJECT');
    assert.equal(formatted.description, 'Test container');
    assert.deepEqual(formatted.required, ['num']);
    assert.equal(formatted.properties.num.type, 'NUMBER');

    // Verify recursion
    assert.equal(formatted.properties.nestedObj.type, 'OBJECT');
    assert.equal(formatted.properties.nestedObj.properties.innerStr.type, 'STRING');
    assert.equal(formatted.properties.nestedObj.properties.innerBool.type, 'BOOLEAN');
    assert.deepEqual(formatted.properties.nestedObj.required, ['innerStr']);

    // Verify array items
    assert.equal(formatted.properties.strList.type, 'ARRAY');
    assert.equal(formatted.properties.strList.items.type, 'STRING');
  });

  test('formatGeminiTools guarantees that EVERY OBJECT parameter has non-empty properties', () => {
    const geminiTools = formatGeminiTools();
    assert.equal(geminiTools.length, 1);
    const decls = geminiTools[0].functionDeclarations;
    assert.equal(decls.length, 5);

    // Recursively check that any OBJECT type has a valid non-empty properties map
    function checkSchema(node, path) {
      if (!node) return;
      if (node.type === 'OBJECT') {
        assert.ok(
          node.properties && Object.keys(node.properties).length > 0,
          `Gemini schema violation: ${path} of type OBJECT has no properties specified`
        );
        for (const [key, child] of Object.entries(node.properties)) {
          checkSchema(child, `${path}.${key}`);
        }
      } else if (node.type === 'ARRAY' && node.items) {
        checkSchema(node.items, `${path}[]`);
      }
    }

    for (const tool of decls) {
      assert.ok(tool.name);
      assert.ok(tool.description);
      assert.equal(tool.parameters.type, 'OBJECT');
      checkSchema(tool.parameters, tool.name);
    }
  });

  test('formatOpenAiTools formats all 5 tools as functions with parameters intact', () => {
    const openAiTools = formatOpenAiTools();
    assert.equal(openAiTools.length, 5);
    openAiTools.forEach((tool) => {
      assert.equal(tool.type, 'function');
      assert.ok(tool.function.name);
      assert.ok(tool.function.description);
      assert.equal(tool.function.parameters.type, 'object');
    });
  });
});
