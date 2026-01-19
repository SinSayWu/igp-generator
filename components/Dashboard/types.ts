// Shared types for Dashboard components

export type StudentCourseData = {
    id: string;
    courseId: string;
    grade: string | null;
    status: string;
    gradeLevel: number | null;
    confidenceLevel: string | null;
    stressLevel: string | null;
    course: {
        id: string;
        name: string;
        department: string;
    };
};

export type CourseCatalogItem = {
    id: string;
    name: string;
    department: string;
    credits: number | null;
    level: string | null;
    availableGrades: number[];
};

export type ClubData = {
    id: string;
    name: string;
    category: string;
    description: string | null;
    teacherLeader: string | null;
    studentLeaders: string | null;
};

export type SportData = {
    id: string;
    name: string;
    season: string;
};

export type CollegeData = {
    id: string;
    name: string;
    type: string;
    requirements: string[];
    suggestions: string[];
};
