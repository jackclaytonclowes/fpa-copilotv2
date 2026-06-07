import type { AIProvider } from "./types";

export type { AIProvider, ChatMessage, ChatOptions } from "./types";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "openai";

  switch (provider) {
    case "anthropic": {
      const { AnthropicProvider } = require("./providers/anthropic");
      return new AnthropicProvider();
    }
    case "openai":
    default: {
      const { OpenAIProvider } = require("./providers/openai");
      return new OpenAIProvider();
    }
  }
}
