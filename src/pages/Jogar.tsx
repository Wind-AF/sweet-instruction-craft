import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Trophy, User } from "lucide-react";
import logo from "@/assets/fifapay-logo.png";

const Jogar = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    // Próxima etapa do fluxo virá depois
    sessionStorage.setItem("fifapay:player", name.trim());
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white overflow-x-hidden flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-center mb-10">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Voltar para a página inicial"
            className="focus:outline-none"
          >
            <img
              src={logo}
              alt="FifaPay"
              className="h-12 w-auto object-contain select-none"
              draggable={false}
            />
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 rounded-full bg-amber-400 items-center justify-center mb-5 shadow-lg shadow-amber-400/20">
            <User className="w-9 h-9 text-emerald-950" strokeWidth={2.4} />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Como podemos te chamar?</h2>
          <p className="text-emerald-200/80 text-sm px-4 leading-relaxed">
            Aparece no placar e no comprovante do resgate.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu primeiro nome"
            autoComplete="given-name"
            className="w-full bg-emerald-900/60 border-2 border-emerald-700/60 focus:border-yellow-400 focus:outline-none rounded-xl px-4 py-3.5 text-[15px] text-white placeholder:text-emerald-300/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 py-3.5 text-[15px] font-bold text-emerald-950 shadow-md hover:from-amber-300 hover:to-yellow-300 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            Começar partida
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="mt-8 bg-emerald-900/40 border border-emerald-800/45 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">15 pênaltis, até 600 reais (R$ 600,00)</p>
                <p className="text-emerald-200/70 text-xs mt-0.5 leading-snug">
                  Ganhe entre R$ 34,08 e R$ 54,12 a cada gol (valores variam)
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Jogar;