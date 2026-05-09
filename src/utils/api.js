import { getClient } from './anthropicClient';

export async function generatePrompt(description) {
  const client = getClient();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert prompt engineer. The user needs a prompt for the following purpose:\n\n"${description}"\n\nCreate an optimized, well-structured prompt that will get the best results from an AI assistant. The prompt should be clear, specific, and include any relevant context, constraints, or formatting instructions.\n\nReturn ONLY a JSON object with exactly these three fields:\n{\n  "title": "A short concise name for this prompt (5 words or less)",\n  "description": "One sentence explaining when and why to use this prompt",\n  "prompt": "The full optimized prompt text"\n}`,
      },
    ],
  });

  const raw = message.content[0].text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
}

export async function parseDocument(text) {
  const client = getClient();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are analysing a document that contains one or more AI prompts. Each prompt may be for a different use case or department.\n\nDocument content:\n---\n${text}\n---\n\nExtract every distinct prompt from this document. For each one return:\n- name: a short title (5 words or less)\n- description: one sentence explaining when to use it\n- prompt: the full cleaned-up prompt text\n- folder: a folder name grouping similar prompts (e.g. "Marketing", "Sales", "Customer Service", "Writing", "Analysis", "HR", "Legal")\n\nReturn ONLY a valid JSON array, no other text:\n[\n  {\n    "name": "...",\n    "description": "...",\n    "prompt": "...",\n    "folder": "..."\n  }\n]`,
      },
    ],
  });

  const raw = message.content[0].text.trim();
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
}
