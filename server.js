import dotenv from 'dotenv';
dotenv.config({ override: true });
import Anthropic from '@anthropic-ai/sdk';
import { createServer } from 'http';

const client = new Anthropic();

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/generate') {
    let body = '';
    for await (const chunk of req) body += chunk;

    try {
      const { description } = JSON.parse(body);

      if (!description) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'description is required' }));
        return;
      }

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
      const { title, description: desc, prompt } = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ title, description: desc, prompt }));
    } catch (err) {
      console.error('API error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
