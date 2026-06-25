import type { Cluster } from "@/lib/cluster.functions";

/**
 * Atlas-style printable report for the content cluster.
 *
 * Design intent: lives in the same paper / editorial universe as the persona
 * generator export, but with its own clear identity — cartographic grid motifs,
 * sans-serif display type (Space Grotesk) with serif italic as accent (flipping
 * the persona's serif-first hierarchy), and a deep forest / ochre palette
 * instead of terracotta. A client opening both PDFs sees siblings, not twins.
 */

const PAPER = "#f1ede3";
const PAPER_DEEP = "#e7e1d2";
const INK = "#16201c";
const INK_SOFT = "#34403a";
const MUTED = "#7e8378";
const RULE = "#cfc8b8";
const ACCENT = "#2d5a4e"; // deep forest
const ACCENT_2 = "#c08a3c"; // ochre

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

// Coordinate-like reference label (atlas motif): e.g. N 01 · W 04
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

export function ClusterReport({
  cluster,
  logoDataUrl,
}: {
  cluster: Cluster;
  logoDataUrl?: string | null;
}) {
  const date = new Date()
    .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })
    .toUpperCase();

  const plateTotal = cluster.pillars.length;

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

        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt="Brand logo"
                style={{
                  maxHeight: 36,
                  maxWidth: 140,
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
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    margin: "auto",
                    width: 1.5,
                    height: 14,
                    background: ACCENT,
                    top: 7,
                    left: "calc(50% - 0.75px)",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    margin: "auto",
                    width: 14,
                    height: 1.5,
                    background: ACCENT,
                    left: 7,
                    top: "calc(50% - 0.75px)",
                  }}
                />
              </div>
            )}
            <span style={eyebrow}>Cluster Atlas · Vol. 01</span>
          </div>
          <span style={eyebrow}>{date}</span>
        </div>

        <div style={{ position: "relative", marginTop: 44 }}>
          <div
            style={{
              ...eyebrow,
              color: ACCENT,
              marginBottom: 14,
            }}
          >
            Primary Territory
          </div>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontSize: 54,
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              margin: 0,
              fontWeight: 500,
              color: INK,
            }}
          >
            {cluster.primaryTopic}
          </h1>
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

        {/* Legend / plate index */}
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
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: ACCENT,
                    letterSpacing: "0.1em",
                  }}
                >
                  PL.{String(i + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 17,
                    fontWeight: 500,
                    color: INK,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {p.title}
                </div>
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
          style={{
            position: "relative",
            padding: "44px 56px 48px",
            borderBottom: `1px solid ${RULE}`,
          }}
        >
          {/* Plate header */}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
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
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: RULE,
                  }}
                />
                <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>
                  {coord(i, plateTotal)}
                </span>
              </div>
              <h2
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 32,
                  lineHeight: 1.08,
                  letterSpacing: "-0.018em",
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                {p.title}
              </h2>
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

          <p
            style={{
              fontFamily: SERIF,
              fontSize: 16.5,
              lineHeight: 1.55,
              color: INK_SOFT,
              margin: "0 0 32px",
              maxWidth: 620,
            }}
          >
            {p.description}
          </p>

          {/* Articles */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ ...eyebrow, marginBottom: 14, color: ACCENT }}>
              ◇ Article Vectors
            </div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {p.articles.map((a, j) => (
                <li
                  key={j}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px 1fr",
                    gap: 16,
                    padding: "12px 0",
                    borderTop: j === 0 ? "none" : `1px dashed ${RULE}`,
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      color: ACCENT_2,
                      letterSpacing: "0.1em",
                    }}
                  >
                    A.{String(j + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontFamily: DISPLAY,
                      fontSize: 16,
                      lineHeight: 1.4,
                      color: INK,
                      fontWeight: 450,
                    }}
                  >
                    {a}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Two-column: Keywords | Internal links */}
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
              <div style={{ ...eyebrow, marginBottom: 12, color: ACCENT }}>
                ◆ Target Keywords
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
                    }}
                  >
                    {k}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ ...eyebrow, marginBottom: 12, color: ACCENT }}>
                ◈ Link System
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {p.internalLinks.map((l, j) => (
                  <li
                    key={j}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "18px 1fr",
                      gap: 10,
                      padding: "8px 0",
                      borderTop: j === 0 ? "none" : `1px dashed ${RULE}`,
                      alignItems: "baseline",
                    }}
                  >
                    <span
                      style={{
                        color: ACCENT,
                        fontFamily: MONO,
                        fontSize: 12,
                        letterSpacing: 0,
                      }}
                    >
                      ↳
                    </span>
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        color: INK_SOFT,
                      }}
                    >
                      {l}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ))}

      {/* COLOPHON */}
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
        <span style={eyebrow}>End of Atlas</span>
        <span
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 13,
            color: MUTED,
          }}
        >
          Surveyed by Cluster Cartographer
        </span>
      </footer>
    </article>
  );
}
