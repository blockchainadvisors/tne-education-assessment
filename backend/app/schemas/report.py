from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReportSection(BaseModel):
    title: str
    content: str
    theme_code: str | None = None


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    assessment_id: uuid.UUID
    version: int
    executive_summary: str | None = None
    theme_analyses: dict | None = None
    improvement_recommendations: dict | list | None = None
    pdf_storage_key: str | None = None
    generated_by: str = "system"
    created_at: datetime

    # Frontend-compatible fields
    title: str = "TNE Quality Assessment Report"
    report_type: str = "self_assessment"
    sections: list[ReportSection] = []
    generated_at: str | None = None

    def model_post_init(self, __context: object) -> None:
        self.generated_at = self.created_at.isoformat() if self.created_at else None

        # Build sections list from the structured fields
        sections: list[ReportSection] = []

        if self.executive_summary:
            sections.append(ReportSection(
                title="Executive Summary",
                content=self.executive_summary,
            ))

        if self.theme_analyses and isinstance(self.theme_analyses, dict):
            for theme_key, analysis in self.theme_analyses.items():
                if isinstance(analysis, dict):
                    # Use theme_name from the analysis dict if available,
                    # otherwise fall back to the key
                    title = analysis.get("theme_name") or theme_key.replace("-", " ").replace("_", " ").title()
                    score = analysis.get("score")

                    # The analysis field may be markdown text or structured fields
                    if analysis.get("analysis"):
                        content = analysis["analysis"]
                    else:
                        content_parts = []
                        if analysis.get("summary"):
                            content_parts.append(analysis["summary"])
                        if analysis.get("strengths"):
                            content_parts.append("\n### Strengths\n")
                            for s in analysis["strengths"]:
                                content_parts.append(f"- {s}")
                        if analysis.get("areas_for_improvement"):
                            content_parts.append("\n### Areas for Improvement\n")
                            for a in analysis["areas_for_improvement"]:
                                content_parts.append(f"- {a}")
                        content = "\n".join(content_parts)

                    if score is not None:
                        title = f"{title} ({score:.1f}/100)"

                    sections.append(ReportSection(
                        title=title,
                        content=content,
                        theme_code=theme_key,
                    ))
                elif isinstance(analysis, str):
                    sections.append(ReportSection(
                        title=theme_key.replace("-", " ").replace("_", " ").title(),
                        content=analysis,
                        theme_code=theme_key,
                    ))

        if self.improvement_recommendations:
            recs = self.improvement_recommendations
            if isinstance(recs, list):
                content_parts = []
                for i, rec in enumerate(recs, 1):
                    if isinstance(rec, dict):
                        title_text = rec.get("title", f"Recommendation {i}")
                        priority = rec.get("priority", "")
                        rationale = rec.get("rationale", rec.get("recommendation", ""))
                        timeline = rec.get("suggested_timeline", rec.get("timeline", ""))
                        themes = rec.get("themes_affected", [])
                        content_parts.append(f"### {i}. {title_text}")
                        if priority:
                            content_parts.append(f"\n**Priority:** {priority}")
                        if themes:
                            content_parts.append(f"\n**Themes:** {', '.join(themes) if isinstance(themes, list) else themes}")
                        if rationale:
                            content_parts.append(f"\n{rationale}")
                        if timeline:
                            content_parts.append(f"\n**Timeline:** {timeline}")
                        content_parts.append("")
                    else:
                        content_parts.append(f"- {rec}")
                sections.append(ReportSection(
                    title="Improvement Recommendations",
                    content="\n".join(content_parts),
                ))

        self.sections = sections
