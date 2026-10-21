"""
Generate datasetproposal.pdf for HackInsight 2026 Submission.
Team: DataMinors
"""

import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print total page numbers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "HackInsight 2026 | Dataset Proposal & Credible Resources | Team DataMinors")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)
            
        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, footer_text)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — HACKINSIGHT 2026 SUBMISSION")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 46, 558, 46)
        
        self.restoreState()


def build_dataset_proposal_pdf(output_path: Path):
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom palette
    navy = colors.HexColor("#0f172a")
    blue = colors.HexColor("#1e40af")
    teal = colors.HexColor("#0f766e")
    gray_bg = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#e2e8f0")
    dark_text = colors.HexColor("#1e293b")
    body_text = colors.HexColor("#334155")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=navy,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=blue,
        spaceAfter=12
    )
    
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=body_text
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=navy,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=teal,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=dark_text,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=12,
        bulletIndent=4,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=dark_text
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=navy
    )

    story = []

    # Title Banner
    story.append(Paragraph("DATASET PROPOSAL & CREDIBLE RESOURCES DOSSIER", title_style))
    story.append(Paragraph("HACKINSIGHT: DATA-TO-DECISION (TECHFEST '26) — AIR QUALITY TRACK", subtitle_style))
    
    # Metadata Box
    meta_data = [
        [
            Paragraph("<b>Team:</b> DataMinors", meta_style),
            Paragraph("<b>Target Horizon:</b> 24-Hour Ahead Hourly PM2.5 (µg/m³)", meta_style)
        ],
        [
            Paragraph("<b>Members:</b> Laiba Akram, Ali Hasan Farooqui, Areeba, Bushra Abid", meta_style),
            Paragraph("<b>Target Domain:</b> Lahore & Karachi Metropolitan Agglomerations", meta_style)
        ],
        [
            Paragraph("<b>Repository:</b> github.com/Ali-HF/HackInsight", meta_style),
            Paragraph("<b>Warehouse Volume:</b> 176,392 Verified Records (DuckDB/Parquet)", meta_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[270, 234])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), gray_bg),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # Section 1
    story.append(Paragraph("1. Problem Statement & Primary Decision-Maker Context", h1_style))
    story.append(Paragraph(
        "<b>The Operational Challenge:</b> The megacities of Lahore and Karachi face acute, chronic air pollution emergencies. "
        "During the winter smog season (October to February), Lahore frequently registers the highest PM2.5 concentrations worldwide (>500 µg/m³), "
        "imposing severe public health crises, widespread pediatric respiratory morbidity, and multi-billion-rupee economic shutdowns. "
        "Conversely, government reference monitors in Pakistan are sparse, geographically restricted, and suffer from recurrent data downtime.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Primary User & Decision Driven:</b> The primary user is the <i>Provincial Smog Response Officer</i> at the Punjab and Sindh "
        "Environmental Protection Departments (EPD / EPA). Every morning, this officer must enact statutory emergency actions: issuing district-specific "
        "public health advisories, directing school closures, and ordering targeted industrial or vehicular restrictions 24 hours in advance. "
        "Our system provides this officer with calibrated, hourly 24-hour-ahead forecasts equipped with conformal 80% uncertainty bounds and grounded citations.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # Section 2
    story.append(Paragraph("2. Credible Resource Inventory & Provenance Verification", h1_style))
    story.append(Paragraph(
        "In strict compliance with HackInsight Chapter 4 data governance mandates, all model training and evaluation rely on at least "
        "two independent, credible, and fully licensed sources, including an authoritative off-track resource with citable peer-reviewed provenance.",
        body_style
    ))

    # Resource 1 Box
    story.append(Paragraph("Source 1 (Primary Ground Network — Off-Track Credible Resource): PAQI via NASA ASDC DAAC", h2_style))
    story.append(Paragraph(
        "• <b>Dataset Name:</b> Low-Cost Sensor AQ: Pakistan Air Quality Initiative (PAQI)<br/>"
        "• <b>Originating Provider:</b> Pakistan Air Quality Initiative (Karachi / Lahore, Network PI: Abid Omar)<br/>"
        "• <b>Archive Publisher & DOI:</b> NASA Langley Atmospheric Science Data Center (ASDC) DAAC — <b>DOI: 10.5067/LOW-COST-SENSORS-AQ/PAKAIRQUALITY</b><br/>"
        "• <b>Off-Track Justification & Scientific Credibility:</b> Hosted by NASA ASDC under the NASA Low-Cost Air Quality Sensor Harmonization project. "
        "The dataset has undergone scientific vetting and peer-reviewed analysis presented at the European Geosciences Union (EGU General Assembly 2024, "
        "<i>Omar & Rosales, doi:10.5194/egusphere-egu24-453</i>). Fulfills the 'credible off-track source' requirement.<br/>"
        "• <b>Coverage & Volume:</b> 79,645 hourly timestamps spanning October 2016 through March 2026 across 210 sensor channels nationwide. "
        "Karachi contains 18 stations with 143,382 valid PM2.5 readings; Lahore contains 68 stations with 479,145 valid PM2.5 readings.<br/>"
        "• <b>Format & Checksum:</b> ICARTT standardized atmospheric format. Verified SHA-256: <code>892dc29a5d38af1e9f7a89996592faad0b2d93cb66bf3ebf72406d748819fe13</code> (181.9 MB).",
        bullet_style
    ))

    # Resource 2 Box
    story.append(Paragraph("Source 2 (Independent Physical Meteorological Covariates): NASA POWER Project", h2_style))
    story.append(Paragraph(
        "• <b>Dataset Name:</b> NASA POWER Hourly Point Reanalysis (Prediction Of Worldwide Energy Resources)<br/>"
        "• <b>Publisher & Host:</b> NASA Langley Research Center / Global Modeling and Assimilation Office (GMAO)<br/>"
        "• <b>Independence:</b> Satellite observations and assimilation physics (MERRA-2, GEOS-IT, CERES) completely physically independent of ground sensor hardware.<br/>"
        "• <b>Covariates Ingested:</b> Hourly 2m Temperature (T2M), Relative Humidity (RH2M), 10m Wind Speed (WS10M), Wind Direction (WD10M), "
        "Surface Pressure (PS), Precipitation (PRECTOT), and Dew Point (T2MDEW). Latency: 2–3 days.<br/>"
        "• <b>Licensing & Access:</b> Open Access / CC BY 4.0. No restrictions on scientific modeling and decision-support deployment.<br/>"
        "• <b>Volume:</b> 6 localized JSON payloads representing 26,304 hourly atmospheric measurements per city (2022–2024).",
        bullet_style
    ))

    # Resource 3 Box
    story.append(Paragraph("Source 3 (Real-Time Ingestion & Out-of-Network Generalization): OpenAQ v3 API", h2_style))
    story.append(Paragraph(
        "• <b>Aggregator:</b> OpenAQ Foundation (openaq.org), Global Environmental Data Commons.<br/>"
        "• <b>Deployment Role:</b> Ingests live hourly observations from independent ground sensors (e.g., Hawanama network at Dawlance Karachi, "
        "US Consulate reference monitors) to drive hourly Prefect orchestration flows and evaluate out-of-network model generalization.<br/>"
        "• <b>License:</b> CC BY 4.0 / Public Domain open sensor networks.",
        bullet_style
    ))

    # Resource 4 Box
    story.append(Paragraph("Source 4 (Statutory & Regulatory Standards): Pak-EPA NEQS & WHO 2021", h2_style))
    story.append(Paragraph(
        "• <b>Pakistan Statutory Standard:</b> Pakistan Environmental Protection Agency National Environmental Quality Standards (Pak-EPA NEQS 2010), "
        "statutory 24-hour PM2.5 limit of <b>35.0 µg/m³</b>.<br/>"
        "• <b>Global Health Guideline:</b> World Health Organization 2021 Air Quality Guidelines, 24-hour PM2.5 threshold of <b>15.0 µg/m³</b>.<br/>"
        "• <b>Role in Pipeline:</b> Injected into the Insight Agent (RAG) knowledge engine to guarantee that all alert classifications, action recommendations, "
        "and school advisories are legally and scientifically grounded.",
        bullet_style
    ))

    story.append(PageBreak())

    # Section 3: Data Provenance & Manifest Table
    story.append(Paragraph("3. Manifest Register & Cryptographic Hash Verification", h1_style))
    story.append(Paragraph(
        "In conformance with HackInsight Chapter 4, every raw and processed artifact ingested into the warehouse is recorded in "
        "<code>data/manifests/manifest.csv</code> with UTC fetch timestamp, file size, license terms, and SHA-256 hash:",
        body_style
    ))

    headers = [
        Paragraph("Source ID", table_header_style),
        Paragraph("Resource & Publisher", table_header_style),
        Paragraph("Format", table_header_style),
        Paragraph("Size", table_header_style),
        Paragraph("SHA-256 Checksum (Hex)", table_header_style),
        Paragraph("License", table_header_style)
    ]
    
    rows = [
        headers,
        [
            Paragraph("SRC-PAQI-PM25", table_cell_bold),
            Paragraph("PAQI Network / NASA ASDC DAAC", table_cell_style),
            Paragraph("ICARTT", table_cell_style),
            Paragraph("181.9 MB", table_cell_style),
            Paragraph("892dc29a5d38af1e9f7a8999...fe13", table_cell_style),
            Paragraph("NASA ASDC Open", table_cell_style)
        ],
        [
            Paragraph("SRC-POWER-LHE-22", table_cell_bold),
            Paragraph("NASA POWER Lahore 2022 (Hourly Met)", table_cell_style),
            Paragraph("JSON", table_cell_style),
            Paragraph("1.13 MB", table_cell_style),
            Paragraph("c44418088e3d2549014b7b8d...0c98", table_cell_style),
            Paragraph("CC BY 4.0", table_cell_style)
        ],
        [
            Paragraph("SRC-POWER-LHE-23", table_cell_bold),
            Paragraph("NASA POWER Lahore 2023 (Hourly Met)", table_cell_style),
            Paragraph("JSON", table_cell_style),
            Paragraph("1.13 MB", table_cell_style),
            Paragraph("ec27c89ad6b6210a797f2480...3e42", table_cell_style),
            Paragraph("CC BY 4.0", table_cell_style)
        ],
        [
            Paragraph("SRC-POWER-LHE-24", table_cell_bold),
            Paragraph("NASA POWER Lahore 2024 (Hourly Met)", table_cell_style),
            Paragraph("JSON", table_cell_style),
            Paragraph("1.13 MB", table_cell_style),
            Paragraph("859c956e5b5fa7bfb560d8ec...4d59", table_cell_style),
            Paragraph("CC BY 4.0", table_cell_style)
        ],
        [
            Paragraph("SRC-POWER-KHI-22", table_cell_bold),
            Paragraph("NASA POWER Karachi 2022 (Hourly Met)", table_cell_style),
            Paragraph("JSON", table_cell_style),
            Paragraph("1.14 MB", table_cell_style),
            Paragraph("56023a417c3e956f59300efe...dad9", table_cell_style),
            Paragraph("CC BY 4.0", table_cell_style)
        ],
        [
            Paragraph("SRC-POWER-KHI-23", table_cell_bold),
            Paragraph("NASA POWER Karachi 2023 (Hourly Met)", table_cell_style),
            Paragraph("JSON", table_cell_style),
            Paragraph("1.14 MB", table_cell_style),
            Paragraph("cbf5e4a807ccfd279c02d187...6c93", table_cell_style),
            Paragraph("CC BY 4.0", table_cell_style)
        ],
        [
            Paragraph("SRC-POWER-KHI-24", table_cell_bold),
            Paragraph("NASA POWER Karachi 2024 (Hourly Met)", table_cell_style),
            Paragraph("JSON", table_cell_style),
            Paragraph("1.14 MB", table_cell_style),
            Paragraph("93443e22f9807ff8cfa6fec9...91df5", table_cell_style),
            Paragraph("CC BY 4.0", table_cell_style)
        ],
    ]

    manifest_table = Table(rows, colWidths=[80, 125, 45, 45, 135, 74])
    manifest_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), navy),
        ('BOX', (0, 0), (-1, -1), 0.5, navy),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, gray_bg]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(manifest_table)
    story.append(Spacer(1, 10))

    # Section 4: Three-Tier Warehouse Architecture
    story.append(Paragraph("4. Three-Tier Warehouse Architecture & Pipeline Flow", h1_style))
    story.append(Paragraph(
        "Our data infrastructure is structured into three clean, audit-traced storage layers:",
        body_style
    ))
    story.append(Paragraph(
        "1. <b>Raw Immutable Layer (<code>data/raw/</code>):</b> Read-only ICARTT and JSON files with strict hash locks. Never modified in-place.<br/>"
        "2. <b>Cleaned Interim Layer (<code>data/interim/</code>):</b> Station-parsed tabular frames with standardized UTC ISO 8601 timestamps, "
        "explicit units (µg/m³, °C, %, m/s, hPa), -9999 nodata masking, and string whitespace normalisation.<br/>"
        "3. <b>Processed Gold Warehouse (<code>data/processed/gold_pm25_forecasting.parquet</code> & <code>data/warehouse.duckdb</code>):</b> "
        "Strict 16-column analytical table containing 176,392 hourly records across 30 verified stations. Features stable cryptographic row IDs, "
        "causal hourly forward-fill (max 2h cap), zero future leakage, and time-partitioned indexing.",
        bullet_style
    ))
    story.append(Spacer(1, 6))

    # Section 5: Data Quality Agent & Scientific Governance
    story.append(Paragraph("5. Autonomous Quality Governance: DataQualityAgent", h1_style))
    story.append(Paragraph(
        "Unlike brittle manual data cleaning, data ingestion is governed by an autonomous <b>Data Quality Agent</b> executing deterministic policies:",
        body_style
    ))
    story.append(Paragraph(
        "• <b>FIX (Safe Deterministic Repair):</b> Strips whitespace, standardizes station naming, formats ISO timestamps. Logged as <code>FIX</code>.<br/>"
        "• <b>FILL (Controlled Bound Imputation):</b> Forward-fills short meteorological gaps strictly up to 2 hours ($gap \le 2h$). All imputed cells are marked. Target PM2.5 is <b>never</b> imputed to prevent ground truth contamination.<br/>"
        "• <b>FLAG (Anomaly Isolation without Deletion):</b> Detects sensor flatline episodes ($\ge 6h$ identical float values), temporal gaps ($>1h$), "
        "and physical range extremes ($>800 µg/m³$). Flagged records are preserved in audit logs (<code>reports/data_quality/quality_log.csv</code>) "
        "with complete rationale for expert inspection.",
        bullet_style
    ))
    story.append(Spacer(1, 6))

    # Section 6: Summary & Sign-off
    story.append(Paragraph("6. Compliance & Track Selection Sign-Off", h1_style))
    story.append(Paragraph(
        "The datasets proposed and utilized in HackInsight provide deep historical volume (176k+ rows, 8+ years of telemetry), "
        "provable provenance from world-class space agencies (NASA ASDC DAAC and NASA POWER), independence between target and covariates, "
        "and legal compliance for public and scientific decision-support. All assets are fully reproducible via <code>make data</code>.",
        body_style
    ))
    story.append(Spacer(1, 8))

    signoff_table = Table([
        [
            Paragraph("<b>Submitted By:</b> Team DataMinors", meta_style),
            Paragraph("<b>Track Verified:</b> Air Quality (Pakistan)", meta_style)
        ],
        [
            Paragraph("<b>Date:</b> October 21, 2026", meta_style),
            Paragraph("<b>Integrity Status:</b> 100% Verified (SHA-256 Validated)", meta_style)
        ]
    ], colWidths=[270, 234])
    signoff_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('BACKGROUND', (0, 0), (-1, -1), gray_bg),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(signoff_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated {output_path} successfully ({output_path.stat().st_size} bytes).")


if __name__ == "__main__":
    out_file = Path("c:/HIS/datasetproposal.pdf")
    build_dataset_proposal_pdf(out_file)
