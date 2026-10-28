/**
 * Server-Side Agentic AI Runner & Structured Tool Calling Orchestrator
 * Keeps all API keys safe on the server (never exposed to browser client).
 * Executes multi-turn tool calling loops with deterministic verification.
 */

import {
  AGENT_TOOL_DEFINITIONS,
  executeAgentTool,
  parseGoalToConfiguration,
} from '../src/utils/agentTools.js';
import { OPTIMIZATION_OBJECTIVES } from '../src/utils/optimizationEngine.js';

/**
 * Returns current server LLM credentials status without exposing keys.
 */
export function getLlmServerStatus() {
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const genericKey = process.env.LLM_API_KEY || '';

  const providerEnv = (process.env.LLM_PROVIDER || '').toLowerCase();
  let provider = 'none';
  let isConfigured = false;

  if (geminiKey || providerEnv === 'gemini') {
    provider = 'gemini';
    isConfigured = !!geminiKey || !!genericKey;
  } else if (openaiKey || providerEnv === 'openai') {
    provider = 'openai';
    isConfigured = !!openaiKey || !!genericKey;
  } else if (genericKey) {
    provider = 'generic';
    isConfigured = true;
  }

  const model = process.env.LLM_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');

  return {
    isConfigured,
    provider,
    model,
    hasGemini: !!geminiKey,
    hasOpenai: !!openaiKey,
  };
}

/**
 * Recursively formats a JSON schema property into Google Gemini v1beta API Schema format.
 * Maps types to UPPERCASE ('STRING', 'NUMBER', 'INTEGER', 'BOOLEAN', 'ARRAY', 'OBJECT')
 * and recursively processes nested 'properties' and 'items'.
 */
export function formatGeminiSchema(schema) {
  if (!schema || typeof schema !== 'object') {
    return { type: 'STRING' };
  }

  const rawType = (schema.type || 'string').toLowerCase();
  let type = 'STRING';

  if (rawType === 'number') {
    type = 'NUMBER';
  } else if (rawType === 'integer') {
    type = 'INTEGER';
  } else if (rawType === 'boolean') {
    type = 'BOOLEAN';
  } else if (rawType === 'array') {
    type = 'ARRAY';
  } else if (rawType === 'object') {
    type = 'OBJECT';
  }

  const result = { type };

  if (schema.description) {
    result.description = schema.description;
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    result.enum = schema.enum;
  }

  if (type === 'OBJECT') {
    const props = schema.properties || {};
    const propEntries = Object.entries(props);
    if (propEntries.length > 0) {
      result.properties = {};
      for (const [key, propDef] of propEntries) {
        result.properties[key] = formatGeminiSchema(propDef);
      }
    } else {
      // Safe fallback for open objects to prevent Gemini API 400 schema rejection
      result.properties = {
        data: {
          type: 'STRING',
          description: 'Serialized JSON or arbitrary key-value payload',
        },
      };
    }
    if (Array.isArray(schema.required) && schema.required.length > 0) {
      result.required = schema.required;
    }
  } else if (type === 'ARRAY') {
    result.items = schema.items
      ? formatGeminiSchema(schema.items)
      : { type: 'STRING' };
  }

  return result;
}

/**
 * Formats tool definitions for Google Gemini API format
 */
export function formatGeminiTools() {
  const functionDeclarations = AGENT_TOOL_DEFINITIONS.map((tool) => {
    const formattedParams = formatGeminiSchema(tool.parameters);
    return {
      name: tool.name,
      description: tool.description,
      parameters: formattedParams,
    };
  });

  return [{ functionDeclarations }];
}

/**
 * Formats tool definitions for OpenAI / OpenAI-compatible API format
 */
export function formatOpenAiTools() {
  return AGENT_TOOL_DEFINITIONS.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

// Re-export verified deterministic agent workflow from agentTools
export { runDeterministicAgentWorkflow } from '../src/utils/agentTools.js';

/**
 * Executes the Autonomous Agentic Loop using an external LLM with structured tool calling.
 * (Gemini or OpenAI format).
 */
export async function runLlmAgentLoop({ goal, baseline, constraints, fetchImpl = globalThis.fetch }) {
  const status = getLlmServerStatus();
  if (!status.isConfigured) {
    return {
      success: false,
      code: 'MISSING_CREDENTIALS',
      message: 'No LLM API key detected on the server. You can run the verified Deterministic Agent Workflow without an API key, or add GEMINI_API_KEY to your .env file.',
    };
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  const isGemini = status.provider === 'gemini' || !!process.env.GEMINI_API_KEY;

  if (isGemini) {
    return runGeminiAgentLoop({ goal, baseline, constraints, apiKey, model: status.model, fetchImpl });
  } else {
    return runOpenAiAgentLoop({ goal, baseline, constraints, apiKey, model: status.model, fetchImpl });
  }
}

/**
 * Gemini LLM Multi-Turn Tool Calling Execution Loop
 */
async function runGeminiAgentLoop({ goal, baseline, constraints, apiKey, model, fetchImpl }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const tools = formatGeminiTools();

  const systemInstruction = {
    parts: [
      {
        text: `You are an expert Digital IC Power Estimation and Optimization EDA Agent.
Your role is to formulate a plan to achieve the user's power optimization goal, execute verified deterministic engineering tools, inspect tool outputs, and independently verify the optimal candidate before recommending it.
CRITICAL RULES:
1. Never invent or hallucinate power, voltage, or frequency values. All numbers MUST originate from tool call results.
2. Formulate a clear plan first.
3. First call calculatePower to establish verified baseline dissipation.
4. Then call searchConfigurations with baseline and user constraints.
5. You MUST call verifyCandidate on any proposed candidate configuration before sign-off.
6. Then call compareConfigurations to calculate exact verified delta metrics.
7. Call recordExperiment to register the verified design run.
8. Provide a concise engineering reasoning summary for each step.`,
      },
    ],
  };

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `Optimization Goal: "${goal}"\nBaseline context: ${JSON.stringify(baseline || {})}\nConstraints context: ${JSON.stringify(constraints || {})}`,
        },
      ],
    },
  ];

  const timeline = [];
  let stepIndex = 1;
  let finalResponseText = '';
  let maxTurns = 6;
  let lastVerification = null;
  let recordedExperimentId = null;

  while (maxTurns > 0) {
    maxTurns--;

    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        tools,
        systemInstruction,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const message = candidate?.content;
    if (!message) break;

    contents.push(message);

    // Check for function calls
    const functionCalls = message.parts?.filter((p) => p.functionCall) || [];

    if (functionCalls.length === 0) {
      // Model returned text response
      const textPart = message.parts?.find((p) => p.text);
      if (textPart) {
        finalResponseText = textPart.text;
      }
      break;
    }

    // Execute each function call deterministically
    const toolResponseParts = [];
    for (const callPart of functionCalls) {
      const call = callPart.functionCall;
      const toolName = call.name;
      const toolArgs = call.args || {};

      const toolResult = executeAgentTool(toolName, toolArgs);

      if (toolName === 'verifyCandidate') {
        lastVerification = toolResult;
      }
      if (toolName === 'recordExperiment' && toolResult.success) {
        recordedExperimentId = toolResult.experimentId;
      }

      timeline.push({
        step: stepIndex++,
        type: 'tool_call',
        toolName,
        arguments: toolArgs,
        result: toolResult,
        reasoning: `Agent invoked ${toolName}. Deterministic result received.`,
        timestamp: Date.now(),
      });

      toolResponseParts.push({
        functionResponse: {
          name: toolName,
          response: typeof toolResult === 'object' && toolResult !== null ? toolResult : { output: toolResult },
        },
      });
    }

    contents.push({
      role: 'user',
      parts: toolResponseParts,
    });
  }

  return {
    success: true,
    mode: 'llm-gemini',
    goal,
    timeline,
    verification: lastVerification,
    finalReport: {
      summary: finalResponseText || 'Optimization workflow completed with verified deterministic tools.',
      experimentId: recordedExperimentId,
    },
  };
}

/**
 * OpenAI Multi-Turn Tool Calling Execution Loop
 */
async function runOpenAiAgentLoop({ goal, baseline, constraints, apiKey, model, fetchImpl }) {
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const endpoint = `${baseUrl}/chat/completions`;
  const tools = formatOpenAiTools();

  const messages = [
    {
      role: 'system',
      content: `You are an expert Digital IC Power Estimation and Optimization EDA Agent.
Execute verified deterministic engineering tools to achieve the user's power goal.
CRITICAL RULES:
1. Never invent or hallucinate numbers. All power, voltage, and frequency values must come from tool outputs.
2. Workflow: calculatePower -> searchConfigurations -> verifyCandidate -> compareConfigurations -> recordExperiment.
3. Be concise and professional.`,
    },
    {
      role: 'user',
      content: `Optimization Goal: "${goal}"\nBaseline: ${JSON.stringify(baseline || {})}\nConstraints: ${JSON.stringify(constraints || {})}`,
    },
  ];

  const timeline = [];
  let stepIndex = 1;
  let finalResponseText = '';
  let maxTurns = 6;
  let lastVerification = null;
  let recordedExperimentId = null;

  while (maxTurns > 0) {
    maxTurns--;

    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    if (!message) break;

    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      finalResponseText = message.content || '';
      break;
    }

    // Execute each tool call
    for (const toolCall of message.tool_calls) {
      const toolName = toolCall.function.name;
      let toolArgs = {};
      try {
        toolArgs = JSON.parse(toolCall.function.arguments || '{}');
      } catch (e) {
        toolArgs = {};
      }

      const toolResult = executeAgentTool(toolName, toolArgs);

      if (toolName === 'verifyCandidate') {
        lastVerification = toolResult;
      }
      if (toolName === 'recordExperiment' && toolResult.success) {
        recordedExperimentId = toolResult.experimentId;
      }

      timeline.push({
        step: stepIndex++,
        type: 'tool_call',
        toolName,
        arguments: toolArgs,
        result: toolResult,
        reasoning: `Agent invoked ${toolName}. Deterministic result received.`,
        timestamp: Date.now(),
      });

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }
  }

  return {
    success: true,
    mode: 'llm-openai',
    goal,
    timeline,
    verification: lastVerification,
    finalReport: {
      summary: finalResponseText || 'Optimization workflow completed with verified deterministic tools.',
      experimentId: recordedExperimentId,
    },
  };
}
