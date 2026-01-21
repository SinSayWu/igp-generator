
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Merging freshmen courses into ai_batch_output.json...");

    const mainOutputPath = path.join(process.cwd(), "ai_batch_output.json");
    const coursesOutputPath = path.join(process.cwd(), "freshmen_courses_output.json");

    if (!fs.existsSync(mainOutputPath)) {
        console.error("ai_batch_output.json not found!");
        process.exit(1);
    }
    if (!fs.existsSync(coursesOutputPath)) {
        console.error("freshmen_courses_output.json not found!");
        process.exit(1);
    }

    const mainData = JSON.parse(fs.readFileSync(mainOutputPath, "utf-8"));
    const coursesData = JSON.parse(fs.readFileSync(coursesOutputPath, "utf-8"));

    console.log(`Loaded ${mainData.length} students from main file.`);
    console.log(`Loaded ${coursesData.length} students from courses file.`);

    let updatedCount = 0;

    for (const courseEntry of coursesData) {
        const studentId = courseEntry.id;
        const mainEntryIndex = mainData.findIndex((s: any) => s.id === studentId);

        if (mainEntryIndex !== -1) {
            // Update ONLY the courseGen field
            // We assume courseEntry.courseGen is valid and matches the desired structure
            mainData[mainEntryIndex].courseGen = courseEntry.courseGen;
            console.log(`Updated courses for ${mainData[mainEntryIndex].name} (${studentId})`);
            updatedCount++;
        } else {
            console.warn(`Warning: Student ${studentId} (${courseEntry.name}) not found in main output file.`);
        }
    }

    fs.writeFileSync(mainOutputPath, JSON.stringify(mainData, null, 2));
    console.log(`\nMerge complete. Updated ${updatedCount} students in ai_batch_output.json.`);
}

main().catch(console.error);
