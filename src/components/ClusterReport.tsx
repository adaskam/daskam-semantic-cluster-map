import type { Cluster } from "@/lib/cluster.functions";
import { Plus, X } from "lucide-react";

/**
 * Atlas-style editable cluster report.
 *
 * Used in two places:
 *  1. On-page editable canvas — pass `editable` and `onChange`. Any text is
 *     click-to-refine, exactly like the persona generator's document canvas.
 *  2. Off-screen PDF render — pass nothing. Renders as static text only,
 *     so html-to-image captures a clean document.
 */

const PAPER = "#f1ede3";
const PAPER_DEEP = "#e7e1d2";
const INK = "#16201c";
const INK_SOFT = "#34403a";
const MUTED = "#7e8378";
const RULE = "#cfc8b8";
const ACCENT = "#2d5a4e";
const ACCENT_2 = "#c08a3c";

const DISPLAY = "'Space Grotesk', 'Inter', system-ui, sans-serif";
const SERIF = "'Fraunces', Georgia, serif";
const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const eyebrow: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: MUTED,
};

function coord(i: number, total: number) {
  const lat = String(i + 1).padStart(2, "0");
  const lon = String(total - i).padStart(2, "0");
  return `N ${lat} · W ${lon}`;
}

const GridBackground = () => (
  <div
    aria-hidden
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage: `linear-gradient(${RULE} 1px, transparent 1px), linear-gradient(90deg, ${RULE} 1px, transparent 1px)`,
      backgroundSize: "32px 32px",
      opacity: 0.18,
      pointerEvents: "none",
    }}
  />
);

export type LogoPlacement = "left" | "center" | "right";
export type LogoSize = "s" | "m" | "l";

const LOGO_HEIGHTS: Record<LogoSize, number> = { s: 28, m: 44, l: 64 };
const LOGO_MAX_WIDTHS: Record<LogoSize, number> = { s: 110, m: 170, l: 240 };

/* ---------- editable primitives ---------- */

function Editable({
  as: Tag = "span",
  value,
  onChange,
  editable,
  multiline = false,
  style,
}: {
  as?: keyof React.JSX.IntrinsicElements;
  value: string;
  onChange?: (v: string) => void;
  editable?: boolean;
  multiline?: boolean;
  style?: React.CSSProperties;
}) {
  const Component = Tag as React.ElementType;
  if (!editable) {
    return <Component style={style}>{value}</Component>;
  }
  return (
    <Component
      contentEditable
      suppressContentEditableWarning
      data-no-pdf=""
      style={{
        outline: "none",
        cursor: "text",
        borderRadius: 2,
        padding: "0 2px",
        margin: "0 -2px",
        transition: "background 0.15s",
        ...style,
      }}
      onFocus={(e: React.FocusEvent<HTMLElement>) => {
        e.currentTarget.style.background = `color-mix(in oklab, ${ACCENT} 12%, transparent)`;
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        e.currentTarget.style.background = "transparent";
        const text = (multiline ? e.currentTarget.innerText : e.currentTarget.textContent) ?? "";
        if (text !== value) onChange?.(text);
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
        if (document.activeElement !== e.currentTarget) {
          e.currentTarget.style.background = `color-mix(in oklab, ${ACCENT} 6%, transparent)`;
        }
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
        if (document.activeElement !== e.currentTarget) {
          e.currentTarget.style.background = "transparent";
        }
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    >
      {value}
    </Component>
  );
}

function ListItemControls({
  editable,
  onAdd,
  onRemove,
}: {
  editable: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
}) {
  if (!editable) return null;
  return (
    <span
      data-no-pdf=""
      style={{ display: "inline-flex", gap: 4, marginLeft: 8, verticalAlign: "middle" }}
    >
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          title="Remove"
          style={{
            width: 18,
            height: 18,
            display: "inline-grid",
            placeItems: "center",
            borderRadius: 4,
            border: `1px solid ${RULE}`,
            background: "transparent",
            color: MUTED,
            cursor: "pointer",
            opacity: 0.6,
          }}
        >
          <X size={10} />
        </button>
      )}
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          title="Add"
          style={{
            width: 18,
            height: 18,
            display: "inline-grid",
            placeItems: "center",
            borderRadius: 4,
            border: `1px solid ${ACCENT}`,
            background: "transparent",
            color: ACCENT,
            cursor: "pointer",
          }}
        >
          <Plus size={10} />
        </button>
      )}
    </span>
  );
}

export function ClusterReport({
  cluster,
  onChange,
  editable = false,
  logoDataUrl,
  logoPlacement = "left",
  logoSize = "m",
}: {
  cluster: Cluster;
  onChange?: (next: Cluster) => void;
  editable?: boolean;
  logoDataUrl?: string | null;
  logoPlacement?: LogoPlacement;
  logoSize?: LogoSize;
}) {
  const date = new Date()
    .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })
    .toUpperCase();

  const plateTotal = cluster.pillars.length;
  const logoH = LOGO_HEIGHTS[logoSize];
  const logoMaxW = LOGO_MAX_WIDTHS[logoSize];

  const setPrimaryTopic = (v: string) => onChange?.({ ...cluster, primaryTopic: v });
  const updatePillar = (idx: number, patch: Partial<Cluster["pillars"][number]>) => {
    if (!onChange) return;
    const next = cluster.pillars.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onChange({ ...cluster, pillars: next });
  };
  const updateArray = (
    pIdx: number,
    key: "articles" | "keywords" | "internalLinks",
    arr: string[],
  ) => {
    updatePillar(pIdx, { [key]: arr } as Partial<Cluster["pillars"][number]>);
  };

  const renderLogo = () =>
    logoDataUrl ? (
      <img
        src={logoDataUrl}
        alt="Brand logo"
        crossOrigin="anonymous"
        style={{
          height: logoH,
          maxHeight: logoH,
          maxWidth: logoMaxW,
          width: "auto",
          objectFit: "contain",
          display: "block",
        }}
      />
    ) : (
      <div
        style={{
          width: 28,
          height: 28,
          border: `1.5px solid ${ACCENT}`,
          borderRadius: "50%",
          position: "relative",
        }}
      >
        <span style={{ position: "absolute", width: 1.5, height: 14, background: ACCENT, top: 7, left: "calc(50% - 0.75px)" }} />
        <span style={{ position: "absolute", width: 14, height: 1.5, background: ACCENT, left: 7, top: "calc(50% - 0.75px)" }} />
      </div>
    );

  return (
    <article
      style={{
        width: 794,
        background: PAPER,
        color: INK,
        fontFamily: SANS,
        border: `1px solid ${RULE}`,
      }}
    >
      {/* COVER */}
      <header
        data-pdf-section
        style={{
          position: "relative",
          padding: "56px 56px 52px",
          borderBottom: `1px solid ${RULE}`,
          overflow: "hidden",
        }}
      >
        <GridBackground />

        {logoPlacement === "center" ? (
          <>
            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={eyebrow}>Cluster Atlas · Vol. 01</span>
              <span style={eyebrow}>{date}</span>
            </div>
            <div style={{ position: "relative", display: "flex", justifyContent: "center", marginTop: 28 }}>
              {renderLogo()}
            </div>
          </>
        ) : (
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexDirection: logoPlacement === "right" ? "row-reverse" : "row",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexDirection: logoPlacement === "right" ? "row-reverse" : "row" }}>
              {renderLogo()}
              <span style={eyebrow}>Cluster Atlas · Vol. 01</span>
            </div>
            <span style={eyebrow}>{date}</span>
          </div>
        )}

        <div style={{ position: "relative", marginTop: 44 }}>
          <div style={{ ...eyebrow, color: ACCENT, marginBottom: 14 }}>Primary Territory</div>
          <Editable
            as="h1"
            value={cluster.primaryTopic}
            onChange={setPrimaryTopic}
            editable={editable}
            style={{
              fontFamily: DISPLAY,
              fontSize: 54,
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              margin: 0,
              fontWeight: 500,
              color: INK,
              display: "block",
            }}
          />
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 18,
              lineHeight: 1.5,
              color: INK_SOFT,
              margin: "22px 0 0",
              maxWidth: 560,
            }}
          >
            A surveyed map of {plateTotal} content pillars — with article ideas, target
            keywords, and an internal linking system ready to brief into production.
          </p>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 44,
            border: `1px solid ${RULE}`,
            background: `color-mix(in oklab, ${PAPER} 80%, ${PAPER_DEEP})`,
          }}
        >
          <div
            style={{
              ...eyebrow,
              padding: "10px 16px",
              borderBottom: `1px solid ${RULE}`,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Plate Index</span>
            <span>{plateTotal} Pillars</span>
          </div>
          <div>
            {cluster.pillars.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr auto",
                  alignItems: "center",
                  gap: 18,
                  padding: "14px 16px",
                  borderTop: i === 0 ? "none" : `1px solid ${RULE}`,
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 11, color: ACCENT, letterSpacing: "0.1em" }}>
                  PL.{String(i + 1).padStart(2, "0")}
                </div>
                <Editable
                  as="div"
                  value={p.title}
                  onChange={(v) => updatePillar(i, { title: v })}
                  editable={editable}
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 17,
                    fontWeight: 500,
                    color: INK,
                    letterSpacing: "-0.005em",
                  }}
                />
                <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>
                  {coord(i, plateTotal)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* PILLAR PLATES */}
      {cluster.pillars.map((p, i) => (
        <section
          key={i}
          data-pdf-section
          style={{ position: "relative", padding: "44px 56px 48px", borderBottom: `1px solid ${RULE}` }}
        >
          <header
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "end",
              gap: 24,
              paddingBottom: 18,
              marginBottom: 30,
              borderBottom: `1px solid ${RULE}`,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: ACCENT,
                  }}
                >
                  Plate {String(i + 1).padStart(2, "0")} / {String(plateTotal).padStart(2, "0")}
                </span>
                <span style={{ flex: 1, height: 1, background: RULE }} />
                <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>
                  {coord(i, plateTotal)}
                </span>
              </div>
              <Editable
                as="h2"
                value={p.title}
                onChange={(v) => updatePillar(i, { title: v })}
                editable={editable}
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 32,
                  lineHeight: 1.08,
                  letterSpacing: "-0.018em",
                  margin: 0,
                  fontWeight: 500,
                  display: "block",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 13,
                color: MUTED,
                whiteSpace: "nowrap",
                paddingBottom: 4,
              }}
            >
              — Pillar
            </span>
          </header>

          <Editable
            as="p"
            value={p.description}
            onChange={(v) => updatePillar(i, { description: v })}
            editable={editable}
            multiline
            style={{
              fontFamily: SERIF,
              fontSize: 16.5,
              lineHeight: 1.55,
              color: INK_SOFT,
              margin: "0 0 32px",
              maxWidth: 620,
              display: "block",
            }}
          />

          {/* Articles */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ ...eyebrow, marginBottom: 14, color: ACCENT, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>◇ Article Vectors</span>
              {editable && (
                <button
                  type="button"
                  data-no-pdf=""
                  onClick={() => updateArray(i, "articles", [...p.articles, "New article idea"])}
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: ACCENT,
                    background: "transparent",
                    border: `1px solid ${ACCENT}`,
                    padding: "3px 8px",
                    cursor: "pointer",
                    letterSpacing: "0.1em",
                  }}
                >
                  + ADD
                </button>
              )}
            </div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {p.articles.map((a, j) => (
                <li
                  key={j}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px 1fr auto",
                    gap: 16,
                    padding: "12px 0",
                    borderTop: j === 0 ? "none" : `1px dashed ${RULE}`,
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 11, color: ACCENT_2, letterSpacing: "0.1em" }}>
                    A.{String(j + 1).padStart(2, "0")}
                  </span>
                  <Editable
                    as="span"
                    value={a}
                    onChange={(v) => {
                      const next = [...p.articles];
                      next[j] = v;
                      updateArray(i, "articles", next);
                    }}
                    editable={editable}
                    multiline
                    style={{
                      fontFamily: DISPLAY,
                      fontSize: 16,
                      lineHeight: 1.4,
                      color: INK,
                      fontWeight: 450,
                      display: "block",
                    }}
                  />
                  <ListItemControls
                    editable={editable}
                    onRemove={() =>
                      updateArray(
                        i,
                        "articles",
                        p.articles.filter((_, k) => k !== j),
                      )
                    }
                  />
                </li>
              ))}
            </ol>
          </div>

          {/* Keywords + Links */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 32,
              borderTop: `1px solid ${RULE}`,
              paddingTop: 28,
            }}
          >
            <div>
              <div style={{ ...eyebrow, marginBottom: 12, color: ACCENT, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>◆ Target Keywords</span>
                {editable && (
                  <button
                    type="button"
                    data-no-pdf=""
                    onClick={() => updateArray(i, "keywords", [...p.keywords, "new keyword"])}
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      color: ACCENT,
                      background: "transparent",
                      border: `1px solid ${ACCENT}`,
                      padding: "2px 6px",
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                )}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {p.keywords.map((k, j) => (
                  <li
                    key={j}
                    style={{
                      border: `1px solid ${RULE}`,
                      background: PAPER_DEEP,
                      padding: "5px 10px",
                      fontFamily: MONO,
                      fontSize: 10.5,
                      letterSpacing: "0.06em",
                      color: INK_SOFT,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <Editable
                      as="span"
                      value={k}
                      onChange={(v) => {
                        const next = [...p.keywords];
                        next[j] = v;
                        updateArray(i, "keywords", next);
                      }}
                      editable={editable}
                    />
                    <ListItemControls
                      editable={editable}
                      onRemove={() =>
                        updateArray(
                          i,
                          "keywords",
                          p.keywords.filter((_, m) => m !== j),
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ ...eyebrow, marginBottom: 12, color: ACCENT, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>◈ Link System</span>
                {editable && (
                  <button
                    type="button"
                    data-no-pdf=""
                    onClick={() =>
                      updateArray(i, "internalLinks", [...p.internalLinks, "New internal link recommendation"])
                    }
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      color: ACCENT,
                      background: "transparent",
                      border: `1px solid ${ACCENT}`,
                      padding: "2px 6px",
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                )}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {p.internalLinks.map((l, j) => (
                  <li
                    key={j}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "18px 1fr auto",
                      gap: 10,
                      padding: "8px 0",
                      borderTop: j === 0 ? "none" : `1px dashed ${RULE}`,
                      alignItems: "baseline",
                    }}
                  >
                    <span style={{ color: ACCENT, fontFamily: MONO, fontSize: 12 }}>↳</span>
                    <Editable
                      as="span"
                      value={l}
                      onChange={(v) => {
                        const next = [...p.internalLinks];
                        next[j] = v;
                        updateArray(i, "internalLinks", next);
                      }}
                      editable={editable}
                      multiline
                      style={{
                        fontFamily: SANS,
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        color: INK_SOFT,
                        display: "block",
                      }}
                    />
                    <ListItemControls
                      editable={editable}
                      onRemove={() =>
                        updateArray(
                          i,
                          "internalLinks",
                          p.internalLinks.filter((_, m) => m !== j),
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ))}

      <footer
        data-pdf-section
        style={{
          padding: "22px 56px",
          background: PAPER_DEEP,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={eyebrow}>
          {editable ? "Click any text to refine · End of Atlas" : "End of Atlas"}
        </span>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: MUTED }}>
          Surveyed by Cluster Cartographer
        </span>
      </footer>
    </article>
  );
}
