const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const PROMPT = `You are an expert tailwind developer. A user will provide you with a 
low-fidelity wireframe of an application and you will return a single HTML file 
that uses Tailwind CSS to create the website. Use creative license to make the 
application more fleshed out. If you need to insert an image, use placehold.co 
to create a placeholder image. Respond only with the HTML file.`;

type GPT4VCompletionRequest = {
  model: 'gpt-4-vision-preview';
  messages: {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: MessageContent;
    name?: string;
  }[];
  functions?: FunctionType<unknown, unknown>[];
  function_call?: FunctionCallType<unknown, unknown, unknown>;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  n?: number;
  best_of?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  logit_bias?: { [x: string]: number };
  stop?: string[] | string;
};

type MessageContent =
  | string
  | (
      | string
      | {
          type: 'image_url';
          image_url: string | { url: string; detail: 'low' | 'high' | 'auto' };
        }
    )[];

type FunctionType<T, R> = (arg: T) => R;
type FunctionCallType<T, U, R> = (arg1: T, arg2: U) => R;

export async function POST(request: Request): Promise<Response> {
  try {
    const req = await createCompletionRequest(request);
    const res = await sendOpenAIRequest(req);
    return getResponse(res);
  } catch (error) {
    return getResponse({ error }, 500);
  }
}

function getResponse(
  body: unknown,
  status: number = 200,
  headers: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=UTF-8', ...headers },
  });
}

async function createCompletionRequest(
  request: Request
): Promise<GPT4VCompletionRequest> {
  const { image } = await request.json();
  return {
    model: 'gpt-4-vision-preview',
    max_tokens: 4096,
    messages: [
      { role: 'system', content: PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: image, detail: 'high' } },
          'Turn this into a single html file using tailwind.',
        ],
      },
    ],
  };
}

async function sendOpenAIRequest(
  body: GPT4VCompletionRequest
): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not set');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API responded with status ${response.status}`);
  }

  return response.json();
}
