
import fs from 'fs';
import path from 'path';
import BatchReportViewer from '@/components/BatchReportViewer';

export const dynamic = 'force-dynamic'; // Since it reads a local file that might change

export default function BatchReportPage() {
  const filePath = path.join(process.cwd(), 'ai_batch_output.json');
  
  if (!fs.existsSync(filePath)) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
        <p className="text-slate-600">The file <code>ai_batch_output.json</code> was not found in the project root.</p>
        <p className="text-slate-500 mt-2">Run the batch AI script first.</p>
      </div>
    );
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const students = JSON.parse(fileContent);

  return <BatchReportViewer students={students} />;
}
