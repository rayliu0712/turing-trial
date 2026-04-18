import type { ModelMessage } from 'ai';

export function pushUserContent(messages: ModelMessage[], content: string) {
  const msg = messages[messages.length - 1];

  if (msg.role === 'user') {
    msg.content += `\n${content}`;
  } else {
    messages.push({ role: 'user', content });
  }
}

export function pushAiContent(messages: ModelMessage[], content: string) {
  const msg = messages[messages.length - 1];

  if (msg.role === 'assistant') {
    msg.content += `\n${content}`;
  } else {
    messages.push({ role: 'assistant', content });
  }
}
