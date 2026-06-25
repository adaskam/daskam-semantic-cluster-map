import { useEffect, useRef, useState } from "react";
import type { Cluster } from "@/lib/cluster.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileDown, FileText, Plus, Trash2, ImagePlus, X, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportMarkdown, exportPDF, type LogoPlacement, type LogoSize } from "@/lib/export-strategy";
import { ClusterReport } from "@/components/ClusterReport";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cluster: Cluster;
};

export function EditExportDialog({ open, onOpenChange, cluster }: Props) {
  const [draft, setDraft] = useState<Cluster>(cluster);
  const [exporting, setExporting] = useState<null | "pdf" | "md">(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoPlacement, setLogoPlacement] = useState<LogoPlacement>("left");
  const [logoSize, setLogoSize] = useState<LogoSize>("m");
  const [openPillars, setOpenPillars] = useState<Set<number>>(new Set([0]));
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(structuredClone(cluster));
      setOpenPillars(new Set([0]));
    }
  }, [open, cluster]);

  const togglePillar = (i: number) => {
    setOpenPillars((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const updatePillar = (i: number, patch: Partial<Cluster["pillars"][number]>) => {
    setDraft((d) => ({
      ...d,
      pillars: d.pillars.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));
  };

  const updateListItem = (
    i: number,
    field: "articles" | "keywords" | "internalLinks",
    j: number,
    value: string,
  ) => {
    setDraft((d) => ({
      ...d,
      pillars: d.pillars.map((p, idx) =>
        idx !== i ? p : { ...p, [field]: p[field].map((v, k) => (k === j ? value : v)) },
      ),
    }));
  };

  const addListItem = (i: number, field: "articles" | "keywords" | "internalLinks") => {
    setDraft((d) => ({
      ...d,
      pillars: d.pillars.map((p, idx) =>
        idx !== i ? p : { ...p, [field]: [...p[field], ""] },
      ),
    }));
  };

  const removeListItem = (i: number, field: "articles" | "keywords" | "internalLinks", j: number) => {
    setDraft((d) => ({
      ...d,
      pillars: d.pillars.map((p, idx) =>
        idx !== i ? p : { ...p, [field]: p[field].filter((_, k) => k !== j) },
      ),
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePdf = async () => {
    setExporting("pdf");
    try {
      await exportPDF(cleanCluster(draft), {
        dataUrl: logoDataUrl,
        placement: logoPlacement,
        size: logoSize,
      });
    } finally {
      setExporting(null);
    }
  };

  const handleMd = async () => {
    setExporting("md");
    try {
      exportMarkdown(cleanCluster(draft));
    } finally {
      setExporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1400px] w-[95vw] p-0 gap-0 max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/60 shrink-0">
          <DialogTitle className="text-xl">Review & edit before export</DialogTitle>
          <DialogDescription>
            Tweak any text below — your changes will flow into the PDF and Markdown exports.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_280px]">
          <ScrollArea className="border-r border-border/60">
            <div className="p-6 space-y-6">
              <section className="space-y-2">
                <Label>Primary topic</Label>
                <Input
                  value={draft.primaryTopic}
                  onChange={(e) => setDraft({ ...draft, primaryTopic: e.target.value })}
                  className="h-11 text-base font-medium"
                />
              </section>

              {draft.mode === "gap" && (
                <section className="space-y-2">
                  <Label>Intent gap summary</Label>
                  <Textarea
                    value={draft.gapSummary ?? ""}
                    onChange={(e) => setDraft({ ...draft, gapSummary: e.target.value })}
                    className="min-h-[72px]"
                  />
                </section>
              )}

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Pillars</Label>
                  <span className="text-xs text-muted-foreground">{draft.pillars.length} total</span>
                </div>

                <div className="space-y-3">
                  {draft.pillars.map((p, i) => {
                    const isOpen = openPillars.has(i);
                    return (
                      <div key={i} className="rounded-lg border border-border/70 bg-secondary/20">
                        <button
                          type="button"
                          onClick={() => togglePillar(i)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                        >
                          {isOpen ? (
                            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-muted-foreground shrink-0">
                            PL.{String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm font-medium truncate">{p.title || "Untitled pillar"}</span>
                        </button>

                        {isOpen && (
                          <div className="px-3 pb-4 pt-1 space-y-4 border-t border-border/60">
                            <div className="space-y-1.5">
                              <Label>Title</Label>
                              <Input
                                value={p.title}
                                onChange={(e) => updatePillar(i, { title: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Description</Label>
                              <Textarea
                                value={p.description}
                                onChange={(e) => updatePillar(i, { description: e.target.value })}
                                className="min-h-[72px]"
                              />
                            </div>

                            {p.intent !== undefined && (
                              <div className="space-y-1.5">
                                <Label>Search intent</Label>
                                <Input
                                  value={p.intent ?? ""}
                                  onChange={(e) => updatePillar(i, { intent: e.target.value })}
                                />
                              </div>
                            )}
                            {p.opportunity !== undefined && (
                              <div className="space-y-1.5">
                                <Label>Gap opportunity</Label>
                                <Textarea
                                  value={p.opportunity ?? ""}
                                  onChange={(e) => updatePillar(i, { opportunity: e.target.value })}
                                  className="min-h-[60px]"
                                />
                              </div>
                            )}

                            <EditableList
                              label="Article ideas"
                              items={p.articles}
                              onChange={(j, v) => updateListItem(i, "articles", j, v)}
                              onAdd={() => addListItem(i, "articles")}
                              onRemove={(j) => removeListItem(i, "articles", j)}
                            />
                            <EditableList
                              label="Keywords"
                              items={p.keywords}
                              onChange={(j, v) => updateListItem(i, "keywords", j, v)}
                              onAdd={() => addListItem(i, "keywords")}
                              onRemove={(j) => removeListItem(i, "keywords", j)}
                              compact
                            />
                            <EditableList
                              label="Internal linking strategy"
                              items={p.internalLinks}
                              onChange={(j, v) => updateListItem(i, "internalLinks", j, v)}
                              onAdd={() => addListItem(i, "internalLinks")}
                              onRemove={(j) => removeListItem(i, "internalLinks", j)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </ScrollArea>

          <PreviewPane
            cluster={draft}
            logoDataUrl={logoDataUrl}
            logoPlacement={logoPlacement}
            logoSize={logoSize}
          />

          <aside className="bg-secondary/20 flex flex-col border-l border-border/60">

            <ScrollArea className="flex-1">
              <div className="p-5 space-y-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-muted-foreground mb-2">
                    PDF cover logo
                  </p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  {logoDataUrl ? (
                    <div className="flex items-center gap-2">
                      <div className="size-12 rounded-md bg-background border border-border/60 grid place-items-center overflow-hidden shrink-0">
                        <img src={logoDataUrl} alt="Brand logo" className="max-h-10 max-w-11 object-contain" />
                      </div>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="flex-1 text-xs text-foreground/80 hover:text-primary underline-offset-2 hover:underline text-left"
                      >
                        Replace logo
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoDataUrl(null)}
                        className="size-7 grid place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                        aria-label="Remove logo"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center gap-2 h-10 px-3 rounded-md border border-dashed border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-secondary/40 transition-colors"
                    >
                      <ImagePlus className="size-3.5" />
                      Add logo
                    </button>
                  )}
                </div>

                {logoDataUrl && (
                  <div className="space-y-3">
                    <SegControl
                      label="Placement"
                      options={["left", "center", "right"] as const}
                      value={logoPlacement}
                      onChange={setLogoPlacement}
                      renderLabel={(p) => p[0].toUpperCase()}
                    />
                    <SegControl
                      label="Size"
                      options={["s", "m", "l"] as const}
                      value={logoSize}
                      onChange={setLogoSize}
                      renderLabel={(s) => s.toUpperCase()}
                    />
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-border/60 p-4 space-y-2 bg-background/40">
              <Button
                onClick={handlePdf}
                disabled={exporting !== null}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {exporting === "pdf" ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> Building PDF…</>
                ) : (
                  <><FileDown className="size-4 mr-2" /> Download PDF</>
                )}
              </Button>
              <Button
                onClick={handleMd}
                disabled={exporting !== null}
                variant="outline"
                className="w-full h-10"
              >
                <FileText className="size-4 mr-2" /> Download Markdown
              </Button>
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                Edits apply to this export only.
              </p>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const REPORT_WIDTH = 794;

function PreviewPane({
  cluster,
  logoDataUrl,
  logoPlacement,
  logoSize,
}: {
  cluster: Cluster;
  logoDataUrl: string | null;
  logoPlacement: LogoPlacement;
  logoSize: LogoSize;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [innerH, setInnerH] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth - 32;
      setScale(Math.min(1, Math.max(0.25, w / REPORT_WIDTH)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setInnerH(el.scrollHeight));
    ro.observe(el);
    setInnerH(el.scrollHeight);
    return () => ro.disconnect();
  }, [cluster, logoDataUrl, logoPlacement, logoSize]);

  return (
    <div className="hidden md:flex flex-col bg-[#e7e1d2]/40 border-l border-border/60 min-h-0">
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between shrink-0 bg-background/60">
        <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-muted-foreground">
          Live PDF preview
        </p>
        <p className="text-[10px] font-mono text-muted-foreground">{Math.round(scale * 100)}%</p>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 overflow-auto p-4">
        <div
          style={{
            width: REPORT_WIDTH * scale,
            height: innerH * scale,
            margin: "0 auto",
            position: "relative",
          }}
        >
          <div
            ref={innerRef}
            style={{
              width: REPORT_WIDTH,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <ClusterReport
              cluster={cluster}
              logoDataUrl={logoDataUrl}
              logoPlacement={logoPlacement}
              logoSize={logoSize}
            />
          </div>
        </div>
      </div>
    </div>
  );
}



function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("text-[11px] uppercase tracking-[0.18em] font-mono text-muted-foreground", className)}>
      {children}
    </label>
  );
}

function EditableList({
  label,
  items,
  onChange,
  onAdd,
  onRemove,
  compact,
}: {
  label: string;
  items: string[];
  onChange: (j: number, v: string) => void;
  onAdd: () => void;
  onRemove: (j: number) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={onAdd}
          className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
        >
          <Plus className="size-3" /> Add
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((v, j) => (
          <div key={j} className="flex items-start gap-2">
            {compact ? (
              <Input
                value={v}
                onChange={(e) => onChange(j, e.target.value)}
                className="h-9 text-sm font-mono"
              />
            ) : (
              <Textarea
                value={v}
                onChange={(e) => onChange(j, e.target.value)}
                className="min-h-[40px] text-sm"
                rows={2}
              />
            )}
            <button
              type="button"
              onClick={() => onRemove(j)}
              className="size-9 shrink-0 grid place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive"
              aria-label="Remove"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground italic">None yet — click Add.</p>
        )}
      </div>
    </div>
  );
}

function SegControl<T extends string>({
  label,
  options,
  value,
  onChange,
  renderLabel,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  renderLabel: (v: T) => string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] font-mono text-muted-foreground mb-1">{label}</p>
      <div className="flex rounded-md border border-border/60 overflow-hidden">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-mono transition-colors",
              value === o
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            {renderLabel(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

function cleanCluster(c: Cluster): Cluster {
  const trim = (s: string) => s.trim();
  return {
    ...c,
    primaryTopic: trim(c.primaryTopic),
    gapSummary: c.gapSummary?.trim() || undefined,
    pillars: c.pillars.map((p) => ({
      ...p,
      title: trim(p.title),
      description: trim(p.description),
      articles: p.articles.map(trim).filter(Boolean),
      keywords: p.keywords.map(trim).filter(Boolean),
      internalLinks: p.internalLinks.map(trim).filter(Boolean),
      intent: p.intent?.trim() || undefined,
      opportunity: p.opportunity?.trim() || undefined,
    })),
  };
}
