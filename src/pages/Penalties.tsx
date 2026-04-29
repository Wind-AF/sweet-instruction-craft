import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import logo from "@/assets/fifapay-logo.png";
import grass from "@/assets/grass-field.png";
import crowd from "@/assets/crowd.png";
import sponsorHoardings from "@/assets/sponsor-hoardings.png";
import goalkeeper from "@/assets/goalkeeper.png";
import striker from "@/assets/striker.png";
import ball from "@/assets/soccer-ball.png";

/* ---------- Configuração da partida (espelha o jogo original) ---------- */
const TOTAL_KICKS = 15;
const GOALS_PER_MATCH = 9;
const PRIZE_VALUES = [60.51, 61.02, 62.33, 64.08, 68.52, 70.55];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Gera 15 resultados (9 gols, 6 erros) sem 2 erros seguidos e sem 3 gols seguidos. */
function buildResults(): boolean[] {
  const isValid = (seq: boolean[]) => {
    for (let i = 0; i < seq.length - 1; i++) if (!seq[i] && !seq[i + 1]) return false;
    for (let i = 0; i < seq.length - 2; i++) if (seq[i] && seq[i + 1] && seq[i + 2]) return false;
    return true;
  };
  const base = Array.from({ length: TOTAL_KICKS }, (_, i) => i < GOALS_PER_MATCH);
  for (let attempt = 0; attempt < 800; attempt++) {
    const s = shuffle(base);
    if (isValid(s)) return s;
  }
  return shuffle(base); // fallback
}

type Phase = "aiming" | "runup" | "shooting" | "result" | "finished";

/* ---------- Helpers de direção ---------- */
const sideOf = (x: number): "left" | "center" | "right" =>
  x < 38 ? "left" : x > 62 ? "right" : "center";

/* Posição de pulo do goleiro (em % do gol) por lado */
const KEEPER_POSE: Record<"left" | "center" | "right", { x: number; rot: number }> = {
  left: { x: 22, rot: -22 },
  center: { x: 50, rot: 0 },
  right: { x: 78, rot: 22 },
};

const Penalties = () => {
  const navigate = useNavigate();
  const [playerName] = useState(() => sessionStorage.getItem("fifapay:player") || "Jogador");

  const [matchSeed, setMatchSeed] = useState(0);
  const results = useMemo(() => buildResults(), [matchSeed]);
  const prizePool = useMemo(() => shuffle(PRIZE_VALUES), [matchSeed]);

  const [kickIndex, setKickIndex] = useState(0);
  const [history, setHistory] = useState<boolean[]>([]);
  const [balance, setBalance] = useState(0);
  const [goals, setGoals] = useState(0);
  const [phase, setPhase] = useState<Phase>("aiming");

  const [aim, setAim] = useState<{ x: number; y: number } | null>(null);
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 50, y: 88 });
  const [keeperSide, setKeeperSide] = useState<"left" | "center" | "right">("center");
  const [flash, setFlash] = useState<"goal" | "miss" | null>(null);
  const [shake, setShake] = useState(false);
  const [floatPrize, setFloatPrize] = useState<number | null>(null);
  const [muted, setMuted] = useState(true);

  const goalAreaRef = useRef<HTMLDivElement>(null);

  /* Toque/clique na trave para mirar e chutar */
  const onAimTap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "aiming") return;
    const rect = goalAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const clamped = {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(15, Math.min(85, y)),
    };
    setAim(clamped);
    runShot(clamped);
  };

  const runShot = (target: { x: number; y: number }) => {
    const isGoal = results[kickIndex];
    const aimSide = sideOf(target.x);

    setPhase("runup");

    // 450ms: corrida do batedor → fase "shooting" + bola voa
    setTimeout(() => {
      setPhase("shooting");

      // Trajetória final da bola
      let finalPos: { x: number; y: number };
      let finalSide: "left" | "center" | "right";
      if (isGoal) {
        // bola entra perto da mira
        finalPos = {
          x: Math.max(10, Math.min(90, target.x + (Math.random() * 4 - 2))),
          y: Math.max(20, Math.min(55, target.y - 5)),
        };
        // goleiro pula para o LADO ERRADO
        const opposites: Record<"left" | "center" | "right", ("left" | "center" | "right")[]> = {
          left: ["right", "center"],
          right: ["left", "center"],
          center: ["left", "right"],
        };
        const wrong = opposites[aimSide];
        finalSide = wrong[Math.floor(Math.random() * wrong.length)];
      } else {
        // defesa: bola vai para perto do goleiro (mesmo lado da mira) e ele pega
        finalPos = {
          x: Math.max(15, Math.min(85, target.x + (Math.random() * 6 - 3))),
          y: Math.max(35, Math.min(60, target.y)),
        };
        finalSide = aimSide;
      }

      // dispara movimento da bola e pulo do goleiro juntos
      setKeeperSide(finalSide);
      setBallPos(finalPos);

      // 700ms depois: resultado
      setTimeout(() => {
        setPhase("result");
        setHistory((h) => [...h, isGoal]);
        setShake(true);
        setTimeout(() => setShake(false), 450);

        if (isGoal) {
          const value = prizePool[goals % prizePool.length];
          setBalance((b) => +(b + value).toFixed(2));
          setGoals((g) => g + 1);
          setFloatPrize(value);
          setFlash("goal");
        } else {
          setFlash("miss");
        }

        // 1.6s: próxima cobrança ou fim
        setTimeout(() => {
          setFlash(null);
          setFloatPrize(null);
          const next = kickIndex + 1;
          if (next >= TOTAL_KICKS) {
            setPhase("finished");
          } else {
            setKickIndex(next);
            setAim(null);
            setBallPos({ x: 50, y: 88 });
            setKeeperSide("center");
            setPhase("aiming");
          }
        }, 1600);
      }, 700);
    }, 450);
  };

  const playAgain = () => {
    setMatchSeed((s) => s + 1);
    setKickIndex(0);
    setHistory([]);
    setBalance(0);
    setGoals(0);
    setAim(null);
    setBallPos({ x: 50, y: 88 });
    setKeeperSide("center");
    setFlash(null);
    setFloatPrize(null);
    setPhase("aiming");
  };

  /* Bloqueia scroll do body durante a partida */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* ---------- Tela de fim de partida ---------- */
  if (phase === "finished") {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-emerald-950 text-white">
        <div className="max-w-md mx-auto px-5 py-8 min-h-full flex flex-col">
          <div className="flex items-center justify-center mb-6">
            <img src={logo} alt="FifaPay" className="h-10 w-auto select-none" draggable={false} />
          </div>

          <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-400 to-yellow-400 p-6 mb-5 shadow-lg shadow-black/15">
            <p className="text-emerald-950/80 text-xs font-bold uppercase tracking-wider mb-1">
              Saldo da rodada
            </p>
            <p className="font-display text-5xl font-bold text-emerald-950 leading-none mb-3 tabular-nums">
              R$ {balance.toFixed(2).replace(".", ",")}
            </p>
            <div className="flex gap-1 flex-wrap">
              {history.map((g, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    g ? "bg-emerald-700 text-white" : "bg-red-600 text-white"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-emerald-900/60 border border-emerald-700/50 rounded-2xl p-4">
              <p className="text-emerald-300/80 text-[11px] font-semibold uppercase tracking-wider mb-1">
                Gols
              </p>
              <p className="font-display text-3xl font-bold text-yellow-400">
                {goals}/{TOTAL_KICKS}
              </p>
            </div>
            <div className="bg-emerald-900/60 border border-emerald-700/50 rounded-2xl p-4">
              <p className="text-emerald-300/80 text-[11px] font-semibold uppercase tracking-wider mb-1">
                Média/gol
              </p>
              <p className="font-display text-3xl font-bold text-yellow-400">
                R$ {goals ? (balance / goals).toFixed(2).replace(".", ",") : "0,00"}
              </p>
            </div>
          </div>

          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-4 mb-5">
            <p className="text-yellow-200 text-sm font-semibold leading-relaxed">
              Boa, {playerName}! Seu saldo está pronto para resgate via PIX.
            </p>
          </div>

          <button
            onClick={() => navigate("/jogar")}
            className="mb-3 w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 py-3.5 text-[15px] font-bold text-emerald-950 shadow-md hover:from-amber-300 hover:to-yellow-300 active:scale-[0.99] transition flex items-center justify-center gap-2"
          >
            Resgatar saldo via PIX <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={playAgain}
            className="w-full bg-emerald-900/50 border border-emerald-600/50 hover:bg-emerald-900/70 active:scale-[0.98] transition text-emerald-100 font-bold text-sm py-3.5 rounded-2xl"
          >
            Jogar de novo
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Tela do jogo ---------- */
  return (
    <div
      className={`fixed inset-0 overflow-hidden select-none bg-[#143d26] ${
        shake ? "animate-camera-shake" : ""
      }`}
    >
      {/* Céu */}
      <div
        className="absolute inset-x-0 top-0 h-[28%] z-0"
        style={{
          background:
            "linear-gradient(180deg, #020617 0%, #0f172a 28%, #1a3350 62%, rgba(22,58,38,0.88) 100%)",
        }}
      />

      {/* Torcida (mais ao fundo, menor e atrás de tudo) */}
      <img
        src={crowd}
        alt=""
        aria-hidden="true"
        className="absolute inset-x-0 top-[6%] h-[16%] w-full object-cover object-center opacity-80 z-[1]"
        draggable={false}
      />

      {/* Placas dos patrocinadores (atrás do gol, no nível do campo) */}
      <img
        src={sponsorHoardings}
        alt=""
        aria-hidden="true"
        className="absolute inset-x-0 top-[22%] h-[6%] w-full object-cover object-center z-[2]"
        draggable={false}
      />

      {/* Gramado */}
      <img
        src={grass}
        alt=""
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 top-[28%] w-full h-[72%] object-cover object-bottom z-[3]"
        draggable={false}
      />

      {/* HUD topo */}
      <div className="absolute top-0 inset-x-0 z-40 flex items-start justify-between gap-2 px-2.5 pt-2">
        <div className="min-w-0 flex-1 max-w-[62%]">
          <div className="overflow-hidden rounded-md border border-emerald-400/40 bg-emerald-950/85 shadow-2xl backdrop-blur">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-white/10 px-2.5 py-2">
              <span className="ds-kicker text-[9px]">Pênaltis</span>
              <span className="font-display text-sm font-bold tabular-nums text-white">
                {Math.min(kickIndex + 1, TOTAL_KICKS)}/{TOTAL_KICKS}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: TOTAL_KICKS }).map((_, i) => {
                  let cls = "bg-white/25";
                  if (i < history.length) cls = history[i] ? "bg-emerald-400" : "bg-red-500";
                  else if (i === history.length) cls = "bg-yellow-400 animate-pulse";
                  return <div key={i} className={`h-2 w-2 rounded-full ${cls}`} />;
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="w-[38%] max-w-[180px] shrink-0">
          <div className="overflow-hidden rounded-md border border-emerald-400/40 bg-emerald-950/85 shadow-2xl backdrop-blur px-2.5 py-2 text-center">
            <p className="ds-kicker text-[9px] mb-1">Saldo</p>
            <p className="font-display text-xl font-bold leading-none tabular-nums text-yellow-400">
              R$ {balance.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>
      </div>

      {/* Botão mute / sair */}
      <div className="absolute top-2 right-2 z-50 hidden" aria-hidden="true">
        <button onClick={() => setMuted((m) => !m)} className="p-2 rounded-full bg-emerald-950/70 text-white">
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Área do gol (clique para mirar) */}
      <div
        ref={goalAreaRef}
        onPointerDown={onAimTap}
        className={`absolute left-1/2 top-[70px] -translate-x-1/2 w-[92%] max-w-[460px] aspect-[22/11] z-10 rounded-md cursor-crosshair touch-none ${
          phase === "aiming" ? "animate-hint-pulse" : ""
        }`}
      >
        {/* Trave (SVG) */}
        <svg viewBox="0 0 220 120" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* Rede */}
          <defs>
            <pattern id="net" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M0 0L6 6M6 0L0 6" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x="6" y="6" width="208" height="100" fill="url(#net)" />
          {/* Postes */}
          <rect x="3" y="3" width="6" height="106" fill="white" />
          <rect x="211" y="3" width="6" height="106" fill="white" />
          <rect x="3" y="3" width="214" height="6" fill="white" />
        </svg>

        {/* Goleiro */}
        <div
          className={`absolute z-20 ${phase === "shooting" || phase === "result" ? "animate-keeper-dive" : ""}`}
          style={{
            left: `${KEEPER_POSE[keeperSide].x}%`,
            top: "60%",
            width: "28%",
            aspectRatio: "2 / 3",
            transform: `translate(-50%, -50%) rotate(${KEEPER_POSE[keeperSide].rot}deg)`,
            transition: "left 380ms cubic-bezier(.4,1.4,.6,1), transform 380ms ease-out",
            transformOrigin: "50% 80%",
            ["--keeper-rot" as any]: `${KEEPER_POSE[keeperSide].rot}deg`,
          }}
        >
          <img
            src={goalkeeper}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain object-bottom select-none"
            draggable={false}
            style={{
              transform:
                (phase === "shooting" || phase === "result")
                  ? `scaleX(1.35) scaleY(1.1)`
                  : "scale(1)",
              transformOrigin: "50% 70%",
              transition: "transform 320ms cubic-bezier(.4,1.4,.6,1)",
              filter: (phase === "shooting" || phase === "result")
                ? "drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
                : "none",
            }}
          />
        </div>

        {/* Bola voando (apenas durante chute/resultado) */}
        {(phase === "shooting" || phase === "result") && (
        <div
          className="absolute z-30 w-8 h-8 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
            transition:
              "left 700ms cubic-bezier(.2,.6,.4,1), top 700ms cubic-bezier(.2,.6,.4,1)",
          }}
        >
          <img src={ball} alt="" aria-hidden="true" className="w-full h-full object-contain select-none" draggable={false} />
        </div>
        )}

        {/* Marcador da mira */}
        {aim && phase === "aiming" && (
          <div
            className="absolute z-40 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-400 bg-yellow-400/30"
            style={{ left: `${aim.x}%`, top: `${aim.y}%` }}
          />
        )}

        {/* Flash de resultado */}
        {flash && (
          <div
            className={`absolute inset-0 rounded-md pointer-events-none ${
              flash === "goal" ? "animate-goal-flash" : "animate-miss-flash"
            }`}
          />
        )}

        {/* Valor flutuante */}
        {floatPrize !== null && (
          <div
            className="absolute left-1/2 top-1/2 z-50 animate-float-up font-display text-2xl font-bold text-yellow-300 drop-shadow-lg pointer-events-none"
            style={{ transform: "translate(-50%, 0)" }}
          >
            +R$ {floatPrize.toFixed(2).replace(".", ",")}
          </div>
        )}
      </div>

      {/* Batedor */}
      <div
        className={`absolute bottom-0 left-0 z-20 pointer-events-none ${
          phase === "runup"
            ? "animate-runup"
            : phase === "shooting" || phase === "result"
              ? "animate-kick-leg"
              : ""
        }`}
        style={{
          width: "62%",
          height: "55%",
          transform: "translateX(-6%)",
          transformOrigin: "50% 90%",
        }}
      >
        <img src={striker} alt="" aria-hidden="true" className="w-full h-full object-contain object-bottom select-none" draggable={false} />
      </div>

      {/* Bola em descanso ao lado do batedor (antes do chute) */}
      {(phase === "aiming" || phase === "runup") && (
        <div
          className="absolute z-30 w-10 h-10 pointer-events-none"
          style={{
            left: "calc(50% - 14px)",
            bottom: "12%",
          }}
        >
          <img src={ball} alt="" aria-hidden="true" className="w-full h-full object-contain drop-shadow-md select-none" draggable={false} />
        </div>
      )}

      {/* Instrução */}
      {phase === "aiming" && (
        <div className="absolute bottom-2 inset-x-0 z-30 flex justify-center pointer-events-none">
          <div className="bg-emerald-950/85 border border-emerald-400/30 rounded-full px-4 py-1.5 backdrop-blur">
            <p className="text-yellow-300 text-[11px] font-bold uppercase tracking-wider">
              Toque no gol para chutar
            </p>
          </div>
        </div>
      )}

      {/* Banner de resultado — cobre o batedor, no centro da tela */}
      {phase === "result" && (
        <div
          className="absolute left-1/2 top-1/2 z-[60] pointer-events-none w-[82%] max-w-[320px] animate-popup-in"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#0b1f3a] text-center">
            <div className="px-5 pt-4 pb-3 border-b border-white/10">
              <p className="text-[10px] font-bold tracking-[0.18em] text-white/80 uppercase">
                Copa do Mundo FIFA
              </p>
              <p
                className={`font-display text-5xl font-extrabold leading-none mt-2 ${
                  flash === "goal" ? "text-white" : "text-red-400"
                }`}
                style={{ letterSpacing: "0.02em" }}
              >
                {flash === "goal" ? "GOOOL!" : "DEFENDEU!"}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold tracking-[0.18em] text-white/70 uppercase mb-1.5">
                {flash === "goal" ? "Prêmio na carteira" : "Sem prêmio"}
              </p>
              <p className="font-display text-3xl font-extrabold tabular-nums text-yellow-400">
                {flash === "goal" && floatPrize !== null
                  ? `R$ ${floatPrize.toFixed(2).replace(".", ",")}`
                  : "R$ 0,00"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Penalties;