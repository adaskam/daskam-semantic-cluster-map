import type { Cluster } from "@/lib/cluster.functions";

/**
 * Editorial-style printable report for the content cluster.
 * Rendered off-screen, then captured section-by-section into a PDF.
 * Styling intentionally inlined so it survives html-to-image capture
 * regardless of the active app theme.
 */

const PAPER = "#faf8f3";
const INK = "#1a1612";
const INK_SOFT = "#3a342c";
const MUTED = "#8a7f72";
const BORDER = "#d9d2c5";
const ACCENT = "#b5532a"; // terracotta

const SERIF = "'Fraunces', Georgia, serif";
const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const eyebrow: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: MUTED,
};

export function ClusterReport({ cluster }: { cluster: Cluster }) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <article
      style={{
        width: 794, // ~A4 at 96dpi
        background: PAPER,
        color: INK,
        fontFamily: SANS,
        border: `1px solid ${BORDER}`,
      }}
    >
      {/* HEADER */}
      <header
        data-pdf-section
        style={{ padding: "56px 56px 48px", borderBottom: `1px solid ${BORDER}` }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={eyebrow}>Content Cluster · Document 001</span>
          <span style={{ ...eyebrow, color: MUTED }}>{date}</span>
        </div>

        <h1
          style={{
            fontFamily: SERIF,
            fontSize: 56,
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
            margin: "28px 0 0",
            fontWeight: 500,
          }}
        >
          {cluster.primaryTopic}
        </h1>

        <div
          style={{
            marginTop: 28,
            paddingLeft: 18,
            borderLeft: `2px solid ${ACCENT}`,
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 38,
              lineHeight: 0.8,
              color: ACCENT,
            }}
          >
            “
          </span>
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 19,
              lineHeight: 1.45,
              color: INK_SOFT,
              margin: 0,
            }}
          >
            A semantic content map of {cluster.pillars.length} pillars, with article ideas,
            target keywords, and an internal linking strategy ready to brief into production.
          </p>
        </div>

        {/* Pillar index */}
        <div
          style={{
            marginTop: 36,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            border: `1px solid ${BORDER}`,
          }}
        >
          {cluster.pillars.map((p, i) => (
            <div
              key={i}
              style={{
                padding: "16px 18px",
                borderRight: i % 2 === 0 ? `1px solid ${BORDER}` : "none",
                borderBottom:
                  i < cluster.pillars.length - (cluster.pillars.length % 2 === 0 ? 2 : 1)
                    ? `1px solid ${BORDER}`
                    : "none",
              }}
            >
              <div style={{ ...eyebrow, marginBottom: 6 }}>
                Pillar {String(i + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 18,
                  lineHeight: 1.25,
                  fontWeight: 500,
                }}
              >
                {p.title}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* PILLAR SECTIONS */}
      {cluster.pillars.map((p, i) => (
        <section
          key={i}
          data-pdf-section
          style={{
            padding: "44px 56px 48px",
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          {/* Section title */}
          <header
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 24,
              paddingBottom: 16,
              marginBottom: 28,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <div>
              <div style={{ ...eyebrow, marginBottom: 8 }}>
                Section {String(i + 1).padStart(2, "0")}
              </div>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontSize: 34,
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
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
                fontSize: 14,
                color: MUTED,
                whiteSpace: "nowrap",
              }}
            >
              Content Pillar
            </span>
          </header>

          <p
            style={{
              fontFamily: SERIF,
              fontSize: 17,
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
            <div style={{ ...eyebrow, marginBottom: 14 }}>Article ideas</div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {p.articles.map((a, j) => (
                <li
                  key={j}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr",
                    gap: 16,
                    padding: "10px 0",
                    borderTop: j === 0 ? "none" : `1px solid ${BORDER}`,
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontFamily: SERIF,
                      fontSize: 22,
                      color: ACCENT,
                      lineHeight: 1,
                    }}
                  >
                    {String(j + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontFamily: SERIF,
                      fontSize: 17,
                      lineHeight: 1.4,
                      color: INK,
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
              borderTop: `1px solid ${BORDER}`,
              paddingTop: 28,
            }}
          >
            <div>
              <div style={{ ...eyebrow, marginBottom: 12 }}>Recommended keywords</div>
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
                      border: `1px solid ${BORDER}`,
                      background: "#f1ece0",
                      padding: "5px 10px",
                      fontFamily: MONO,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: INK_SOFT,
                    }}
                  >
                    {k}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ ...eyebrow, marginBottom: 12 }}>Internal linking strategy</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {p.internalLinks.map((l, j) => (
                  <li
                    key={j}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "14px 1fr",
                      gap: 10,
                      padding: "8px 0",
                      borderTop: j === 0 ? "none" : `1px solid ${BORDER}`,
                      alignItems: "baseline",
                    }}
                  >
                    <span style={{ color: ACCENT, fontFamily: MONO, fontSize: 13 }}>→</span>
                    <span
                      style={{
                        fontSize: 14,
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

      {/* FOOTER */}
      <footer
        data-pdf-section
        style={{
          padding: "20px 56px",
          background: "#f1ece0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={eyebrow}>End of document</span>
        <span
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 14,
            color: MUTED,
          }}
        >
          Synthesized by Cluster Cartographer
        </span>
      </footer>
    </article>
  );
}
