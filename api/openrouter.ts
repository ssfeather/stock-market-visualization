<<<<<<< HEAD
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000',
        'X-Title': 'Stock Trend Prediction'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get prediction');
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
} 
=======
import axios from 'axios';

const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;

export const predictStockTrend = async (prompt: string) => {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-opus',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Stock Market Visualization'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error predicting stock trend:', error);
    throw error;
  }
};
>>>>>>> 8046bfaa5059dcaea2ce98d776d56ecf5cbc317f
