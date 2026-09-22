import { Bot, Play, RefreshCw, Users } from "lucide-react";

const steps = [
  { title: "Set up your AI", description: "Add your API key and choose the model you want to use. Demo mode comes preconfigured.", icon: Bot },
  { title: "Define your personas", description: "Create the user profiles you want to simulate. The more realistic your personas, the more useful the results.", icon: Users },
  { title: "Run a test", description: "Give a product idea, question or experience and see how different personas might react.", icon: Play },
  { title: "Learn and iterate", description: "Use the insights to generate new ideas and better research questions. Keep your personas updated as you learn from real users.", icon: RefreshCw },
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 py-4 md:space-y-10 md:py-6">
      <section className="grid items-center gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:gap-10">
        <header className="max-w-xl space-y-4">
          <p className="text-xs font-bold tracking-[0.14em] text-primary">UNDERSTAND USERS. BUILD BETTER.</p>
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground md:text-5xl">
            See your ideas through different user perspectives.
          </h1>
          <p className="max-w-lg text-base leading-6 text-muted-foreground md:text-[17px] md:leading-7">
            Simulate feedback from realistic personas and discover new insights before talking to real users.
          </p>
          <p className="max-w-lg pt-1 text-sm leading-6 text-muted-foreground">
            Usershoes does not create user truth. It helps teams reuse the user knowledge they already have.
          </p>
        </header>

        <div className="mx-auto w-full max-w-[560px]">
          <img
            src="/illustrations/usershoes-hero.png"
            alt="Four personas reacting differently to a shared product idea"
            className="h-auto w-full object-contain"
          />
        </div>
      </section>

      <section aria-labelledby="workflow-heading" className="space-y-2">
        <h2 id="workflow-heading" className="font-display text-2xl font-bold tracking-tight md:text-3xl">How it works</h2>
        <p className="text-sm text-muted-foreground md:text-base">From idea to insight in four simple steps.</p>
        <ol className="grid gap-3 pt-3 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="min-h-[174px] rounded-2xl border border-border bg-card p-4 shadow-warm md:p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">0{index + 1}</span>
                <step.icon className="h-4 w-4 text-primary" strokeWidth={2.2} />
              </div>
              <h3 className="mt-5 text-sm font-bold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
