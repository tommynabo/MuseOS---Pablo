import { ClientProfile } from "../types";
import { supabase } from "../supabaseClient";

// Use relative path for Vercel, or fallback to localhost for local dev if not proxied
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const generateRefinedDraft = async (
  originalText: string,
  clientProfile: ClientProfile,
  instruction: 'shorten' | 'punchier' | 'add_fact' | 'rewrite'
): Promise<string> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/rewrite`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: originalText,
        profile: clientProfile,
        instruction
      }),
    });

    if (!response.ok) {
      throw new Error('Backend request failed');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("API Error:", error);
    return "Error conectando con el servidor backend.";
  }
};

export const runParasiteWorkflow = async () => {
  const headers = await getHeaders();
  const response = await fetch(`${API_URL}/workflow/parasite`, {
    method: 'POST',
    headers
  });
  return response.json();
};

export const runResearchWorkflow = async (topic: string) => {
  const headers = await getHeaders();
  const response = await fetch(`${API_URL}/workflow/research`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ topic })
  });
  return response.json();
};

export const fetchCreators = async () => {
  const headers = await getHeaders();
  const response = await fetch(`${API_URL}/creators`, {
    headers
  });
  return response.json();
};

export const addCreator = async (creator: { name: string, linkedinUrl: string }) => {
  const headers = await getHeaders();
  const response = await fetch(`${API_URL}/creators`, {
    method: 'POST',
    headers,
    body: JSON.stringify(creator)
  });
  return response.json();
};