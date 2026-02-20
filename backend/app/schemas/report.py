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
            for theme_code, analysis in self.theme_analyses.items():
                if isinstance(analysis, dict):
                    content_parts = []
                    if analysis.get("summary"):
                        content_parts.append(f"<p>{analysis['summary']}</p>")
                    if analysis.get("strengths"):
                        content_parts.append("<h4>Strengths</h4><ul>")
                        for s in analysis["strengths"]:
                            content_parts.append(f"<li>{s}</li>")
                        content_parts.append("</ul>")
                    if analysis.get("areas_for_improvement"):
                        content_parts.append("<h4>Areas for Improvement</h4><ul>")
                        for a in analysis["areas_for_improvement"]:
                            content_parts.append(f"<li>{a}</li>")
                        content_parts.append("</ul>")
                    sections.append(ReportSection(
                        title=theme_code.replace("-", " ").replace("_", " ").title(),
                        content="".join(content_parts),
                        theme_code=theme_code,
                    ))
                elif isinstance(analysis, str):
                    sections.append(ReportSection(
                        title=theme_code.replace("-", " ").replace("_", " ").title(),
                        content=f"<p>{analysis}</p>",
                        theme_code=theme_code,
                    ))

        if self.improvement_recommendations:
            recs = self.improvement_recommendations
            if isinstance(recs, list):
                content_parts = ["<ul>"]
                for rec in recs:
                    if isinstance(rec, dict):
                        priority = rec.get("priority", "")
                        text = rec.get("recommendation", str(rec))
                        timeline = rec.get("timeline", "")
                        content_parts.append(
                            f"<li><strong>[{priority.upper()}]</strong> {text}"
                            + (f" <em>(Timeline: {timeline})</em>" if timeline else "")
                            + "</li>"
                        )
                    else:
                        content_parts.append(f"<li>{rec}</li>")
                content_parts.append("</ul>")
                sections.append(ReportSection(
                    title="Improvement Recommendations",
                    content="".join(content_parts),
                ))

        self.sections = sections
