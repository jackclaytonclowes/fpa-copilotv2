export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  /** Called with the full response text once streaming completes. */
  onComplete?: (fullText: string) => Promise<void>;
}

export interface AIProvider {
  streamChat(options: ChatOptions): Promise<ReadableStream<Uint8Array>>;
}
