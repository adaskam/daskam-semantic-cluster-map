import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { generateCluster, generateGapCluster, type Cluster } from "@/lib/cluster.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Link2, KeyRound, Network, ZoomIn, ZoomOut, RotateCcw, Pencil, Target, Compass, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditExportDialog } from "@/components/EditExportDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Semantic Cluster Map — A cartographer for your keyword strategy" },
      {
        name: "description",
        content:
          "Generate an interactive map of SEO content pillars, article ideas, keywords, and internal linking strategy from a single primary topic.",
      },
      { property: "og:title", content: "Semantic Cluster Map" },
      {
        property: "og:description",
        content: "A cartographer for your keyword strategy — AI-powered semantic content clusters for SEO.",
      },
    ],
  }),
  component: Index,
});

const PILLAR_COLORS = [
  "var(--pillar-1)",
  "var(--pillar-2)",
  "var(--pillar-3)",
  "var(--pillar-4)",
  "var(--pillar-5)",
];

const EXAMPLE_TOPICS = [
  "Enterprise Cloud Security",
  "Sustainable Fashion",
  "AI for Healthcare",
];

const STAGE = { w: 1240, h: 940, cx: 620, cy: 470 };

function pillarPositions(n: number) {
  const radius = 250;
  return Array.from({ length: n }, (_, i) => {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
    return {
      x: STAGE.cx + radius * Math.cos(angle),
      y: STAGE.cy + radius * Math.sin(angle),
      angle,
    };
  });
}

function articlePositions(px: number, py: number, angle: number, count: number) {
  const spread = Math.PI / 2.2;
  const radius = 180;
  return Array.from({ length: count }, (_, i) => {
    const a = angle - spread / 2 + (spread * i) / Math.max(count - 1, 1);
    return {
      x: px + radius * Math.cos(a),
      y: py + radius * Math.sin(a),
    };
  });
}

type Mode = "topic" | "gap";

function Index() {
  const [mode, setMode] = useState<Mode>("topic");
  const [topic, setTopic] = useState("");
  const [url, setUrl] = useState("");
  const [seedKeywords, setSeedKeywords] = useState("");
  const [goals, setGoals] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(1);

  const topicMutation = useMutation({
    mutationFn: (t: string) => generateCluster({ data: { topic: t } }),
    onSuccess: () => setActive(0),
  });

  const gapMutation = useMutation({
    mutationFn: (vars: { url: string; keywords: string; goals: string; competitors: string }) =>
      generateGapCluster({ data: vars }),
    onSuccess: () => setActive(0),
  });

  const activeMutation = mode === "topic" ? topicMutation : gapMutation;
  const cluster: Cluster | undefined = (topicMutation.data ?? gapMutation.data) as Cluster | undefined;
  const lastData = mode === "topic" ? topicMutation.data : gapMutation.data;

  const onTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 2) return;
    topicMutation.mutate(topic.trim());
  };

  const onGapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim().length < 3 || seedKeywords.trim().length < 2) return;
    gapMutation.mutate({
      url: url.trim(),
      keywords: seedKeywords.trim(),
      goals: goals.trim(),
      competitors: competitors.trim(),
    });
  };

  const pillars = cluster?.pillars ?? [];
  const positions = useMemo(() => pillarPositions(pillars.length || 4), [pillars.length]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main
        className={cn(
          "flex-1 p-6 max-w-[1600px] w-full mx-auto",
          lastData
            ? "grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"
            : "flex flex-col items-center justify-start pt-8 lg:pt-14",
        )}
      >
        {!lastData && !activeMutation.isPending && !activeMutation.isError && (
          <HeroSection
            mode={mode}
            setMode={setMode}
            topic={topic}
            setTopic={setTopic}
            url={url}
            setUrl={setUrl}
            seedKeywords={seedKeywords}
            setSeedKeywords={setSeedKeywords}
            goals={goals}
            setGoals={setGoals}
            competitors={competitors}
            setCompetitors={setCompetitors}
            onTopicSubmit={onTopicSubmit}
            onGapSubmit={onGapSubmit}
            isPending={activeMutation.isPending}
          />
        )}

        {activeMutation.isPending && (
          <section className="node-card relative overflow-hidden min-h-[760px] w-full">
            <LoadingState topic={mode === "topic" ? topic : `${url} — intent gap analysis`} />
          </section>
        )}

        {activeMutation.isError && !cluster && (
          <section className="node-card relative overflow-hidden min-h-[760px] w-full grid place-items-center p-8 text-center">
            <div className="max-w-sm">
              <p className="text-destructive font-medium mb-2">Couldn't generate cluster</p>
              <p className="text-sm text-muted-foreground">
                {(activeMutation.error as Error)?.message || "Try again in a moment."}
              </p>
            </div>
          </section>
        )}

        {cluster && (
          <>
            <section className="node-card relative overflow-hidden">
              <MindMap
                cluster={cluster}
                positions={positions}
                active={active}
                onActiveChange={setActive}
                zoom={zoom}
                onZoomChange={setZoom}
              />
            </section>

            <aside className="space-y-4">
              <SidePanel
                cluster={cluster}
                active={active}
                onActiveChange={setActive}
              />
            </aside>
          </>
        )}
      </main>
    </div>
  );
}


function Header() {
  return (
    <header className="border-b border-border/60 backdrop-blur-sm sticky top-0 z-30 bg-background/70">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center">
            <Network className="size-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-semibold leading-none">Semantic Cluster Map</h1>
            <p className="text-xs text-muted-foreground mt-1">A cartographer for your keyword strategy</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const tabs: { id: Mode; label: string; icon: typeof Sparkles; sub: string }[] = [
    { id: "topic", label: "Topic Map", icon: Sparkles, sub: "From seed keywords" },
    { id: "gap", label: "Intent Gap Analysis", icon: Target, sub: "From a URL + seed keywords" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl border border-border/60 bg-secondary/30">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = mode === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id)}
            className={cn(
              "flex flex-col items-start text-left px-3 py-2.5 rounded-lg transition-colors",
              active
                ? "bg-background shadow-sm border border-border/60"
                : "hover:bg-background/50 text-muted-foreground",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
              {t.label}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">{t.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

function HeroSection({
  mode,
  setMode,
  topic,
  setTopic,
  url,
  setUrl,
  seedKeywords,
  setSeedKeywords,
  goals,
  setGoals,
  competitors,
  setCompetitors,
  onTopicSubmit,
  onGapSubmit,
  isPending,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  topic: string;
  setTopic: (t: string) => void;
  url: string;
  setUrl: (v: string) => void;
  seedKeywords: string;
  setSeedKeywords: (v: string) => void;
  goals: string;
  setGoals: (v: string) => void;
  competitors: string;
  setCompetitors: (v: string) => void;
  onTopicSubmit: (e: React.FormEvent) => void;
  onGapSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}) {
  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <div className="size-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 grid place-items-center mb-6 animate-pulse-ring">
        {mode === "topic" ? (
          <Network className="size-10 text-primary" />
        ) : (
          <Compass className="size-10 text-primary" />
        )}
      </div>

      <h2 className="text-3xl md:text-4xl font-semibold text-glow">
        {mode === "topic" ? "Map a content universe" : "Find your intent gaps"}
      </h2>
      <p className="text-base text-muted-foreground mt-3 max-w-md mx-auto">
        {mode === "topic"
          ? "Enter a primary topic and we'll generate a complete semantic content cluster: pillars, article ideas, keywords, and internal linking strategy."
          : "Add your site, seed keywords, goals, and competitors. We'll map content opportunities based on search intent gaps."}
      </p>

      <div className="mt-6 text-left">
        <ModeTabs mode={mode} setMode={setMode} />
      </div>

      {mode === "topic" ? (
        <form onSubmit={onTopicSubmit} className="mt-6 flex flex-col gap-3">
          <label htmlFor="primary-topic" className="text-sm font-medium text-left text-muted-foreground">
            Primary Topic
          </label>
          <div className="relative w-full">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-primary" />
            <Input
              id="primary-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Enterprise Cloud Security"
              aria-label="Primary topic"
              className="pl-12 h-14 text-lg bg-input border-border focus-visible:ring-primary w-full"
              disabled={isPending}
            />
          </div>
          <Button
            type="submit"
            disabled={isPending || topic.trim().length < 2}
            className="h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            {isPending ? (
              <><Loader2 className="size-5 animate-spin" /> Mapping…</>
            ) : (
              "Generate cluster map"
            )}
          </Button>

          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-2">Try an example</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLE_TOPICS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTopic(s)}
                  className="inline-flex items-center rounded-md border border-transparent bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={onGapSubmit} className="mt-6 flex flex-col gap-4 text-left">
          <div className="grid gap-2">
            <label htmlFor="gap-url" className="text-sm font-medium text-muted-foreground">
              Company URL <span className="text-destructive">*</span>
            </label>
            <Input
              id="gap-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://yourcompany.com"
              className="h-12 bg-input border-border focus-visible:ring-primary"
              disabled={isPending}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="gap-keywords" className="text-sm font-medium text-muted-foreground">
              Seed Keywords <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="gap-keywords"
              value={seedKeywords}
              onChange={(e) => setSeedKeywords(e.target.value)}
              placeholder="Comma-separated, e.g. zero trust, cloud workload protection, SASE"
              className="min-h-[72px] bg-input border-border focus-visible:ring-primary"
              disabled={isPending}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="gap-goals" className="text-sm font-medium text-muted-foreground">
              Business Goals <span className="text-muted-foreground/60 font-normal">(optional)</span>
            </label>
            <Textarea
              id="gap-goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g. Capture mid-market buyers, drive demo requests, rank for evaluation-stage queries"
              className="min-h-[64px] bg-input border-border focus-visible:ring-primary"
              disabled={isPending}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="gap-competitors" className="text-sm font-medium text-muted-foreground">
              Competitors <span className="text-muted-foreground/60 font-normal">(optional)</span>
            </label>
            <Textarea
              id="gap-competitors"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="Domains or names, e.g. wiz.io, crowdstrike.com, Palo Alto Networks"
              className="min-h-[64px] bg-input border-border focus-visible:ring-primary"
              disabled={isPending}
            />
          </div>
          <Button
            type="submit"
            disabled={isPending || url.trim().length < 3 || seedKeywords.trim().length < 2}
            className="h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            {isPending ? (
              <><Loader2 className="size-5 animate-spin" /> Analyzing gaps…</>
            ) : (
              <><Target className="size-5 mr-1" /> Map intent gaps</>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}


function LoadingState({ topic }: { topic: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center p-8 text-center">
      <div>
        <div className="size-20 mx-auto rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="mt-5 font-medium">Charting cluster for <span className="text-primary">{topic}</span></p>
        <p className="text-sm text-muted-foreground mt-1">Identifying pillars, articles, and link paths…</p>
      </div>
    </div>
  );
}

function MindMap({
  cluster,
  positions,
  active,
  onActiveChange,
  zoom,
  onZoomChange,
}: {
  cluster: Cluster;
  positions: { x: number; y: number; angle: number }[];
  active: number;
  onActiveChange: (i: number) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number; mode: "grab" | "space" } | null>(null);

  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 4;
  const STEP = 0.2;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      setFitScale(Math.min(1, w / STAGE.w));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track spacebar (Figma-style: hold space to pan)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsSpaceDown(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpaceDown(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const finalScale = fitScale * zoom;

  // Zoom centered on a client point (Figma-style cursor-anchored zoom)
  const zoomAt = (nextZoom: number, clientX?: number, clientY?: number) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    const el = containerRef.current;
    if (!el || clientX == null || clientY == null) {
      onZoomChange(clamped);
      return;
    }
    const rect = el.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const oldScale = fitScale * zoom;
    const newScale = fitScale * clamped;
    // keep the world point under cursor fixed
    setPan({
      x: cx - ((cx - pan.x) * newScale) / oldScale,
      y: cy - ((cy - pan.y) * newScale) / oldScale,
    });
    onZoomChange(clamped);
  };

  const zoomIn = () => zoomAt(zoom + STEP);
  const zoomOut = () => zoomAt(zoom - STEP);
  const resetZoom = () => {
    onZoomChange(1);
    setPan({ x: 0, y: 0 });
  };

  const startDrag = (clientX: number, clientY: number, mode: "grab" | "space") => {
    dragRef.current = { startX: clientX, startY: clientY, panX: pan.x, panY: pan.y, mode };
    setIsDragging(true);
  };

  const moveDrag = (clientX: number, clientY: number) => {
    const d = dragRef.current;
    if (!d) return;
    setPan({ x: d.panX + (clientX - d.startX), y: d.panY + (clientY - d.startY) });
  };

  const endDrag = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // middle-click or space+left-click always pans
    const target = e.target as HTMLElement;
    const onInteractive = !!target.closest("button, [role='button'], a, input, textarea, select");
    if (e.button === 1 || (e.button === 0 && isSpaceDown)) {
      e.preventDefault();
      startDrag(e.clientX, e.clientY, "space");
      return;
    }
    if (e.button !== 0 || onInteractive) return;
    startDrag(e.clientX, e.clientY, "grab");
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    moveDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, [role='button'], a, input, textarea, select")) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY, "grab");
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
  };

  // Native wheel listener (passive: false so we can preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Ctrl/Cmd+wheel or pinch (ctrlKey set by trackpad pinch) = zoom; otherwise pan
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.0015);
        zoomAt(zoom * factor, e.clientX, e.clientY);
      } else {
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as EventListener);
  }, [zoom, fitScale, pan.x, pan.y]);

  const cursorClass = isDragging
    ? "cursor-grabbing"
    : isSpaceDown
      ? "cursor-grab"
      : "cursor-default";

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden touch-none", cursorClass)}
      style={{ height: STAGE.h * fitScale }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={endDrag}
    >
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1 rounded-lg border border-border/60 bg-background/80 p-1 backdrop-blur-sm shadow-sm">
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40 transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="size-4" />
        </button>
        <span className="min-w-[3ch] px-1 text-center text-xs font-mono tabular-nums text-foreground/80">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40 transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="size-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-border/60" />
        <button
          type="button"
          onClick={resetZoom}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Reset view"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-30 rounded-md border border-border/50 bg-background/70 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
        Scroll to pan · ⌘/Ctrl + scroll to zoom · Space + drag
      </div>

      <div
        className="absolute top-0 left-0 origin-top-left select-none"
        style={{ width: STAGE.w, height: STAGE.h, transform: `translate(${pan.x}px, ${pan.y}px) scale(${finalScale})` }}
      >
        <svg
          width={STAGE.w}
          height={STAGE.h}
          className="absolute inset-0 pointer-events-none"
        >
        <defs>
          {cluster.pillars.map((_, i) => {
            const p = positions[i];
            return (
              <linearGradient
                key={i}
                id={`line-${i}`}
                gradientUnits="userSpaceOnUse"
                x1={STAGE.cx}
                y1={STAGE.cy}
                x2={p.x}
                y2={p.y}
              >
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
                <stop offset="100%" stopColor={PILLAR_COLORS[i % PILLAR_COLORS.length]} stopOpacity="0.6" />
              </linearGradient>
            );
          })}
        </defs>

          {cluster.pillars.map((_, i) => {
            const p = positions[i];
            const isActive = i === active;
            const d = `M ${STAGE.cx} ${STAGE.cy} C ${STAGE.cx} ${(STAGE.cy + p.y) / 2}, ${p.x} ${(STAGE.cy + p.y) / 2}, ${p.x} ${p.y}`;
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={`url(#line-${i % PILLAR_COLORS.length})`}
                strokeWidth={isActive ? 2.5 : 1.5}
                opacity={isActive ? 1 : 0.55}
              />
            );
          })}

          {cluster.pillars.map((pillar, i) => {
            if (i !== active) return null;
            const p = positions[i];
            const arts = articlePositions(p.x, p.y, p.angle, pillar.articles.length);
            return arts.map((a, j) => (
              <line
                key={`${i}-${j}`}
                x1={p.x}
                y1={p.y}
                x2={a.x}
                y2={a.y}
                stroke={PILLAR_COLORS[i % PILLAR_COLORS.length]}
                strokeWidth={1.2}
                strokeDasharray="4 4"
                opacity={0.7}
              />
            ));
          })}
        </svg>

        {/* Center node */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: STAGE.cx, top: STAGE.cy }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-2xl animate-pulse-ring" />
            <div className="relative node-card px-6 py-4 max-w-[260px] text-center border-primary/50 shadow-[var(--shadow-glow)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-mono">Primary Topic</p>
              <p className="text-lg font-semibold mt-1 leading-tight">{cluster.primaryTopic}</p>
            </div>
          </div>
        </div>

        {/* Pillar nodes */}
        {cluster.pillars.map((pillar, i) => {
          const p = positions[i];
          const isActive = i === active;
          const color = PILLAR_COLORS[i % PILLAR_COLORS.length];
          return (
            <button
              key={i}
              onClick={() => onActiveChange(i)}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 z-10 text-left transition-all",
                "node-card px-4 py-3 w-[200px] hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2",
                isActive ? "ring-2 shadow-[var(--shadow-glow)]" : "opacity-90 hover:opacity-100",
              )}
              style={{
                left: p.x,
                top: p.y,
                borderColor: isActive ? color : undefined,
                ...(isActive ? { ["--tw-ring-color" as never]: color } : {}),
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: color, boxShadow: `0 0 12px ${color}` }}
                />
                <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                  Pillar {i + 1}
                </span>
              </div>
              <p className="text-sm font-semibold mt-1 leading-snug">{pillar.title}</p>
            </button>
          );
        })}

        {/* Article nodes for active pillar */}
        {cluster.pillars[active] &&
          articlePositions(
            positions[active].x,
            positions[active].y,
            positions[active].angle,
            cluster.pillars[active].articles.length,
          ).map((a, j) => {
            const color = PILLAR_COLORS[active % PILLAR_COLORS.length];
            return (
              <div
                key={j}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 node-card px-3 py-2 w-[180px] animate-in fade-in slide-in-from-center"
                style={{ left: a.x, top: a.y, borderColor: `color-mix(in oklab, ${color} 40%, transparent)` }}
              >
                <p className="text-xs leading-snug">{cluster.pillars[active].articles[j]}</p>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function SidePanel({
  cluster,
  active,
  onActiveChange,
}: {
  cluster?: Cluster;
  active: number;
  onActiveChange: (i: number) => void;
}) {
  const pillar = cluster?.pillars[active];
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      {cluster && (
        <div className="node-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-muted-foreground">
                Hand-off
              </p>
              <p className="text-sm font-medium mt-0.5 truncate">Review & export</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Polish the copy before downloading.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setEditOpen(true)}
              className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shrink-0"
            >
              <Pencil className="size-4 mr-1.5" />
              Edit & Export
            </Button>
          </div>
        </div>
      )}

      {cluster && (
        <EditExportDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          cluster={cluster}
        />
      )}



      {cluster?.mode === "gap" && cluster.gapSummary && (
        <div className="node-card p-5 border-primary/40">
          <div className="flex items-center gap-2 mb-2">
            <Target className="size-4 text-primary" />
            <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-primary">
              Intent gap summary
            </p>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{cluster.gapSummary}</p>
        </div>
      )}

      <div className="node-card p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-muted-foreground">
          Active cluster
        </p>
        {pillar ? (
          <>
            <div className="flex items-start justify-between gap-3 mt-1">
              <h3 className="text-xl font-semibold leading-tight">{pillar.title}</h3>
              {pillar.intent && (
                <span className="shrink-0 mt-1 text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
                  {pillar.intent}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {pillar.description}
            </p>
            {pillar.opportunity && (
              <div className="mt-3 pt-3 border-t border-border/60">
                <p className="text-[10px] uppercase tracking-[0.18em] font-mono text-accent mb-1">
                  Opportunity
                </p>
                <p className="text-sm leading-relaxed text-foreground/90">{pillar.opportunity}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            Generate a cluster to see strategy details here.
          </p>
        )}
      </div>


      <div className="node-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="size-4 text-primary" />
          <h4 className="text-sm font-semibold uppercase tracking-wider">Recommended keywords</h4>
        </div>
        {pillar ? (
          <div className="flex flex-wrap gap-2">
            {pillar.keywords.map((k) => (
              <span
                key={k}
                className="px-2.5 py-1 rounded-md bg-secondary/60 border border-border/60 text-xs font-mono text-foreground/90"
              >
                {k}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No keywords yet.</p>
        )}
      </div>

      <div className="node-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="size-4 text-accent" />
          <h4 className="text-sm font-semibold uppercase tracking-wider">Internal linking strategy</h4>
        </div>
        {pillar ? (
          <ul className="space-y-2.5">
            {pillar.internalLinks.map((l, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-accent font-mono text-xs mt-0.5">→</span>
                <span className="leading-snug text-foreground/90">{l}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No linking plan yet.</p>
        )}
      </div>

      {cluster && (
        <div className="node-card p-5">
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-3">All pillars</h4>
          <div className="space-y-1.5">
            {cluster.pillars.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onActiveChange(i)}
                className="w-full text-left text-xs text-muted-foreground font-mono flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: PILLAR_COLORS[i % PILLAR_COLORS.length] }}
                />
                <span className={cn(i === active && "text-foreground font-medium")}>
                  {String(i + 1).padStart(2, "0")} · {p.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
