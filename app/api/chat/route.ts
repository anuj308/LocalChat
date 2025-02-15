import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
});

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      // Removed stream: true to get complete response
    });

    const content = completion.choices[0]?.message?.content || '';

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (_) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void _; // Explicitly mark `_` as unused
    return NextResponse.json({ error: "Error processing request" }, { status: 500 });
  }
}