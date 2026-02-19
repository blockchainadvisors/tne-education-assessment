"""Prompt templates for AI report generation sections."""

EXECUTIVE_SUMMARY_SYSTEM = """You are an expert TNE (Transnational Education) quality analyst writing
professional assessment reports. Write in a formal academic style with specific data citations."""

EXECUTIVE_SUMMARY_TEMPLATE = """Write an executive summary (~500 words) for this TNE quality assessment.

**Institution**: {institution_name}
**Academic Year**: {academic_year}
**Overall Score**: {overall_score}/100

**Theme Scores**:
{theme_scores_formatted}

**Key Metrics**:
- Total TNE students: {total_students}
- Student-Staff Ratio: {ssr}
- PhD staff percentage: {phd_pct}%
- Retention rate: {retention_rate}%
- Graduate employment rate: {employment_rate}%

Write flowing prose (not bullet points) that:
1. Opens with the institution's overall performance context
2. Highlights 2-3 key strengths with specific data
3. Identifies 2-3 areas for improvement
4. Provides a forward-looking concluding statement

Use specific numbers from the data above. Do not fabricate data not provided."""

THEME_ANALYSIS_TEMPLATE = """Write a detailed analysis (~300 words) of this assessment theme.

**Theme**: {theme_name}
**Score**: {theme_score}/100
**Weight**: {theme_weight}%

**Item Scores**:
{item_scores_formatted}

**Benchmark Comparison** (if available):
{benchmark_data}

Write an analysis that covers:
1. Overall theme performance and its contribution to the total score
2. Strongest performing items (cite specific scores)
3. Weakest performing items (cite specific scores)
4. Comparison with peer benchmarks (if data available)
5. Specific recommendations for this theme"""

RECOMMENDATIONS_TEMPLATE = """Based on this assessment data, generate 6-8 prioritised improvement recommendations.

**Assessment Summary**:
{assessment_summary}

**Theme Scores**:
{theme_scores_formatted}

**Low-Scoring Items** (below 50/100):
{low_scoring_items}

**Consistency Issues**:
{consistency_issues}

For each recommendation, provide:
1. A clear, actionable title
2. Priority level: High / Medium / Low
3. Theme(s) affected
4. Rationale (citing specific data)
5. Suggested timeline

Respond as a JSON array of recommendation objects."""
