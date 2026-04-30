import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const PARADISE_BASE = "https://multi.paradisepags.com";
const TIKTOK_PIXEL_ID = "D5Q09LRC77U10VTVQNMG";
const TIKTOK_EVENTS_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

const NOMES = ["Ana","Carlos","Maria","Pedro","Julia","Lucas","Fernanda","Rafael","Camila","Bruno","Larissa","Thiago","Beatriz","Felipe","Gabriela","Diego","Mariana","Vinicius","Patricia","Gustavo"];
const SOBRENOMES = ["Silva","Santos","Oliveira","Souza","Lima","Pereira","Costa","Ferreira","Almeida","Ribeiro","Rocha","Carvalho","Gomes","Martins","Araujo","Barbosa","Cardoso","Castro","Dias","Moreira"];
const DDDS = ["11","21","31","41","51","61","71","81","85","27","19","48","62","91","98"];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function digits(n: number): string {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
}

function gerarCustomer(input?: { name?: string; document?: string }) {
  const nome = input?.name && input.name.trim().length > 2
    ? input.name.trim()
    : `${rand(NOMES)} ${rand(SOBRENOMES)}`;
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const email = `cliente_${timestamp}_${randomStr}@mail.com`;
  const document = (input?.document || "").replace(/\D/g, "").length === 11
    ? input!.document!.replace(/\D/g, "")
    : digits(11);
  const phone = rand(DDDS) + "9" + digits(8);
  return { name: nome, email, document, phone };
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendTikTokEvent(params: {
  event: string;
  event_id: string;
  value?: number;
  currency?: string;
  url?: string;
  user_agent?: string;
  ip?: string;
  email?: string;
  phone?: string;
}) {
  const token = Deno.env.get("TIKTOK_ACCESS_TOKEN");
  if (!token) {
    console.warn("TIKTOK_ACCESS_TOKEN ausente, pulando evento server-side");
    return { skipped: true };
  }

  const user: Record<string, unknown> = {};
  if (params.email) user.email = await sha256Hex(params.email);
  if (params.phone) user.phone = await sha256Hex(params.phone);
  if (params.ip) user.ip = params.ip;
  if (params.user_agent) user.user_agent = params.user_agent;

  const payload = {
    event_source: "web",
    event_source_id: TIKTOK_PIXEL_ID,
    data: [
      {
        event: params.event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.event_id,
        user,
        page: params.url ? { url: params.url } : undefined,
        properties: {
          currency: params.currency || "BRL",
          value: params.value ?? 0,
        },
      },
    ],
  };

  const resp = await fetch(TIKTOK_EVENTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": token,
    },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data?.code !== 0) {
    console.error("TikTok Events API erro:", resp.status, data);
  }
  return { ok: resp.ok, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("PARADISE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing PARADISE_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const action = body?.action as string;

    if (action === "create") {
      const amount = Number(body.amount);
      if (!Number.isInteger(amount) || amount <= 0) {
        return new Response(JSON.stringify({ error: "amount inválido (em centavos)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const customer = gerarCustomer({ name: body?.customer?.name, document: body?.customer?.document });
      const reference = `FP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const payload: Record<string, unknown> = {
        amount,
        description: body.description || "FifaPay - Liberação de saque",
        reference,
        productHash: "prod_860f421eb05eb247",
        customer,
      };

      if (body.tracking && typeof body.tracking === "object" && Object.keys(body.tracking).length > 0) {
        payload.tracking = body.tracking;
      }

      const resp = await fetch(`${PARADISE_BASE}/api/v1/transaction.php`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: "Falha ao criar transação", details: data }), {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({
          transaction_id: data.transaction_id,
          reference: data.id ?? reference,
          qr_code: data.qr_code,
          amount: data.amount,
          expires_at: data.expires_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "status") {
      const id = body.transaction_id;
      if (!id) {
        return new Response(JSON.stringify({ error: "transaction_id obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const resp = await fetch(
        `${PARADISE_BASE}/api/v1/query.php?action=get_transaction&id=${encodeURIComponent(String(id))}`,
        { headers: { "X-API-Key": apiKey } }
      );
      const data = await resp.json();
      return new Response(JSON.stringify({ status: data.status ?? data?.data?.status ?? "pending", raw: data }), {
        status: resp.ok ? 200 : resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "tiktok_event") {
      const event = String(body.event || "");
      const event_id = String(body.event_id || "");
      if (!event || !event_id) {
        return new Response(JSON.stringify({ error: "event e event_id obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") ||
        undefined;
      const user_agent = req.headers.get("user-agent") || undefined;
      const result = await sendTikTokEvent({
        event,
        event_id,
        value: typeof body.value === "number" ? body.value : undefined,
        currency: body.currency || "BRL",
        url: body.url,
        ip,
        user_agent,
        email: body.email,
        phone: body.phone,
      });
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "action inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});