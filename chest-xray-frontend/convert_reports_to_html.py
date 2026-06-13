import os
import pandas as pd
import datetime

def generate_html_and_summary():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_xlsx = os.path.join(base_dir, "Test_Report.xlsx")
    backend_xlsx = os.path.join(base_dir, "Backend_Test_Report.xlsx")
    output_html = os.path.join(base_dir, "Test_Report.html")

    # Read Frontend Report
    frontend_df = pd.DataFrame()
    if os.path.exists(frontend_xlsx):
        try:
            frontend_df = pd.read_excel(frontend_xlsx)
        except Exception as e:
            print(f"Error reading frontend report: {e}")
    
    # Read Backend Report
    backend_df = pd.DataFrame()
    if os.path.exists(backend_xlsx):
        try:
            backend_df = pd.read_excel(backend_xlsx)
        except Exception as e:
            print(f"Error reading backend report: {e}")

    # Metrics calculation
    total_frontend = len(frontend_df)
    total_backend = len(backend_df)
    total_tests = total_frontend + total_backend

    passed_frontend = len(frontend_df[frontend_df['Status'] == 'PASS']) if total_frontend > 0 else 0
    passed_backend = len(backend_df[backend_df['Status'] == 'PASS']) if total_backend > 0 else 0
    total_passed = passed_frontend + passed_backend
    total_failed = total_tests - total_passed
    pass_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0

    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Generate Markdown for GitHub Job Summary
    github_summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if github_summary_path:
        try:
            with open(github_summary_path, "w", encoding="utf-8") as f:
                f.write(f"# 🧪 Chest X-Ray AI Analysis - Test Execution Report\n\n")
                f.write(f"### 📊 Execution Summary\n")
                f.write(f"- **Timestamp:** `{current_time}`\n")
                f.write(f"- **Total Tests Executed:** `{total_tests}`\n")
                f.write(f"- **Passed:** `{total_passed}` ✅\n")
                f.write(f"- **Failed:** `{total_failed}` ❌\n")
                f.write(f"- **Pass Rate:** `{pass_rate:.1f}%` 📈\n\n")

                if total_frontend > 0:
                    f.write(f"## 🖥️ Frontend E2E Tests (Selenium)\n")
                    f.write(f"| Test Case ID | Module/Screen | Description | Expected Result | Status | Error Details |\n")
                    f.write(f"|---|---|---|---|---|---|\n")
                    for _, row in frontend_df.iterrows():
                        status_emoji = "✅ PASS" if row['Status'] == 'PASS' else "❌ FAIL"
                        steps_br = str(row['Steps']).replace('\n', '<br>')
                        desc_br = str(row['Description']).replace('\n', '<br>')
                        expected_br = str(row['Expected Result']).replace('\n', '<br>')
                        f.write(f"| **{row['Test Case ID']}** | {row['Module/Screen']} | {desc_br} | {expected_br} | **{status_emoji}** | {row['Error Details']} |\n")
                    f.write(f"\n")

                if total_backend > 0:
                    f.write(f"## ⚙️ Backend API Tests\n")
                    f.write(f"| Test Case ID | Module | Description | Status | Error Details |\n")
                    f.write(f"|---|---|---|---|---|\n")
                    for _, row in backend_df.iterrows():
                        status_emoji = "✅ PASS" if row['Status'] == 'PASS' else "❌ FAIL"
                        desc_br = str(row['Description']).replace('\n', '<br>')
                        f.write(f"| **{row['Test Case ID']}** | {row['Module']} | {desc_br} | **{status_emoji}** | {row['Error Details']} |\n")
            print("Successfully wrote job summary to GITHUB_STEP_SUMMARY.")
        except Exception as e:
            print(f"Error writing to GITHUB_STEP_SUMMARY: {e}")

    # 2. Generate Beautiful HTML Page
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chest X-Ray AI - E2E Automation Test Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-color: #0b0f19;
            --card-bg: #151c2c;
            --border-color: #243049;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent-color: #2563eb;
            --accent-gradient: linear-gradient(135deg, #3b82f6, #1d4ed8);
            --pass-color: #10b981;
            --pass-bg: rgba(16, 185, 129, 0.15);
            --fail-color: #ef4444;
            --fail-bg: rgba(239, 68, 68, 0.15);
            --font-display: 'Outfit', sans-serif;
            --font-sans: 'Plus Jakarta Sans', sans-serif;
        }}

        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            background-color: var(--bg-color);
            color: var(--text-primary);
            font-family: var(--font-sans);
            padding: 2rem;
            min-height: 100vh;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}

        header {{
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }}

        .header-title h1 {{
            font-family: var(--font-display);
            font-size: 2.2rem;
            font-weight: 800;
            background: linear-gradient(to right, #60a5fa, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.25rem;
        }}

        .header-title p {{
            color: var(--text-secondary);
            font-size: 0.95rem;
        }}

        .timestamp-badge {{
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-size: 0.85rem;
            color: var(--text-secondary);
        }}

        /* Metrics grid */
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }}

        .metric-card {{
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 1rem;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s ease, border-color 0.2s ease;
        }}

        .metric-card:hover {{
            transform: translateY(-2px);
            border-color: #3b82f688;
        }}

        .metric-card::after {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--accent-gradient);
        }}

        .metric-card.pass::after {{
            background: var(--pass-color);
        }}

        .metric-card.fail::after {{
            background: var(--fail-color);
        }}

        .metric-label {{
            color: var(--text-secondary);
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }}

        .metric-value {{
            font-family: var(--font-display);
            font-size: 2.2rem;
            font-weight: 800;
        }}

        /* Tabs navigation */
        .tabs-header {{
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.75rem;
        }}

        .tab-btn {{
            background: none;
            border: none;
            color: var(--text-secondary);
            font-family: var(--font-display);
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            padding: 0.5rem 1rem;
            position: relative;
            transition: color 0.2s ease;
        }}

        .tab-btn:hover {{
            color: var(--text-primary);
        }}

        .tab-btn.active {{
            color: var(--text-primary);
        }}

        .tab-btn.active::after {{
            content: '';
            position: absolute;
            bottom: -0.85rem;
            left: 0;
            width: 100%;
            height: 3px;
            background: var(--accent-gradient);
            border-radius: 9999px;
        }}

        .search-container {{
            margin-bottom: 1.5rem;
            display: flex;
            gap: 1rem;
            align-items: center;
        }}

        .search-input {{
            flex: 1;
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 0.75rem 1.2rem;
            border-radius: 0.75rem;
            font-family: var(--font-sans);
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.2s ease;
        }}

        .search-input:focus {{
            border-color: #3b82f6;
        }}

        /* Tables container */
        .tab-content {{
            display: none;
        }}

        .tab-content.active {{
            display: block;
        }}

        .table-wrapper {{
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 1rem;
            overflow-x: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.9rem;
        }}

        th {{
            background-color: rgba(21, 28, 44, 0.8);
            font-family: var(--font-display);
            font-weight: 600;
            color: var(--text-primary);
            padding: 1rem 1.25rem;
            border-bottom: 2px solid var(--border-color);
        }}

        td {{
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--border-color);
            vertical-align: middle;
            color: var(--text-secondary);
        }}

        tr:last-child td {{
            border-bottom: none;
        }}

        tr:hover td {{
            background-color: rgba(30, 41, 59, 0.4);
            color: var(--text-primary);
        }}

        .tc-id {{
            font-family: var(--font-display);
            font-weight: 700;
            color: var(--text-primary);
        }}

        .badge {{
            display: inline-block;
            padding: 0.35rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: center;
        }}

        .badge-pass {{
            background-color: var(--pass-bg);
            color: var(--pass-color);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }}

        .badge-fail {{
            background-color: var(--fail-bg);
            color: var(--fail-color);
            border: 1px solid rgba(239, 68, 68, 0.3);
        }}

        .steps-col {{
            white-space: pre-line;
            max-width: 400px;
        }}

        .desc-col, .expected-col {{
            max-width: 300px;
        }}

        .error-col {{
            max-width: 250px;
            font-family: monospace;
            font-size: 0.8rem;
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="header-title">
                <h1>Chest X-Ray AI Analysis</h1>
                <p>E2E Automation & API Test Execution Dashboard</p>
            </div>
            <div class="timestamp-badge">
                Generated: {current_time}
            </div>
        </header>

        <section class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Total Executed</div>
                <div class="metric-value">{total_tests}</div>
            </div>
            <div class="metric-card pass">
                <div class="metric-label">Passed</div>
                <div class="metric-value" style="color: var(--pass-color);">{total_passed}</div>
            </div>
            <div class="metric-card fail">
                <div class="metric-label">Failed</div>
                <div class="metric-value" style="color: var(--fail-color);">{total_failed}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Pass Rate</div>
                <div class="metric-value" style="background: linear-gradient(to right, #34d399, #059669); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">{pass_rate:.1f}%</div>
            </div>
        </section>

        <div class="tabs-header">
            <button class="tab-btn active" onclick="switchTab('frontend')">Frontend E2E Tests ({total_frontend})</button>
            <button class="tab-btn" onclick="switchTab('backend')">Backend API Tests ({total_backend})</button>
        </div>

        <div class="search-container">
            <input type="text" id="searchInput" class="search-input" placeholder="Search test cases by ID, Module, Description, Status..." onkeyup="filterTable()">
        </div>

        <!-- Frontend Table -->
        <div id="frontend" class="tab-content active">
            <div class="table-wrapper">
                <table id="frontendTable">
                    <thead>
                        <tr>
                            <th>Test ID</th>
                            <th>Module/Screen</th>
                            <th>Description</th>
                            <th>Steps</th>
                            <th>Expected Result</th>
                            <th>Status</th>
                            <th>Error Details</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>"""
    
    if total_frontend > 0:
        for _, row in frontend_df.iterrows():
            badge_class = "badge-pass" if row['Status'] == 'PASS' else "badge-fail"
            steps = str(row['Steps']).replace('\n', '<br>')
            desc = str(row['Description']).replace('\n', '<br>')
            expected = str(row['Expected Result']).replace('\n', '<br>')
            html_content += f"""
                        <tr>
                            <td class="tc-id">{row['Test Case ID']}</td>
                            <td>{row['Module/Screen']}</td>
                            <td class="desc-col">{desc}</td>
                            <td class="steps-col">{steps}</td>
                            <td class="expected-col">{expected}</td>
                            <td><span class="badge {badge_class}">{row['Status']}</span></td>
                            <td class="error-col">{row['Error Details']}</td>
                            <td style="white-space: nowrap;">{row['Timestamp']}</td>
                        </tr>"""
    else:
        html_content += """
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 2rem;">No Frontend test cases found.</td>
                        </tr>"""

    html_content += """
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Backend Table -->
        <div id="backend" class="tab-content">
            <div class="table-wrapper">
                <table id="backendTable">
                    <thead>
                        <tr>
                            <th>Test ID</th>
                            <th>Module</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Error Details</th>
                        </tr>
                    </thead>
                    <tbody>"""

    if total_backend > 0:
        for _, row in backend_df.iterrows():
            badge_class = "badge-pass" if row['Status'] == 'PASS' else "badge-fail"
            desc = str(row['Description']).replace('\n', '<br>')
            html_content += f"""
                        <tr>
                            <td class="tc-id">{row['Test Case ID']}</td>
                            <td>{row['Module']}</td>
                            <td class="desc-col">{desc}</td>
                            <td><span class="badge {badge_class}">{row['Status']}</span></td>
                            <td class="error-col">{row['Error Details']}</td>
                        </tr>"""
    else:
        html_content += """
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 2rem;">No Backend test cases found.</td>
                        </tr>"""

    html_content += """
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        let currentTab = 'frontend';

        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            
            document.getElementById(tabId).classList.add('active');
            
            // Set button active
            const buttons = document.querySelectorAll('.tab-btn');
            if (tabId === 'frontend') {
                buttons[0].classList.add('active');
            } else {
                buttons[1].classList.add('active');
            }
            
            currentTab = tabId;
            filterTable(); // keep search applied when switching tabs
        }

        function filterTable() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            const tableId = currentTab + 'Table';
            const table = document.getElementById(tableId);
            const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');

            for (let i = 0; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName('td');
                if (cells.length <= 1) continue; // Skip empty rows
                
                let match = false;
                for (let j = 0; j < cells.length; j++) {
                    if (cells[j].innerText.toLowerCase().includes(query)) {
                        match = true;
                        break;
                    }
                }
                rows[i].style.display = match ? '' : 'none';
            }
        }
    </script>
</body>
</html>"""

    with open(output_html, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Successfully generated HTML Dashboard at: {output_html}")

if __name__ == "__main__":
    generate_html_and_summary()
