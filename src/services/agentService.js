import { GoogleGenAI } from '@google/genai';

// Note: In a real production application, you should NEVER hardcode API keys
// or call AI APIs directly from the client-side as it exposes your key.
// This is for demonstration and local usage only.
// The user will need to provide their API key, either via environment variables
// or we can prompt them for it if not found.

export async function generateAgentInsights(tasks) {
  // Try to get API key from Vite env vars, or local storage, etc.
  // For local development, user should set VITE_GEMINI_API_KEY in .env
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
  
  if (!apiKey) {
    const userInput = prompt("Please enter your Gemini API key to use the Intelligence features:\n(It will be saved in your browser's local storage for this session)");
    if (userInput) {
      localStorage.setItem('gemini_api_key', userInput);
      // Reload to retry
      window.location.reload();
      return "Key saved. Reloading...";
    }
    throw new Error("Gemini API key is required.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const activeTasks = tasks.filter(t => !t.completed).map(t => t.text);
  
  if (activeTasks.length === 0) {
    return "You have no active tasks! Enjoy your day.";
  }

  const promptText = `
You are an expert executive assistant and time management coach. 
The user has the following tasks to do today:

${activeTasks.map(t => `- ${t}`).join('\n')}

Please analyze these tasks and provide a recommended schedule for the day. 
Group them into logical blocks (e.g., Deep Work, Admin, Personal) and give a brief, encouraging note on how to tackle the day. Keep the response concise, beautifully formatted in plain text (no markdown asterisks if possible, just clean text layout with newlines and bullet points), and highly actionable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}
