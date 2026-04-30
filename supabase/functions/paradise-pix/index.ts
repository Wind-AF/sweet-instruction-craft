import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const PARADISE_BASE = "https://multi.paradisepags.com";

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