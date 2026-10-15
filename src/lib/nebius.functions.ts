import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  apiKey: z.string().max(500).optional(),
  baseUrl: z.string().url().max(300),
  model: z.string().min(1).max(200),
  system: z.string().min(1).max(4000),
  user: z.string().min(1).max(60000),
});

export const nebiusChat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env["NEBIUS_API_KEY"] || data.apiKey;
    if (!key) return { ok: false as const, error: "No Nebius API key configured." };
    const res = await fetch(`${data.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: data.model,
        messages: [
          { role: "system", content: data.system },
          { role: "user", content: data.user },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Nebius error", res.status, body.slice(0, 500));
      const msg =
        res.status === 401 ? "Nebius rejected the API key."
        : res.status === 404 ? "Model not found on Nebius — check the model name in settings."
        : res.status === 429 ? "Nebius rate limit hit — wait a moment and try again."
        : `Nebius request failed (${res.status}).`;
      return { ok: false as const, error: msg };
    }
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = j.choices?.[0]?.message?.content ?? "";
    // Strip Nemotron <think> blocks if present
    return { ok: true as const, content: content.replace(/<think>[\s\S]*?<\/think>/g, "").trim() };
  });
