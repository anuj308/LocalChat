
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'ChKHb2vMKDkmXgPy5tEX0ihO',
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://cloud.olakrutrim.com/v1',
});

// Helper function for CORS headers
const getCorsHeaders = () => ({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
});

export async function POST(req: Request) {
    try {
        console.log('Received ChatGPT API request');
        const { messages, model } = await req.json();

        console.log(`Processing request with model: ${model}, messages: ${messages.length}`);

        const stream = await openai.chat.completions.create({
            model: model,
            messages: messages,
            stream: true,
        });

        console.log('OpenAI stream created, starting response streaming...');

        const encoder = new TextEncoder();

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        controller.enqueue(encoder.encode(content));
                    }
                    console.log('Streaming completed successfully');
                } catch (error) {
                    console.error('Error during streaming:', error);
                    controller.error(error);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                ...getCorsHeaders()
            },
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { error: "Error processing request" },
            {
                status: 500,
                headers: getCorsHeaders()
            }
        );
    }
}

export async function OPTIONS() {
    console.log('Handling OPTIONS request');
    return new Response(null, {
        headers: {
            ...getCorsHeaders(),
            // Allow content-type header for streaming responses
            'Content-Type': 'text/plain; charset=utf-8',
            // Security header
            'X-Content-Type-Options': 'nosniff'
        }
    });
}