import { ArrowRight, ShieldCheck, Zap, UserCheck, Trophy, Target, Wallet, Star, ChevronDown, Lock } from "lucide-react";
import logo from "@/assets/fifapay-logo.png";
import sCoca from "@/assets/sponsor-cocacola.png";
import sVisa from "@/assets/sponsor-visa.png";
import sAramco from "@/assets/sponsor-aramco.png";
import sQatar from "@/assets/sponsor-qatar.png";
import sLenovo from "@/assets/sponsor-lenovo.png";
import sAdidas from "@/assets/sponsor-adidas.png";
import worldcupHero from "@/assets/worldcup-hero.png";

const sponsors = [
  { src: sCoca, alt: "Coca-Cola" },
  { src: sVisa, alt: "Visa" },
  { src: sAramco, alt: "Saudi Aramco" },
  { src: sQatar, alt: "Qatar Airways" },
  { src: sLenovo, alt: "Lenovo" },
  { src: sAdidas, alt: "Adidas" },
];

const steps = [
  { icon: Target, title: "Bata 15 pênaltis", desc: "Arraste para mirar e chutar. Igual a Copa de verdade." },
  { icon: Trophy, title: "Cada gol vira dinheiro", desc: "Entre R$ 34,08 e R$ 54,12 por gol, bancado pelos patrocinadores." },
  { icon: Wallet, title: "Saque na hora via PIX", desc: "Informe sua chave ao final e receba o saldo em segundos." },
];

const testimonials = [
  { initial: "C", name: "Carlos M.", city: "Recife, PE", value: "R$ 89,40", text: "“Testei num domingo à tarde. Três gols seguidos e o valor apareceu no extrato do banco no mesmo dia.”" },
  { initial: "J", name: "Juliana R.", city: "Belo Horizonte, MG", value: "R$ 102,18", text: "“Rápido demais — pensei que ia pedir cadastro e não pediu. Só o nome e a partida.”" },
  { initial: "A", name: "Anderson P.", city: "Curitiba, PR", value: "R$ 600,00", text: "“Fui mal na primeira rodada, na segunda deu certo. O teto da rodada bateu com o que falavam no regulamento.”" },
];

const faqs = [
  { q: "Preciso depositar ou pagar alguma coisa para jogar?", a: "Não. A ação é 100% bancada pelos patrocinadores oficiais da Copa. Você joga grátis e recebe o valor real dos gols direto no PIX." },
  { q: "Quanto tempo leva para o dinheiro cair na minha conta?", a: "O PIX é processado em menos de 60 segundos após a última cobrança. Basta informar sua chave PIX ao final da partida." },
  { q: "Posso participar mais de uma vez?", a: "Cada pessoa tem direito a uma partida premiada por CPF durante a campanha pré Copa. Use sua chance com atenção e mire nas 15 cobranças." },
];

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-emerald-950 text-white overflow-x-hidden">
      {/* Header + Hero */}
      <div className="max-w-md mx-auto px-5 pt-5">
        <div className="flex items-center justify-between mb-4">
          <img src={logo} alt="FifaPay" className="h-10 w-auto object-contain select-none" draggable={false} />
          <span className="text-[11px] font-medium text-emerald-300/90">Campanha pré-Copa</span>
        </div>

        <section className="pb-6">
          <div className="inline-flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/25 rounded-lg px-2.5 py-1 mb-4">
            <Trophy className="w-3 h-3 text-yellow-400" />
            <span className="ds-kicker">Pré-Copa — patrocinadores oficiais</span>
          </div>
          <h1 className="text-[32px] leading-[1.12] font-display font-bold tracking-tight text-white mb-3">
            Bata pênaltis e receba no PIX em poucos minutos.
          </h1>
          <p className="text-[15px] leading-relaxed text-emerald-100/95 mb-5">
            15 cobranças por rodada; saldo de até R$ 600,00 conforme o regulamento. Gratuito nesta fase da campanha — o valor dos gols cai direto na sua chave PIX.
          </p>
          <button className="group w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 py-3.5 text-[15px] font-bold text-emerald-950 shadow-md hover:from-amber-300 hover:to-yellow-300 active:scale-[0.99] transition flex items-center justify-center gap-2">
            Jogar agora <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-emerald-200/80">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> PIX seguro</span>
            <span className="w-1 h-1 rounded-full bg-emerald-700" />
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Saque imediato</span>
            <span className="w-1 h-1 rounded-full bg-emerald-700" />
            <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> Sem cadastro</span>
          </div>
        </section>
      </div>

      {/* Sponsors marquee */}
      <div className="border-y border-emerald-800/60 bg-emerald-950/60 py-4 mt-2 overflow-hidden">
        <p className="text-center text-[11px] font-medium text-emerald-400/80 mb-3">Patrocinadores da ação</p>
        <div className="relative overflow-hidden">
          <div className="flex w-max animate-marquee gap-10 items-center">
            {[...sponsors, ...sponsors].map((s, i) => (
              <img
                key={i}
                src={s.src}
                alt={s.alt}
                className="h-9 w-auto object-contain shrink-0 opacity-95 hover:opacity-100 transition-opacity select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                draggable={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Como funciona o prêmio */}
      <div className="max-w-md mx-auto px-5">
        <section className="pt-8 pb-2">
          <p className="text-[11px] font-semibold text-yellow-400/95 mb-2 uppercase tracking-wider">Como funciona o prêmio</p>
          <h2 className="text-2xl font-display font-bold leading-snug mb-3">
            Patrocinadores da Copa financiam rodadas de teste antes do torneio.
          </h2>
          <p className="text-sm text-emerald-100/88 leading-relaxed">
            Cada gol convertido entra como uma ativação da campanha; o valor acumulado na partida pode ser sacado por PIX, conforme as regras do regulamento.
          </p>

          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { n: "~R$ 1,2 mi", l: "últimos 7 dias (est.)" },
              { n: "12k+", l: "saques PIX (24h)" },
              { n: "4,8", l: "nota no app" },
            ].map((s, i) => (
              <div key={i} className="bg-emerald-900/40 border border-emerald-800/50 rounded-xl p-3 text-center">
                <p className="text-base font-display font-bold text-yellow-400 leading-none">{s.n}</p>
                <p className="text-[10px] text-emerald-200/75 font-medium mt-1 leading-snug">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section className="pt-10">
          <h3 className="text-xl font-display font-bold mb-1">Como funciona</h3>
          <p className="text-sm text-emerald-200/75 mb-4">Três passos — sem cadastro nem depósito.</p>
          <div className="space-y-2.5">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-emerald-900/40 border border-emerald-800/45 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-lg bg-amber-400 flex items-center justify-center text-emerald-950">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-emerald-950 border border-amber-400/80 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-amber-300">{i + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight">{s.title}</p>
                    <p className="text-emerald-200/70 text-xs mt-0.5 leading-snug">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Hero image card */}
        <section className="pt-10">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/40 min-h-[200px]">
            <img src={worldcupHero} alt="Taça da Copa do Mundo e bola oficial com estádio ao fundo" className="absolute inset-0 w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/85 to-emerald-950/20" aria-hidden="true" />
            <div className="relative z-10 flex flex-col justify-end min-h-[200px] p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Lock className="w-3.5 h-3.5 text-yellow-200/95" />
                <span className="text-[11px] font-semibold text-yellow-200/95">Pagamento via PIX</span>
              </div>
              <p className="text-white font-display font-bold text-xl leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">Saldo na conta</p>
              <p className="text-emerald-100/95 text-sm font-medium mt-1 drop-shadow-md">Em geral em menos de um minuto após o resgate.</p>
            </div>
          </div>
        </section>

        {/* Quem já sacou */}
        <section className="pt-10">
          <h3 className="text-xl font-display font-bold mb-1">Quem já sacou</h3>
          <p className="text-sm text-emerald-200/75 mb-4">Depoimentos de usuários nas últimas semanas.</p>
          <div className="space-y-2.5">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-emerald-900/40 border border-emerald-800/45 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-emerald-950 font-bold text-sm">{t.initial}</div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{t.name}</p>
                      <p className="text-[11px] text-emerald-300/70 leading-tight">{t.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-0.5 justify-end">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-[11px] font-semibold text-yellow-400 leading-tight mt-0.5">{t.value}</p>
                  </div>
                </div>
                <p className="text-[13px] text-emerald-100/88 leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="pt-10">
          <h3 className="text-xl font-display font-bold mb-1">Perguntas frequentes</h3>
          <p className="text-sm text-emerald-200/75 mb-4">O básico antes de entrar na rodada.</p>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <details key={i} className="group bg-emerald-900/40 border border-emerald-800/45 rounded-xl overflow-hidden">
                <summary className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer list-none">
                  <span className="text-sm font-bold leading-snug pr-2">{f.q}</span>
                  <ChevronDown className="w-4 h-4 text-emerald-300 transition-transform group-open:rotate-180 flex-shrink-0" />
                </summary>
                <p className="px-4 pb-4 text-[13px] text-emerald-100/85 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="pt-10 pb-10">
          <div className="relative rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-400 to-yellow-400 p-6 shadow-lg shadow-black/15">
            <div className="inline-block bg-emerald-950/90 rounded-md px-2.5 py-1 mb-3">
              <span className="text-yellow-300 text-[11px] font-semibold">Quota da campanha</span>
            </div>
            <h3 className="text-emerald-950 text-[22px] font-display font-bold leading-snug mb-2">Pronto para a sua rodada?</h3>
            <p className="text-emerald-950/80 text-sm font-medium mb-4 leading-relaxed">
              Quando a cota de rodadas patrocinadas encerrar, a fase pré-Copa também encerra — entra antes disso se quiser participar.
            </p>
            <button className="w-full rounded-xl bg-emerald-950 py-3.5 text-[15px] font-bold text-amber-300 hover:bg-emerald-900 active:scale-[0.99] transition flex items-center justify-center gap-2">
              Jogar agora <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-emerald-800/60 bg-emerald-950/80 mt-2">
        <div className="max-w-md mx-auto px-5 py-8">
          <div className="flex items-center justify-between mb-5">
            <img src={logo} alt="FifaPay" className="h-9 w-auto object-contain select-none opacity-90" draggable={false} />
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300/70">
              <ShieldCheck className="w-3 h-3" />
              <span>Pagamentos via PIX</span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-300/60 leading-relaxed">
            © {new Date().getFullYear()} FifaPay. Campanha promocional pré-Copa em parceria com patrocinadores oficiais. Sujeito ao regulamento.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
