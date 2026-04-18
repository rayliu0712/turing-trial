import type { ModelMessage } from 'ai';

export class Roles {
  private readonly messages: ModelMessage[] = [];
  private readonly userBuffer: string[] = [];

  private flushUserBuffer() {
    if (this.userBuffer.length > 0) {
      this.messages.push({
        role: 'user',
        content: this.userBuffer.join('\n'),
      });
      this.userBuffer.length = 0;
    }
  }

  user(content: string) {
    this.userBuffer.push(content);
  }

  assistant(content: string) {
    this.flushUserBuffer();
    this.messages.push({ role: 'assistant', content });
  }

  toMessages(): ModelMessage[] {
    this.flushUserBuffer();
    return this.messages;
  }
}
