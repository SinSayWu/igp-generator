// prisma/seed-data.ts
export const schoolPrograms = [
    {
        name: "JROTC (Air Force)",
        description: "Aerospace science and leadership education program.",
    },
    {
        name: "Fine Arts: Band",
        description: "Marching and Symphonic band pathway.",
    },
    {
        name: "Fine Arts: Orchestra",
        description: "String ensemble and music theory performance.",
    },
    {
        name: "Fine Arts: Visual Arts",
        description: "Drawing, painting, ceramics, and AP Studio Art.",
    },
    {
        name: "Physical Education / Weightlifting",
        description: "Advanced strength training and athletic conditioning.",
    },
    {
        name: "Health Science / Sports Med",
        description: "Pathway for nursing, sports medicine, and physical therapy.",
    },
    {
        name: "Engineering (PLTW)",
        description: "Project Lead The Way: Intro to Engineering Design and Principles.",
    },
    {
        name: "Agricultural Science",
        description: "Horticulture, animal science, and wildlife management.",
    },
    {
        name: "Business & Marketing",
        description: "Entrepreneurship, accounting, and marketing management.",
    },
    {
        name: "Computer Science",
        description: "Coding, cybersecurity, and software development track.",
    },
];

export const schoolClubs = [
    {
        club_id: "CLUB-SRV-INTERACT",
        name: "Interact Club",
        category: "Service",
        description:
            "A service organization sponsored by the Rotary Club. Members participate in community service projects such as food drives and the Clemson Christmas Parade.",
        teacher_leader: "Mr. Conrad, Mrs. Rushing",
        student_leaders: "Caton Tsao, Lilly Tidwell, Lizah Williams, Laurel Garst, Bailey Choi",
    },
    {
        club_id: "CLUB-ACAD-BETA",
        name: "Beta Club",
        category: "Academic / Honor Society",
        description:
            "National organization promoting the ideals of academic achievement, character, service, and leadership.",
        teacher_leader: "Mrs. Justus",
        student_leaders: "",
    },
    {
        club_id: "CLUB-ACAD-SNHS",
        name: "Science National Honor Society (SNHS)",
        category: "Academic / Honor Society",
        description:
            "Honor society for students excelling in science. Members participate in the regional science fair and research symposiums.",
        teacher_leader: "Mrs. Tidwell",
        student_leaders:
            "Kaya Gedikoglu, Davis Reeves, Harper Warwick, Julianna Tang, Tinisha Singh",
    },
    {
        club_id: "CLUB-ACAD-RESEARCH",
        name: "Research Club",
        category: "Academic / STEM",
        description:
            "A club dedicated to conducting and presenting original student research in preparation for competitions like ISEF.",
        teacher_leader: "Mrs. Tidwell",
        student_leaders: "Arjun Jain, Julianna Tang, Tinisha Singh",
    },
    {
        club_id: "CLUB-ACAD-TEAM",
        name: "Academic Team",
        category: "Academic",
        description:
            "A competitive team that tests knowledge across various subjects including history, science, literature, and math in a buzzer-style format.",
        teacher_leader: "Mr. Davidson",
        student_leaders: "Anna Davidson",
    },
    {
        club_id: "CLUB-LEAD-STUCO",
        name: "Student Council",
        category: "Leadership",
        description:
            "Student government body responsible for organizing school-wide events, spirit weeks, and representing student interests.",
        teacher_leader: "Mrs. Howard",
        student_leaders: "Mikaela Reed",
    },
    {
        club_id: "CLUB-LEAD-LINK",
        name: "Link Crew",
        category: "Leadership / Mentoring",
        description:
            "A high school transition program where upperclassmen mentor freshmen to ensure a smooth start to high school.",
        teacher_leader: "Mrs. Douglass",
        student_leaders: "",
    },
    {
        club_id: "CLUB-CTE-DECA",
        name: "DECA",
        category: "Career / Business",
        description:
            "Prepares emerging leaders and entrepreneurs in marketing, finance, hospitality, and management.",
        teacher_leader: "Mrs. Reeves, Coach Bill",
        student_leaders: "Arjun Jain",
    },
    {
        club_id: "CLUB-MIL-JROTC",
        name: "Air Force JROTC",
        category: "Leadership / Military",
        description:
            "Curriculum focuses on leadership, aerospace science, and community service through the cadet corps.",
        teacher_leader: "Mr. Hasse",
        student_leaders: "",
    },
    {
        club_id: "CLUB-ARTS-DRAMA",
        name: "Drama / Theatre",
        category: "Fine Arts",
        description:
            "Produces school plays and musicals, offering opportunities for both performance and technical stage crew.",
        teacher_leader: "Mrs. Elliot",
        student_leaders: "",
    },
    {
        club_id: "CLUB-CTE-HOSA",
        name: "HOSA",
        category: "Career / Medical",
        description:
            "Future Health Professionals organization focused on developing leadership and technical skills for healthcare careers.",
        teacher_leader: "Mr. Rivers",
        student_leaders: "Jordan McLane, Chloe Prosser",
    },
    {
        club_id: "CLUB-STEM-AI",
        name: "AI and Machine Learning Club",
        category: "Academic / STEM",
        description:
            "Explores the fundamentals of artificial intelligence, neural networks, and technology ethics.",
        teacher_leader: "Mr. Dennis",
        student_leaders: "Arjun Jain",
    },
    {
        club_id: "CLUB-STEM-MATH",
        name: "Math Club",
        category: "Academic / STEM",
        description:
            "A group for students who enjoy mathematical problem solving and preparing for regional competitions.",
        teacher_leader: "Mrs. Qualkinbush",
        student_leaders: "Yuhang Wu",
    },
    {
        club_id: "CLUB-STEM-GIRLS",
        name: "Girls in STEM Club",
        category: "Academic / STEM",
        description:
            "Empowers female-identifying students to explore careers and activities in science, technology, engineering, and mathematics.",
        teacher_leader: "Mrs. Tidwell",
        student_leaders: "Lilly Tidwell",
    },
    {
        club_id: "CLUB-INT-RISE",
        name: "RiSE Environmental Club",
        category: "Interest / Service",
        description:
            "Focuses on environmental sustainability, school recycling efforts, and promoting green initiatives.",
        teacher_leader: "Mrs. Tidwell",
        student_leaders: "Lilly Tidwell",
    },
    {
        club_id: "CLUB-INT-CLASH",
        name: "Clash Royale Club",
        category: "Interest / Gaming",
        description:
            "A social club centered around competitive and casual play of the mobile game Clash Royale.",
        teacher_leader: "Mrs. Douglass",
        student_leaders: "Asher Keyes, David Durham",
    },
    {
        club_id: "CLUB-INT-CUBING",
        name: "Cubing Club",
        category: "Interest",
        description:
            "Dedicated to the art of speed-solving Rubik's cubes and other twisty puzzles.",
        teacher_leader: "Mr. Dennis",
        student_leaders: "Yuhang Wu, Aiden Zhao",
    },
    {
        club_id: "CLUB-INT-ESPORTS",
        name: "E-Sports Club",
        category: "Interest / Gaming",
        description:
            "Competitive gaming organization where students compete in various titles against other schools.",
        teacher_leader: "Mr. Dennis",
        student_leaders: "Matthew Scheffer",
    },
    {
        club_id: "CLUB-STEM-CODING",
        name: "Coding Club",
        category: "Academic / STEM",
        description:
            "A collaborative environment for students to learn programming languages and work on software projects.",
        teacher_leader: "Mr. Dennis",
        student_leaders: "JP MacArthur",
    },
    {
        club_id: "CLUB-INT-CHESS",
        name: "Chess Club",
        category: "Interest",
        description:
            "A place for players of all skill levels to play, study strategies, and compete in tournaments. A very successful team that has competed at state and had a 14-year winstreak.",
        teacher_leader: "Mrs. Elliot",
        student_leaders: "Caton Tsao",
    },
    {
        club_id: "CLUB-INT-TABLETENNIS",
        name: "Table Tennis Club",
        category: "Interest / Athletics",
        description:
            "Provides students a space to practice and compete in table tennis in a fun, high-energy environment.",
        teacher_leader: "Mr. Conrad",
        student_leaders: "Bobby Howell, Ryatt Adams",
    },
    {
        club_id: "CLUB-INT-BADMINTON",
        name: "Badminton Club",
        category: "Interest / Athletics",
        description:
            "A recreational club where students can learn the fundamentals of badminton and participate in matches.",
        teacher_leader: "Mrs. Dover",
        student_leaders: "",
    },
    {
        club_id: "CLUB-INT-PHOTO",
        name: "Photography Club",
        category: "Interest / Arts",
        description:
            "Explores the artistic and technical sides of photography, including composition and digital editing.",
        teacher_leader: "Mrs. Oropesa",
        student_leaders: "Ryan Chen",
    },
    {
        club_id: "CLUB-ACAD-DEBATE",
        name: "Speech and Debate Club",
        category: "Academic / Leadership",
        description:
            "Develops public speaking and critical thinking skills through structured debate competitions.",
        teacher_leader: "Mrs. Cory",
        student_leaders: "Agastya Sharma",
    },
    {
        club_id: "CLUB-ACAD-MUN",
        name: "Model UN",
        category: "Academic / Leadership",
        description:
            "Simulates United Nations conferences, allowing students to solve global issues through diplomacy.",
        teacher_leader: "Coach Bill",
        student_leaders: "Julianna Tang",
    },
    {
        club_id: "CLUB-ACAD-MOCKTRIAL",
        name: "Mock Trial",
        category: "Academic / Law",
        description:
            "Students act as attorneys and witnesses in a simulated courtroom environment competing against other schools.",
        teacher_leader: "Mrs. Perry",
        student_leaders: "Sabrina Lin, Jane Whitten",
    },
    {
        club_id: "CLUB-ACAD-PSYCH",
        name: "Psychology Club",
        category: "Academic",
        description:
            "Explores human behavior, mental processes, and famous studies through discussions and activities.",
        teacher_leader: "Coach Bill",
        student_leaders: "Ruya Geredeli, Helena Billinis",
    },
    {
        club_id: "CLUB-INT-BOOK2",
        name: "Book Club (Douglass)",
        category: "Interest",
        description:
            "A social reading club that meets to discuss selected literature and share a love for reading.",
        teacher_leader: "Mrs. Douglass",
        student_leaders: "Sarah Smith, Keira Kerscher, Charlie Perry",
    },
    {
        club_id: "CLUB-INT-F1",
        name: "F-1 Club",
        category: "Interest / STEM",
        description:
            "Dedicated to the fans of Formula 1 racing, discussing race results and engineering.",
        teacher_leader: "Mr. Guerrero",
        student_leaders: "",
    },
    {
        club_id: "CLUB-INT-FCA",
        name: "Fellowship of Christian Athletes (FCA)",
        category: "Interest / Faith",
        description:
            "A student-led group that provides fellowship and encouragement through a shared interest in athletics.",
        teacher_leader: "Coach Ellison",
        student_leaders: "Vannessa Miller, Preston Falkner",
    },
    {
        club_id: "CLUB-INT-RPG",
        name: "RPG Club",
        category: "Interest / Gaming",
        description:
            "A club for tabletop role-playing games like Dungeons & Dragons, focusing on storytelling, teamwork, and creative strategy.",
        teacher_leader: "Mr. Picklesheimer",
        student_leaders: "Matthew Scheffer",
    },
    {
        club_id: "CLUB-INT-YCI",
        name: "Youth Commission International (YCI)",
        category: "Interest / Faith",
        description:
            "A student-led Christian organization focused on providing a space for students to meet, pray, and discuss faith-based topics.",
        teacher_leader: "N/A",
        student_leaders: "Vannessa Miller, Preston Falkner, Keira Kerscher",
    },
    {
        club_id: "CLUB-ARTS-MANESTAGE",
        name: "Manestage Players",
        category: "Fine Arts",
        description:
            "A student theatre group dedicated to performing and promoting the dramatic arts within the school community.",
        teacher_leader: "Mrs. Elliot",
        student_leaders: "",
    },
    {
        club_id: "CLUB-ACAD-ITS",
        name: "International Thespian Society",
        category: "Academic / Honor Society",
        description:
            "An honor society for high school theatre students that recognizes excellence in dramatic arts and technical theatre.",
        teacher_leader: "Mrs. Elliot",
        student_leaders: "",
    },
    {
        club_id: "CLUB-INT-GARDEN",
        name: "Gardening Club",
        category: "Interest",
        description:
            "Focuses on cultivating school gardens, learning about plant biology, and promoting sustainable agriculture practices.",
        teacher_leader: "",
        student_leaders: "Dawson Blair Crum",
    },
];

export const sports = [
    { name: "Football", season: "Fall", gender: "Co-ed" },
    { name: "Volleyball", season: "Fall", gender: "Women's" },
    { name: "Competitive Cheer", season: "Fall", gender: "Co-ed" },
    { name: "Cross Country", season: "Fall", gender: "Co-ed" },
    { name: "Swimming", season: "Fall", gender: "Co-ed" },
    { name: "Girls Tennis", season: "Fall", gender: "Women's" },
    { name: "Girls Golf", season: "Fall", gender: "Women's" },
    { name: "Basketball (Boys)", season: "Winter", gender: "Men's" },
    { name: "Basketball (Girls)", season: "Winter", gender: "Women's" },
    { name: "Wrestling", season: "Winter", gender: "Co-ed" },
    { name: "Soccer (Boys)", season: "Spring", gender: "Men's" },
    { name: "Soccer (Girls)", season: "Spring", gender: "Women's" },
    { name: "Baseball", season: "Spring", gender: "Men's" },
    { name: "Softball", season: "Spring", gender: "Women's" },
    { name: "Track & Field", season: "Spring", gender: "Co-ed" },
    { name: "Boys Tennis", season: "Spring", gender: "Men's" },
    { name: "Boys Golf", season: "Spring", gender: "Men's" },
];

export const courses = [
    // --- ENGLISH ---
    { name: "English 1 CP", department: "English", code: "ENG-101" },
    { name: "English 1 Honors", department: "English", code: "ENG-102" },
    { name: "English 2 CP", department: "English", code: "ENG-201" },
    { name: "English 2 Honors", department: "English", code: "ENG-202" },
    { name: "English 3 CP", department: "English", code: "ENG-301" },
    { name: "English 3 Honors", department: "English", code: "ENG-302" },
    { name: "English 4 CP", department: "English", code: "ENG-401" },
    { name: "English 4 Honors", department: "English", code: "ENG-402" },
    { name: "AP English Language", department: "English", code: "ENG-501" },
    { name: "AP English Literature", department: "English", code: "ENG-502" },
    { name: "Creative Writing", department: "English", code: "ENG-ELEC-01" },
    { name: "Young Adult Literature", department: "English", code: "ENG-ELEC-02" },
    { name: "Journalism / Yearbook", department: "English", code: "ENG-ELEC-03" },

    // --- MATH ---
    { name: "Algebra 1 CP", department: "Math", code: "MAT-101" },
    { name: "Algebra 1 Honors", department: "Math", code: "MAT-102" },
    { name: "Foundations of Algebra", department: "Math", code: "MAT-100" },
    { name: "Geometry CP", department: "Math", code: "MAT-201" },
    { name: "Geometry Honors", department: "Math", code: "MAT-202" },
    { name: "Algebra 2 CP", department: "Math", code: "MAT-301" },
    { name: "Algebra 2 Honors", department: "Math", code: "MAT-302" },
    { name: "Pre-Calculus CP", department: "Math", code: "MAT-401" },
    { name: "Pre-Calculus Honors", department: "Math", code: "MAT-402" },
    { name: "Probability & Statistics", department: "Math", code: "MAT-405" },
    { name: "AP Statistics", department: "Math", code: "MAT-501" },
    { name: "AP Calculus AB", department: "Math", code: "MAT-502" },
    { name: "AP Calculus BC", department: "Math", code: "MAT-503" },

    // --- SCIENCE ---
    { name: "Physical Science", department: "Science", code: "SCI-100" },
    { name: "Biology 1 CP", department: "Science", code: "SCI-101" },
    { name: "Biology 1 Honors", department: "Science", code: "SCI-102" },
    { name: "Chemistry 1 CP", department: "Science", code: "SCI-201" },
    { name: "Chemistry 1 Honors", department: "Science", code: "SCI-202" },
    { name: "Physics", department: "Science", code: "SCI-301" },
    { name: "Anatomy & Physiology", department: "Science", code: "SCI-305" },
    { name: "Marine Science", department: "Science", code: "SCI-306" },
    { name: "Forensic Science", department: "Science", code: "SCI-307" },
    { name: "AP Biology", department: "Science", code: "SCI-501" },
    { name: "AP Chemistry", department: "Science", code: "SCI-502" },
    { name: "AP Environmental Science", department: "Science", code: "SCI-503" },
    { name: "AP Physics 1", department: "Science", code: "SCI-504" },

    // --- SOCIAL STUDIES ---
    { name: "Human Geography", department: "Social Studies", code: "SS-100" },
    { name: "World History CP", department: "Social Studies", code: "SS-101" },
    { name: "World History Honors", department: "Social Studies", code: "SS-102" },
    { name: "U.S. History CP", department: "Social Studies", code: "SS-201" },
    { name: "U.S. Government", department: "Social Studies", code: "SS-301" },
    { name: "Economics", department: "Social Studies", code: "SS-302" },
    { name: "Law Education", department: "Social Studies", code: "SS-ELEC-01" },
    { name: "Psychology / Sociology", department: "Social Studies", code: "SS-ELEC-02" },
    { name: "Current Events", department: "Social Studies", code: "SS-ELEC-03" },
    { name: "AP Human Geography", department: "Social Studies", code: "SS-501" },
    { name: "AP European History", department: "Social Studies", code: "SS-502" },
    { name: "AP U.S. History", department: "Social Studies", code: "SS-503" },
    { name: "AP U.S. Government", department: "Social Studies", code: "SS-504" },
    { name: "AP Psychology", department: "Social Studies", code: "SS-505" },

    // --- WORLD LANGUAGES ---
    { name: "Spanish 1", department: "World Language", code: "LANG-SP-101" },
    { name: "Spanish 2", department: "World Language", code: "LANG-SP-102" },
    { name: "Spanish 3 Honors", department: "World Language", code: "LANG-SP-103" },
    { name: "AP Spanish Language", department: "World Language", code: "LANG-SP-501" },
    { name: "German 1", department: "World Language", code: "LANG-GR-101" },
    { name: "German 2", department: "World Language", code: "LANG-GR-102" },
    { name: "German 3 Honors", department: "World Language", code: "LANG-GR-103" },
    { name: "AP German Language", department: "World Language", code: "LANG-GR-501" },

    // --- FINE ARTS ---
    { name: "Art 1", department: "Fine Arts", code: "ART-101" },
    { name: "Art 2", department: "Fine Arts", code: "ART-102" },
    { name: "Art 3 Honors", department: "Fine Arts", code: "ART-103" },
    { name: "AP Art: Drawing", department: "Fine Arts", code: "ART-501" },
    { name: "Band: Symphonic", department: "Fine Arts", code: "MUS-BAND-101" },
    { name: "Band: Wind Ensemble", department: "Fine Arts", code: "MUS-BAND-102" },
    { name: "Chorus", department: "Fine Arts", code: "MUS-CHOR-101" },
    { name: "Orchestra / Strings", department: "Fine Arts", code: "MUS-STR-101" },
    { name: "Theatre 1", department: "Fine Arts", code: "THE-101" },
    { name: "Theatre 2", department: "Fine Arts", code: "THE-102" },

    // --- CAREER & TECH (CATE) & ELECTIVES ---
    { name: "Personal Finance", department: "CATE", code: "BUS-101" },
    { name: "Fundamentals of Computing", department: "CATE", code: "CS-101" },
    { name: "AP Computer Science Principles", department: "CATE", code: "CS-501" },
    { name: "Entrepreneurship", department: "CATE", code: "BUS-102" },
    { name: "Marketing", department: "CATE", code: "BUS-103" },
    { name: "Sports Medicine 1", department: "CATE", code: "MED-101" },
    { name: "Agricultural Science", department: "CATE", code: "AG-101" },
    { name: "Intro to Horticulture", department: "CATE", code: "AG-102" },
    { name: "Family & Consumer Science", department: "CATE", code: "FCS-101" },

    // --- PE & JROTC ---
    { name: "PE 1: Personal Fitness", department: "PE", code: "PE-101" },
    { name: "Weight Training", department: "PE", code: "PE-102" },
    { name: "AFJROTC 1", department: "JROTC", code: "ROTC-101" },
    { name: "AFJROTC 2", department: "JROTC", code: "ROTC-102" },
];

export const colleges = [
    // =======================================================
    // SC PUBLIC UNIVERSITIES (Follow SC CHE Requirements)
    // =======================================================
    {
        name: "Clemson University",
        type: "University",
        requirements: [
            "4 units English (Literature/Composition)",
            "4 units Math (Alg 1, Geom, Alg 2, +1 Higher)",
            "3 units Lab Science (Bio, Chem, Phys)",
            "2 units Foreign Language (Same language)",
            "1 unit Fine Arts",
            "1 unit PE or ROTC",
            "3 units Social Science (US Hist, Gov/Econ)",
        ],
        suggestions: [
            "Average Admitted GPA: 4.4+ (SC Uniform)",
            "Engineering: Calculus is effectively required",
            "3rd unit of Foreign Language strongly recommended",
            "Pre-Business: Statistics recommended",
        ],
    },
    {
        name: "University of South Carolina (USC)",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Studies",
            "1 unit Fine Arts",
        ],
        suggestions: [
            "Honors College: 4-5 core AP/IB courses minimum",
            "Capstone Scholars Avg GPA: 4.6",
            "4th unit of Lab Science recommended for STEM",
            "Leadership in 2+ extracurriculars",
        ],
    },
    {
        name: "Coastal Carolina University",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Science",
            "1 unit Fine Arts",
        ],
        suggestions: [
            "Marine Science: Bio and Chem required, Physics recommended",
            "3.0+ Core GPA for assured admission",
            "SAT 1100+ / ACT 22+ recommended for merit aid",
        ],
    },
    {
        name: "College of Charleston",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Science",
            "1 unit Fine Arts",
        ],
        suggestions: [
            "Strong writing essays emphasized",
            "Dual Enrollment transfer credits highly accepted",
            "Honors College: Top 10% of class rank",
        ],
    },
    {
        name: "The Citadel",
        type: "Military",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Science",
            "1 unit Fine Arts",
        ],
        suggestions: [
            "Demonstrated physical fitness (Cadet PT test)",
            "Leadership roles (Team Captain, JROTC Officer)",
            "Engineering: Pre-Calculus or Calculus",
        ],
    },
    {
        name: "Winthrop University",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Science",
            "1 unit Fine Arts",
        ],
        suggestions: [
            "Visual/Performing Arts: Portfolio/Audition required",
            "Teacher Education: 3.5+ GPA recommended",
        ],
    },
    {
        name: "South Carolina State University",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Science",
        ],
        suggestions: [
            "Strong STEM background for Nuclear Engineering program",
            "Summer enrichment programs viewed favorably",
        ],
    },
    {
        name: "USC Upstate",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Science",
        ],
        suggestions: [
            "Nursing: Competitive admissions, high Science GPA needed",
            "Education: 2.75+ GPA required",
        ],
    },
    {
        name: "Lander University",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Science",
        ],
        suggestions: [
            "Nursing: Separate application required after freshman year",
            "Montessori Education program requires interview",
        ],
    },
    {
        name: "Francis Marion University",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Science",
        ],
        suggestions: [
            "Engineering Tech: Strong Math background",
            "Health Physics: Physics and Chem recommended",
        ],
    },

    // =======================================================
    // SC PRIVATE COLLEGES
    // =======================================================
    {
        name: "Furman University",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math (Alg 1, 2, Geom)",
            "3 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Studies",
        ],
        suggestions: [
            "Most Admits have 4+ Honors/AP/IB credits per year",
            "4th unit of Lab Science (Physics recommended)",
            "3rd or 4th unit of Foreign Language",
            "Demonstrated community service",
        ],
    },
    {
        name: "Wofford College",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "2 units Social Studies",
        ],
        suggestions: [
            "Rigor: AP/IB curriculum strongly preferred",
            "Leadership in athletics or student government",
            "Interview highly recommended",
        ],
    },
    {
        name: "Presbyterian College",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "2 units Lab Science",
            "2 units Foreign Language",
            "2 units Social Studies",
        ],
        suggestions: [
            "Pharmacy pathway: Chemistry and Bio focus",
            "Service-oriented extracurriculars valued",
        ],
    },
    {
        name: "Anderson University",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Studies",
        ],
        suggestions: [
            "Christian commitment/service evidence",
            "Nursing/Kinesiology: Competitive entry",
            "Interview for top scholarships",
        ],
    },
    {
        name: "Charleston Southern University",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Studies",
        ],
        suggestions: [
            "Aeronautics: FAA medical clearance required",
            "Nursing: TEAS test scores required",
        ],
    },
    {
        name: "North Greenville University",
        type: "University",
        requirements: ["High School Diploma", "2.5 GPA Minimum"],
        suggestions: [
            "Faith statement/testimony often requested",
            "Outdoor leadership experience valued",
        ],
    },

    // =======================================================
    // SC TECHNICAL & COMMUNITY COLLEGES
    // =======================================================
    {
        name: "Tri-County Technical College",
        type: "Technical",
        requirements: [
            "High School Diploma or GED",
            "Placement Test (Accuplacer) or SAT/ACT exemption",
            "Final High School Transcript",
        ],
        suggestions: [
            "Bridge to Clemson: 2.5+ GPA required",
            "Nursing: Biology & Chem with 'C' or higher",
            "I-BEST programs available for extra support",
        ],
    },
    {
        name: "Greenville Technical College",
        type: "Technical",
        requirements: [
            "High School Diploma or GED",
            "Multiple Measures Placement (GPA + Math/English grades)",
        ],
        suggestions: [
            "Health Sciences: Weighted admission (GPA + TEAS score)",
            "Aircraft Maintenance: FAA requirements apply",
            "Honors Program: 3.5+ GPA",
        ],
    },
    {
        name: "Midlands Technical College",
        type: "Technical",
        requirements: ["High School Diploma or GED", "Placement testing (Reading, English, Math)"],
        suggestions: ["Gamecock Gateway (Bridge to USC)", "QuickJobs: 3-6 month certifications"],
    },
    {
        name: "Spartanburg Community College",
        type: "Technical",
        requirements: ["High School Diploma or GED", "Residency Certification"],
        suggestions: [
            "Spark Academy: Free tuition for eligible local grads",
            "BMW Scholars: Work/study program for manufacturing",
        ],
    },
    {
        name: "Trident Technical College",
        type: "Technical",
        requirements: ["High School Diploma or GED", "English/Math proficiency proof"],
        suggestions: [
            "Charleston Bridge to CofC",
            "Culinary Institute: Separate application",
            "Aeronautical Studies (Boeing partnership)",
        ],
    },

    // =======================================================
    // OUT-OF-STATE / ELITE (HIGH RIGOR)
    // =======================================================
    {
        name: "Duke University",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math (Calculus highly recommended)",
            "4 units Lab Science",
            "4 units Foreign Language",
            "3 units Social Studies",
        ],
        suggestions: [
            "Rigor: Maximize AP/IB course load available",
            "Engineering: Physics and Calculus required",
            "5 core academic courses per year",
        ],
    },
    {
        name: "University of North Carolina (UNC Chapel Hill)",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "2 units Social Studies (US Hist)",
        ],
        suggestions: [
            "Rigor: 5-8+ AP/IB courses typical for out-of-state admits",
            "Strong commitment to service/leadership",
            "Holistic review emphasizes essays",
        ],
    },
    {
        name: "Georgia Tech",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math (must include Pre-Calc)",
            "4 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Studies",
        ],
        suggestions: [
            "Math: Calculus I required for almost all majors",
            "Science: Physics heavily preferred for Engineering",
            "Evidence of STEM innovation/projects",
        ],
    },
    {
        name: "University of Georgia (UGA)",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "4 units Lab Science",
            "2 units Foreign Language",
            "3 units Social Studies",
        ],
        suggestions: [
            "Rigor: 7-10 AP/IB/Dual courses typical",
            "Math: AP Calculus or AP Stats recommended",
            "Core GPA is recalculated (electives removed)",
        ],
    },
    {
        name: "University of Tennessee",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math",
            "3 units Lab Science",
            "2 units Foreign Language",
            "1 unit US History",
        ],
        suggestions: [
            "Volunteer Spirit: Service strongly valued",
            "Nursing/Engineering: Early Action application recommended",
        ],
    },
    {
        name: "Vanderbilt University",
        type: "University",
        requirements: [
            "4 units English",
            "4 units Math (Calculus)",
            "4 units Lab Science",
            "4 units Foreign Language",
            "3 units Social Studies",
        ],
        suggestions: [
            "Rigor: Most challenging curriculum available",
            "4th year of Foreign Language",
            "Exceptional leadership or talent distinction",
        ],
    },
];
