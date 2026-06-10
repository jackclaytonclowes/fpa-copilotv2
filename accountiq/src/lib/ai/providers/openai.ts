import OpenAI from "openai";
import type { AIProvider, ChatOptions } from "../types";

const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.AI_MODEL ?? DEFAULT_MODEL;
  }

  async streamChat({
    system,
    messages,
    maxTokens = 1024,
    onComplete,
  }: ChatOptions): Promise<ReadableStream<Uint8Array>> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        let fullText = "";

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
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
