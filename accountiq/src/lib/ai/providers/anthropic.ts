import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, ChatOptions } from "../types";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = process.env.AI_MODEL ?? DEFAULT_MODEL;
  }

  async streamChat({
    system,
    messages,
    maxTokens = 1024,
    onComplete,
  }: ChatOptions): Promise<ReadableStream<Uint8Array>> {
    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        let fullText = "";

        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();
        await onComplete?.(fullText);
      },
    });
  }
}
