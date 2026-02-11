import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import { c as createServerFn } from "../server.js";
import "node:async_hooks";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
import "@tanstack/react-router";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_BASE = process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1";
const OPENROUTER_API_URL = `${API_BASE}/chat/completions`;
const aiChatCompletion_createServerFn_handler = createServerRpc({
  id: "c7e92d4a50b79a5d6601d37896e78bf7b90aa5d3855ea98c8eb4d06296f2e592",
  name: "aiChatCompletion",
  filename: "src/server/api/ai.ts"
}, (opts, signal) => aiChatCompletion.__executeServer(opts, signal));
const aiChatCompletion = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(aiChatCompletion_createServerFn_handler, async ({
  data
}) => {
  if (!OPENROUTER_API_KEY) {
    return {
      success: false,
      error: "AI API key is not configured"
    };
  }
  try {
    const body = {
      model: data.model,
      messages: data.messages,
      max_tokens: data.max_tokens ?? 500,
      temperature: data.temperature ?? 0.7
    };
    if (data.response_format) {
      body.response_format = data.response_format;
    }
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      return {
        success: false,
        error: `API error: ${response.status}`
      };
    }
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content ?? null;
    return {
      success: true,
      content
    };
  } catch (error) {
    console.error("OpenRouter proxy error:", error);
    return {
      success: false,
      error: "Failed to call AI API"
    };
  }
});
const aiListModels_createServerFn_handler = createServerRpc({
  id: "94d7828b20e4cb3a717adbca5dc58ad4f00a818138d6dff2d6cc88f801fbc808",
  name: "aiListModels",
  filename: "src/server/api/ai.ts"
}, (opts, signal) => aiListModels.__executeServer(opts, signal));
const aiListModels = createServerFn({
  method: "GET"
}).handler(aiListModels_createServerFn_handler, async () => {
  if (!OPENROUTER_API_KEY) {
    return {
      success: false,
      error: "AI API key is not configured"
    };
  }
  try {
    const response = await fetch(`${API_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`
      }
    });
    if (!response.ok) {
      return {
        success: false,
        error: `API error: ${response.status}`
      };
    }
    const data = await response.json();
    return {
      success: true,
      models: data.data || []
    };
  } catch (error) {
    console.error("OpenRouter list models error:", error);
    return {
      success: false,
      error: "Failed to fetch models"
    };
  }
});
export {
  aiChatCompletion_createServerFn_handler,
  aiListModels_createServerFn_handler
};
