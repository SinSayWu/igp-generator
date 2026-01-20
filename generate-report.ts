
import fs from 'fs';
import path from 'path';

// Define types based on our output structure
interface StudentOutput {
  name: string;
  id: string;
  courseGen: {
    schedule: {
      schedule: {
        [grade: string]: string[];
      };
    };
    analysis: string;
  };
  clubRecs: {
    thought_process: string;
    recommendations: Array<{
      id: string;
      name: string;
      justification: string;
      actionPlan: string;
    }>;
  };
  oppRecs: {
    recommendations: Array<{
      id: string;
      title: string;
      organization: string;
      matchReason: string;
      actionPlan: string;
      generatedTags: string[];
    }>;
  };
  pathSummary: string; // This might be a string or object depending on exact output, adapting to string based on log
}

const INPUT_FILE = 'ai_batch_output.json';
const OUTPUT_FILE = 'report.html';

function generateHTML(students: StudentOutput[]) {
  const sidebarLinks = students.map((s, index) => 
    `<li onclick="showStudent(${index})" class="student-link" id="link-${index}">${s.name}</li>`
  ).join('');

  const studentSections = students.map((s, index) => {
    // Format Grade Schedules
    const scheduleHtml = Object.entries(s.courseGen?.schedule?.schedule || {}).map(([grade, courses]) => `
      <div class="grade-column">
        <h4>Grade ${grade}</h4>
        <ul>
          ${(courses as string[]).map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    // Format Club Recs
    const clubsHtml = s.clubRecs?.recommendations?.map(c => `
      <div class="card">
        <div class="card-header">${c.name}</div>
        <div class="card-body">
          <p><strong>Why:</strong> ${c.justification}</p>
          <p class="action-plan"><strong>Action:</strong> ${c.actionPlan}</p>
        </div>
      </div>
    `).join('') || '<p>No club recommendations found.</p>';

    // Format Opp Recs
    const oppsHtml = s.oppRecs?.recommendations?.map(o => `
      <div class="card">
        <div class="card-header">${o.title} <span class="org">@ ${o.organization}</span></div>
        <div class="card-body">
          <div class="tags">${o.generatedTags?.map(t => `<span class="tag">${t}</span>`).join('') || ''}</div>
          <p><strong>Match:</strong> ${o.matchReason}</p>
          <p class="action-plan"><strong>Action:</strong> ${o.actionPlan}</p>
        </div>
      </div>
    `).join('') || '<p>No opportunity recommendations found.</p>';

    // Format Analysis (Markdown-like to HTML simple conversion)
    const analysisHtml = (s.courseGen?.analysis || '').replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Path Summary
    const pathHtml = (typeof s.pathSummary === 'string' ? s.pathSummary : JSON.stringify(s.pathSummary)).replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return `
      <div id="student-${index}" class="student-content" style="display: ${index === 0 ? 'block' : 'none'}">
        <header class="content-header">
          <h2>${s.name} <span class="student-id">(${s.id})</span></h2>
        </header>

        <section class="section">
          <h3>🎓 Path Summary (College Plan)</h3>
          <div class="text-block">${pathHtml || 'No path summary generated.'}</div>
        </section>

        <section class="section">
          <h3>📅 4-Year Course Plan</h3>
          <div class="schedule-grid">
            ${scheduleHtml}
          </div>
          <details>
            <summary>View Generation Analysis</summary>
            <div class="text-block analysis-block">${analysisHtml}</div>
          </details>
        </section>

        <section class="section">
          <h3>♟️ Club Recommendations</h3>
          <div class="card-grid">
            ${clubsHtml}
          </div>
        </section>

        <section class="section">
          <h3>🚀 Opportunity Recommendations</h3>
          <div class="card-grid">
            ${oppsHtml}
          </div>
        </section>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Batch AI Report</title>
  <style>
    :root {
      --primary: #2563eb;
      --bg: #f8fafc;
      --sidebar-bg: #1e293b;
      --sidebar-text: #e2e8f0;
      --card-bg: #ffffff;
      --text: #334155;
      --border: #e2e8f0;
    }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      margin: 0;
      display: flex;
      height: 100vh;
      background: var(--bg);
      color: var(--text);
    }
    /* Sidebar */
    .sidebar {
      width: 250px;
      background: var(--sidebar-bg);
      color: var(--sidebar-text);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow-y: auto;
    }
    .sidebar-header {
      padding: 1.5rem;
      font-size: 1.2rem;
      font-weight: bold;
      border-bottom: 1px solid #334155;
    }
    .student-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .student-link {
      padding: 1rem 1.5rem;
      cursor: pointer;
      border-bottom: 1px solid #334155;
      transition: background 0.2s;
    }
    .student-link:hover, .student-link.active {
      background: #334155;
      color: white;
    }
    
    /* Main Content */
    .main {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }
    .content-header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
    }
    .student-id {
      font-size: 0.9rem;
      color: #94a3b8;
      font-weight: normal;
    }
    
    /* Sections */
    .section {
      margin-bottom: 3rem;
    }
    h3 {
      color: var(--primary);
      border-left: 4px solid var(--primary);
      padding-left: 0.5rem;
      margin-bottom: 1rem;
    }

    /* Cards */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .card-header {
      background: #f1f5f9;
      padding: 0.75rem 1rem;
      font-weight: 600;
      border-bottom: 1px solid var(--border);
    }
    .card-body {
      padding: 1rem;
    }
    .org {
      font-weight: normal;
      color: #64748b;
      font-size: 0.9em;
    }
    .tags {
      margin-bottom: 0.5rem;
    }
    .tag {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 99px;
      margin-right: 0.25rem;
    }
    .action-plan {
      margin-top: 0.5rem;
      color: #059669;
      font-size: 0.9rem;
    }

    /* Schedule Grid */
    .schedule-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .grade-column {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
    }
    .grade-column h4 {
      margin-top: 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.5rem;
      text-align: center;
    }
    .grade-column ul {
      padding-left: 1.2rem;
      font-size: 0.9rem;
    }

    /* Text Blocks */
    .text-block {
      background: var(--card-bg);
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      line-height: 1.6;
    }
    .analysis-block {
      font-family: monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
      background: #f8f9fa;
      max-height: 300px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <nav class="sidebar">
    <div class="sidebar-header">
      Batch AI Results
    </div>
    <ul class="student-list">
      ${sidebarLinks}
    </ul>
  </nav>
  <main class="main">
    ${studentSections}
  </main>

  <script>
    function showStudent(index) {
      // Hide all contents
      document.querySelectorAll('.student-content').forEach(el => el.style.display = 'none');
      // Show selected content
      document.getElementById('student-' + index).style.display = 'block';
      
      // Update active link
      document.querySelectorAll('.student-link').forEach(el => el.classList.remove('active'));
      document.getElementById('link-' + index).classList.add('active');
    }

    // Initialize first student as active
    document.addEventListener('DOMContentLoaded', () => {
      showStudent(0);
    });
  </script>
</body>
</html>
  `;
}

async function main() {
  try {
    const data = fs.readFileSync(INPUT_FILE, 'utf-8');
    const students: StudentOutput[] = JSON.parse(data);
    
    console.log(`Found ${students.length} students in "${INPUT_FILE}". generating report...`);
    
    const html = generateHTML(students);
    fs.writeFileSync(OUTPUT_FILE, html);
    
    console.log(`Successfully generated report at "${path.resolve(OUTPUT_FILE)}"`);
  } catch (error) {
    console.error("Error generating report:", error);
  }
}

main();
