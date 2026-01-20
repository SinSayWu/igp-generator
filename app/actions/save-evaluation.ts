'use server';

import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'ai_batch_output.json');

export type EvaluatedCriteria = {
  metGradReqs: boolean;
  interestsAligned: boolean;
  rigorPreserved: boolean;
  scheduleFeasible: boolean;
  clubAlignment: boolean;
};

export async function saveEvaluation(studentId: string, evaluation: EvaluatedCriteria) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('Batch output file not found');
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const students = JSON.parse(content);

    const studentIndex = students.findIndex((s: any) => s.id === studentId);
    if (studentIndex === -1) {
      throw new Error('Student not found');
    }

    // Update the student record with the evaluation
    students[studentIndex].manualEvaluation = evaluation;

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(students, null, 2));

    return { success: true };
  } catch (error: any) {
    console.error('Failed to save evaluation:', error);
    return { success: false, error: error.message };
  }
}
