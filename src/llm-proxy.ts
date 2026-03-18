import { Router, type Request, type Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCustomerByToken, checkRateLimit, isModelAllowed, trackUsage } from './customers.js';
import { log } from './utils.js';

// --- Config ---
const GOOGLE_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
const GEMINI_BASE = process.env.GEMINI_BASE_URL;
const ANTHROPIC_KEY = process.env.UPSTREAM_ANTHROPIC_KEY || '';
const DEFAULT_MODEL = process.env.OCF_DEFAULT_MODEL || 'gemini-2.5-flash';

// --- Model routing table ---
interface UpstreamConfig {
  provider: 'google' | 'anthropic' | 'openai';
  actualModel: string;
}

function routeModel(requestedModel: string): UpstreamConfig {
  const m = requestedModel.toLowerCase();
  if (m.includes('claude'))  return { provider: 'anthropic', actualModel: requestedModel };
  if (m.includes('gpt'))     return { provider: 'openai',    actualModel: requestedModel };
  if (m.includes('gemini'))  return { provider: 'google',    actualModel: requestedModel };
  // Default to Gemini Flash (cheapest)
  return { provider: 'google', actualModel: DEFAULT_MODEL };
}

// --- OpenAI-compatible chat completions format ---
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: {
    index: number;
    message: { role: 'assistant'; content: string };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// --- Router ---
export function createLlmProxy(): Router {
  const router = Router();

  // Auth middleware: extract and validate customer token
  router.use(async (req: Request, res: Response, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      res.status(401).json({ error: { message: 'Missing Authorization: Bearer <token>', type: 'auth_error' } });
      return;
    }

    const token = auth.slice(7);
    const customer = await getCustomerByToken(token);
    if (!customer) {
      res.status(401).json({ error: { message: 'Invalid token', type: 'auth_error' } });
      return;
    }

    // Rate limit check
    const rateCheck = await checkRateLimit(customer);
    if (!rateCheck.allowed) {
      res.status(429).json({ error: { message: rateCheck.reason, type: 'rate_limit_error' } });
      return;
    }

    // Attach customer to request
    (req as any)._customer = customer;
    next();
  });

  // GET /models — list available models for this customer's tier
  router.get('/models', (req: Request, res: Response) => {
    const customer = (req as any)._customer;
    const models = getAvailableModels(customer.tier);
    res.json({
      object: 'list',
      data: models.map(m => ({
        id: m,
        object: 'model',
        owned_by: 'openclaw-foundry',
      })),
    });
  });

  // POST /chat/completions — the core endpoint
  router.post('/chat/completions', async (req: Request, res: Response) => {
    const customer = (req as any)._customer;
    const body = req.body as ChatRequest;

    if (!body.messages?.length) {
      res.status(400).json({ error: { message: 'messages array is required', type: 'invalid_request' } });
      return;
    }

    const requestedModel = body.model || DEFAULT_MODEL;

    // Model access check
    if (!isModelAllowed(customer, requestedModel)) {
      res.status(403).json({
        error: {
          message: `Model '${requestedModel}' not available on ${customer.tier} tier. Upgrade for access.`,
          type: 'permission_error',
        },
      });
      return;
    }

    const route = routeModel(requestedModel);
    const ts = new Date().toISOString().slice(11, 19);
    log.note(`[${ts}] LLM ${customer.name} → ${route.provider}/${route.actualModel}`);

    try {
      let response: ChatResponse;

      switch (route.provider) {
        case 'google':
          response = await callGemini(body, route.actualModel);
          break;
        case 'anthropic':
          response = await callAnthropic(body, route.actualModel);
          break;
        default:
          res.status(400).json({ error: { message: `Provider '${route.provider}' not yet supported`, type: 'invalid_request' } });
          return;
      }

      // Track usage
      await trackUsage(customer.id, response.usage.prompt_tokens, response.usage.completion_tokens);

      res.json(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`LLM proxy error: ${msg}`);
      res.status(502).json({ error: { message: `Upstream error: ${msg}`, type: 'upstream_error' } });
    }
  });

  return router;
}

// --- Upstream: Google Gemini ---

async function callGemini(req: ChatRequest, model: string): Promise<ChatResponse> {
  if (!GOOGLE_KEY) throw new Error('GOOGLE_API_KEY not configured on server');

  const genAI = new GoogleGenerativeAI(GOOGLE_KEY);
  const gemini = genAI.getGenerativeModel(
    { model },
    GEMINI_BASE ? { baseUrl: GEMINI_BASE } : undefined,
  );

  // Convert OpenAI messages to Gemini format
  const systemParts = req.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const history = req.messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    }));

  // Last message is the current input
  const lastMsg = history.pop();
  if (!lastMsg) throw new Error('No user message found');

  const chat = gemini.startChat({
    history,
    ...(systemParts ? { systemInstruction: systemParts } : {}),
  });

  const result = await chat.sendMessage(lastMsg.parts);
  const text = result.response.text();
  const usage = result.response.usageMetadata;

  return {
    id: 'chatcmpl-' + Date.now().toString(36),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: text },
      finish_reason: 'stop',
    }],
    usage: {
      prompt_tokens: usage?.promptTokenCount || 0,
      completion_tokens: usage?.candidatesTokenCount || 0,
      total_tokens: usage?.totalTokenCount || 0,
    },
  };
}

// --- Upstream: Anthropic Claude ---

async function callAnthropic(req: ChatRequest, model: string): Promise<ChatResponse> {
  if (!ANTHROPIC_KEY) throw new Error('UPSTREAM_ANTHROPIC_KEY not configured on server');

  const systemMsg = req.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const messages = req.messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }));

  // Direct Anthropic API call (no SDK dependency needed)
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: req.max_tokens || 4096,
      ...(systemMsg ? { system: systemMsg } : {}),
      messages,
      ...(req.temperature != null ? { temperature: req.temperature } : {}),
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic API error: ${resp.status} ${err}`);
  }

  const data = await resp.json() as {
    content: { text: string }[];
    usage: { input_tokens: number; output_tokens: number };
    stop_reason: string;
  };

  return {
    id: 'chatcmpl-' + Date.now().toString(36),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: data.content[0]?.text || '' },
      finish_reason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason,
    }],
    usage: {
      prompt_tokens: data.usage.input_tokens,
      completion_tokens: data.usage.output_tokens,
      total_tokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

// --- Helpers ---

function getAvailableModels(tier: string): string[] {
  const tierModels: Record<string, string[]> = {
    basic:      ['gemini-2.5-flash'],
    pro:        ['gemini-2.5-flash', 'gemini-2.5-pro', 'claude-sonnet-4-6'],
    enterprise: ['gemini-2.5-flash', 'gemini-2.5-pro', 'claude-sonnet-4-6', 'claude-opus-4-6'],
  };
  return tierModels[tier] || tierModels['basic']!;
}
