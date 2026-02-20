"""PDF report renderer.

Renders assessment report data to a styled HTML template via Jinja2,
converts markdown content to HTML via mistune, then renders to PDF
via WeasyPrint.
"""

import io
import re
from datetime import datetime, timezone

import mistune
import weasyprint
from jinja2 import Environment, BaseLoader
from markupsafe import Markup

from app.models.report import AssessmentReport

_md = mistune.create_markdown(escape=False)


def _md_to_html(text: str) -> str:
    """Convert markdown text to HTML, stripping redundant top-level headings."""
    if not text:
        return ""
    html = _md(text)
    # Strip leading H1/H2 that just repeats the section title
    html = re.sub(r"^\s*<h[12][^>]*>.*?</h[12]>\s*", "", html, count=1)
    return html


REPORT_HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4;
    margin: 2cm 2.5cm 2.5cm 2.5cm;
    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 8pt;
      color: #94a3b8;
      font-family: Helvetica, Arial, sans-serif;
    }
  }
  @page :first { margin-top: 1.5cm; }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    color: #1e293b;
  }

  /* ── Cover ───────────────────────────────── */
  .cover {
    text-align: center;
    padding: 30px 0 20px;
    border-bottom: 3px solid #4f46e5;
    margin-bottom: 24px;
  }
  .cover h1 {
    font-size: 20pt;
    color: #4f46e5;
    margin-bottom: 4px;
    letter-spacing: -0.3px;
  }
  .cover .subtitle {
    font-size: 12pt;
    color: #475569;
  }
  .cover .meta {
    margin-top: 12px;
    font-size: 9pt;
    color: #64748b;
  }

  /* ── Score cards ─────────────────────────── */
  .scores-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 24px;
    page-break-inside: avoid;
  }
  .scores-box h2 {
    font-size: 11pt;
    color: #1e293b;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
  }
  .score-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .score-card {
    flex: 1 1 100px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 10px 6px;
    text-align: center;
  }
  .score-card .label {
    font-size: 7.5pt;
    color: #64748b;
    line-height: 1.3;
    margin-bottom: 2px;
  }
  .score-card .value {
    font-size: 16pt;
    font-weight: 700;
  }
  .score-card .bar {
    margin-top: 4px;
    height: 3px;
    border-radius: 2px;
    background: #e2e8f0;
  }
  .score-card .bar-fill {
    height: 3px;
    border-radius: 2px;
  }
  .good { color: #059669; }
  .good-bg { background: #059669; }
  .fair { color: #d97706; }
  .fair-bg { background: #d97706; }
  .poor { color: #dc2626; }
  .poor-bg { background: #dc2626; }
  .brand { color: #4f46e5; }
  .brand-bg { background: #4f46e5; }

  /* ── Table of contents ───────────────────── */
  .toc {
    margin-bottom: 24px;
    page-break-after: avoid;
  }
  .toc h2 {
    font-size: 11pt;
    color: #4f46e5;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 2px solid #e0e7ff;
  }
  .toc ol {
    margin: 0;
    padding-left: 20px;
  }
  .toc li {
    font-size: 9.5pt;
    color: #475569;
    padding: 2px 0;
  }

  /* ── Section headings ────────────────────── */
  .section {
    margin-bottom: 20px;
  }
  .section-header {
    border-bottom: 2px solid #e0e7ff;
    padding-bottom: 4px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .section-header h2 {
    font-size: 13pt;
    color: #4f46e5;
    margin: 0;
  }
  .section-header .score-badge {
    font-size: 11pt;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 4px;
    white-space: nowrap;
  }

  /* ── Content typography ──────────────────── */
  .content h2 { font-size: 11pt; color: #4f46e5; margin: 14px 0 6px; }
  .content h3 { font-size: 10.5pt; color: #334155; margin: 12px 0 4px; font-weight: 600; }
  .content h4 { font-size: 10pt; color: #475569; margin: 10px 0 3px; font-weight: 600; }
  .content p  { margin-bottom: 6px; text-align: justify; }
  .content ul, .content ol {
    margin: 4px 0 8px 18px;
    padding: 0;
  }
  .content li {
    margin-bottom: 3px;
  }
  .content strong { color: #1e293b; }
  .content em { color: #475569; }
  .content blockquote {
    border-left: 3px solid #e0e7ff;
    padding: 4px 0 4px 12px;
    margin: 6px 0;
    color: #475569;
    font-style: italic;
  }

  /* ── Recommendation cards ────────────────── */
  .rec-card {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px 14px;
    margin-bottom: 10px;
    page-break-inside: avoid;
    background: #fafbfc;
  }
  .rec-card .rec-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .rec-card .rec-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4f46e5;
    color: white;
    font-size: 8pt;
    font-weight: 700;
    flex-shrink: 0;
  }
  .rec-card .rec-title {
    font-size: 10pt;
    font-weight: 600;
    color: #1e293b;
  }
  .rec-card .rec-meta {
    display: flex;
    gap: 10px;
    margin-bottom: 6px;
  }
  .rec-card .priority-badge {
    font-size: 7.5pt;
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .priority-high { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .priority-medium { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
  .priority-low { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  .rec-card .theme-tag {
    font-size: 7.5pt;
    color: #6366f1;
    background: #eef2ff;
    padding: 1px 8px;
    border-radius: 3px;
    border: 1px solid #c7d2fe;
  }
  .rec-card .rec-body { font-size: 9.5pt; color: #334155; }
  .rec-card .rec-body p { margin-bottom: 4px; }
  .rec-card .timeline {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed #e2e8f0;
    font-size: 8.5pt;
    color: #64748b;
  }

  /* ── Footer ──────────────────────────────── */
  .footer-note {
    margin-top: 30px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    font-size: 8pt;
    color: #94a3b8;
    text-align: center;
  }
</style>
</head>
<body>

<!-- Cover -->
<div class="cover">
  <h1>TNE Quality Assessment Report</h1>
  <div class="subtitle">{{ institution_name }}</div>
  <div class="meta">
    Academic Year: {{ academic_year }} &bull;
    Version {{ version }} &bull;
    Generated {{ generated_date }}
  </div>
</div>

<!-- Score cards -->
{% if overall_score is not none %}
<div class="scores-box">
  <h2>Assessment Scores</h2>
  <div class="score-grid">
    <div class="score-card">
      <div class="label">Overall Score</div>
      <div class="value brand">{{ "%.1f"|format(overall_score) }}%</div>
      <div class="bar"><div class="bar-fill brand-bg" style="width:{{ overall_score }}%"></div></div>
    </div>
    {% for ts in theme_scores %}
    <div class="score-card">
      <div class="label">{{ ts.name }}</div>
      <div class="value {{ score_class(ts.score) }}">{{ "%.1f"|format(ts.score) }}%</div>
      <div class="bar"><div class="bar-fill {{ score_class(ts.score) }}-bg" style="width:{{ ts.score }}%"></div></div>
    </div>
    {% endfor %}
  </div>
</div>
{% endif %}

<!-- Table of contents -->
<div class="toc">
  <h2>Contents</h2>
  <ol>
    {% for section in sections %}
    <li>{{ section.title }}</li>
    {% endfor %}
  </ol>
</div>

<!-- Sections -->
{% for section in sections %}
<div class="section">
  <div class="section-header">
    <h2>{{ section.title }}</h2>
    {% if section.score is not none %}
    <span class="score-badge {{ score_class(section.score) }}" style="background:{{ score_bg(section.score) }}">
      {{ "%.1f"|format(section.score) }}%
    </span>
    {% endif %}
  </div>
  {% if section.is_recommendations %}
    {{ section.content }}
  {% else %}
    <div class="content">{{ section.content }}</div>
  {% endif %}
</div>
{% endfor %}

<div class="footer-note">
  Generated by TNE Assessment Platform &bull; AI-Powered Quality Assessment
</div>

</body>
</html>
"""


def _score_class(score: float | None) -> str:
    if score is None:
        return ""
    if score >= 80:
        return "good"
    if score >= 60:
        return "fair"
    return "poor"


def _score_bg(score: float | None) -> str:
    if score is None:
        return "#f1f5f9"
    if score >= 80:
        return "#ecfdf5"
    if score >= 60:
        return "#fffbeb"
    return "#fef2f2"


def _build_recommendation_cards(recs_content: str) -> str:
    """Parse recommendation text/HTML and render as styled cards."""
    # The content may be:
    # 1. An HTML <ul> from the schema (structured recs with priority/timeline)
    # 2. Raw markdown with ### numbered headings
    # Try to parse structured recommendations from the raw data
    # Fall back to rendering as markdown content
    return f'<div class="content">{recs_content}</div>'


def _build_recommendations_from_raw(recs: list | dict | None) -> str:
    """Build recommendation cards directly from the raw DB data."""
    if not recs:
        return ""

    if isinstance(recs, dict):
        recs = list(recs.values()) if recs else []

    if not isinstance(recs, list):
        return f'<div class="content"><p>{recs}</p></div>'

    cards = []
    for i, rec in enumerate(recs, 1):
        if isinstance(rec, dict):
            title = rec.get("title", rec.get("recommendation", f"Recommendation {i}"))
            # Truncate overly long titles
            if len(title) > 120:
                title = title[:117] + "..."
            priority = rec.get("priority", "medium").lower()
            themes = rec.get("themes_affected", rec.get("themes", rec.get("theme", "")))
            if isinstance(themes, list):
                themes = ", ".join(themes)
            rationale = rec.get("rationale", rec.get("description", ""))
            timeline = rec.get("suggested_timeline", rec.get("timeline", ""))

            priority_cls = f"priority-{priority}" if priority in ("high", "medium", "low") else "priority-medium"

            card = f'<div class="rec-card">'
            card += f'<div class="rec-header">'
            card += f'<span class="rec-number">{i}</span>'
            card += f'<span class="rec-title">{title}</span>'
            card += f'</div>'
            card += f'<div class="rec-meta">'
            card += f'<span class="priority-badge {priority_cls}">{priority}</span>'
            if themes:
                card += f'<span class="theme-tag">{themes}</span>'
            card += f'</div>'
            if rationale:
                rationale_html = _md_to_html(rationale)
                card += f'<div class="rec-body">{rationale_html}</div>'
            if timeline:
                card += f'<div class="timeline"><strong>Timeline:</strong> {timeline}</div>'
            card += f'</div>'
            cards.append(card)
        elif isinstance(rec, str):
            cards.append(
                f'<div class="rec-card">'
                f'<div class="rec-header">'
                f'<span class="rec-number">{i}</span>'
                f'<span class="rec-title">Recommendation {i}</span>'
                f'</div>'
                f'<div class="rec-body"><p>{rec}</p></div>'
                f'</div>'
            )

    return "\n".join(cards)


def render_report_pdf(
    report: AssessmentReport,
    institution_name: str,
    academic_year: str,
    overall_score: float | None = None,
    theme_scores: list[dict] | None = None,
) -> bytes:
    """Render report to PDF bytes.

    Args:
        report: The AssessmentReport record with content fields populated.
        institution_name: Tenant/institution name for the cover page.
        academic_year: Assessment academic year string.
        overall_score: Overall assessment percentage (0-100).
        theme_scores: List of dicts with 'name' and 'score' keys.

    Returns:
        PDF file as bytes.
    """
    theme_scores = theme_scores or []
    theme_score_map = {ts["name"]: ts["score"] for ts in theme_scores}

    sections = []

    # Executive summary
    if report.executive_summary:
        sections.append({
            "title": "Executive Summary",
            "content": Markup(_md_to_html(report.executive_summary)),
            "score": None,
            "is_recommendations": False,
        })

    # Theme analyses
    if report.theme_analyses and isinstance(report.theme_analyses, dict):
        for _theme_id, analysis in report.theme_analyses.items():
            if isinstance(analysis, dict):
                theme_title = analysis.get("theme_name", _theme_id.replace("-", " ").replace("_", " ").title())
                theme_score = analysis.get("score")
                # Fall back to score from theme_score_map
                if theme_score is None:
                    theme_score = theme_score_map.get(theme_title)

                # The 'analysis' key holds the full markdown text
                analysis_text = analysis.get("analysis", "")
                if analysis_text:
                    content_html = _md_to_html(analysis_text)
                else:
                    # Fallback: try structured fields
                    html_parts = []
                    for field in ("summary", "strengths", "areas_for_improvement"):
                        val = analysis.get(field)
                        if isinstance(val, str):
                            html_parts.append(_md_to_html(val))
                        elif isinstance(val, list):
                            label = field.replace("_", " ").title()
                            html_parts.append(f"<h3>{label}</h3><ul>")
                            for item in val:
                                html_parts.append(f"<li>{item}</li>")
                            html_parts.append("</ul>")
                    content_html = "".join(html_parts)

                sections.append({
                    "title": theme_title,
                    "content": Markup(content_html),
                    "score": theme_score,
                    "is_recommendations": False,
                })

            elif isinstance(analysis, str):
                title = _theme_id.replace("-", " ").replace("_", " ").title()
                theme_score = theme_score_map.get(title)

                sections.append({
                    "title": title,
                    "content": Markup(_md_to_html(analysis)),
                    "score": theme_score,
                    "is_recommendations": False,
                })

    # Recommendations
    if report.improvement_recommendations:
        recs_html = _build_recommendations_from_raw(report.improvement_recommendations)
        sections.append({
            "title": "Improvement Recommendations",
            "content": Markup(recs_html),
            "score": None,
            "is_recommendations": True,
        })

    env = Environment(loader=BaseLoader(), autoescape=False)
    template = env.from_string(REPORT_HTML_TEMPLATE)

    html_str = template.render(
        institution_name=institution_name,
        academic_year=academic_year,
        version=report.version,
        generated_date=datetime.now(timezone.utc).strftime("%d %B %Y"),
        overall_score=overall_score,
        theme_scores=theme_scores,
        sections=sections,
        score_class=_score_class,
        score_bg=_score_bg,
    )

    pdf_bytes = io.BytesIO()
    weasyprint.HTML(string=html_str).write_pdf(pdf_bytes)
    return pdf_bytes.getvalue()
