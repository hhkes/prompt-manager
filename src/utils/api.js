export async function generatePrompt(description) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || 'Failed to generate prompt');
  }

  const data = await response.json();
  return data.prompt;
}
