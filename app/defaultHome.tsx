"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";


const pathwayYears = [
    {
        year: "9th Grade",
        courses: [
            ["Algebra 1 CP", "MATH - 1 cr"],
            ["English 1 CP", "ENG - 1 cr"],
            ["Human Geography", "SOC - 1 cr"],
        ],
    },
    {
        year: "10th Grade",
        courses: [
            ["Geometry CP", "MATH - 1 cr"],
            ["Biology 1 CP", "SCI - 1 cr"],
            ["Art 1 CP", "FA - 1 cr"],
        ],
    },
    {
        year: "11th Grade",
        courses: [
            ["Algebra 2 CP", "MATH - 1 cr"],
            ["Chemistry 1 CP", "SCI - 1 cr"],
            ["English 3 CP", "ENG - 1 cr"],
        ],
    },
    {
        year: "12th Grade",
        courses: [
            ["Pre-Calculus CP", "MATH - 1 cr"],
            ["AP CS Principles", "CS - AP - 1 cr"],
            ["Physics CP", "SCI - 1 cr"],
        ],
    },
];

const recommendations = [
    {
        title: "Student Council",
        badge: "Recommended",
        tags: ["Leadership"],
        quote: "Shape your high school environment while building the leadership story colleges look for.",
        nextStep: "Contact Mrs. Howard to join.",
    },
    {
        title: "Prisma Health Apprenticeship",
        badge: "High Match",
        tags: ["Paid", "Healthcare"],
        quote: "Earn while gaining clinical experience that supports a future in healthcare or bio-medical engineering.",
        nextStep: "Review eligibility and application windows.",
    },
    {
        title: "Beta Club",
        badge: "Recommended",
        tags: ["Academic", "Service"],
        quote: "Strengthen your academic profile with consistent service and honor society participation.",
        nextStep: "Contact Mrs. Justus to join.",
    },
];

const logos = [
    ["Clemson", "/logos/Clemson.png"],
    ["USC", "/logos/USC.png"],
    ["MIT", "/logos/MIT.png"],
    ["Furman", "/logos/Furman.png"],
    ["Harvard", "/logos/Harvard.png"],
];

export default function DefaultHomePage() {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { rootMargin: "0px 0px -80px 0px", threshold: 0.12 }
        );

        document.querySelectorAll(".reveal-up").forEach((element) => {
            observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <main className="home-page">
            <section className="hero-section">
                <div className="hero-copy reveal-up">
                    <p className="hero-kicker">AI-Powered Excellence</p>
                    <h1 className="summit-title">SUMMIT</h1>
                    <p className="hero-subtitle">
                        Personalized AI guidance for class selections, extracurriculars,
                        college targets, and the next steps that help you reach your peak.
                    </p>
                    <div className="hero-actions">
                        <Link href="/signup" className="home-btn home-btn-primary">
                            Begin Your Climb
                        </Link>

                    </div>
                </div>
                <Image
                    src="/background.png"
                    alt="Mountain Foreground"
                    fill
                    className="mountain-foreground"
                    priority
                />
            </section>

            <section className="content-card">

                <section className="home-section home-container reveal-up" id="methodology">
                    <div className="section-heading">
                        <p>Plot Your Future</p>
                        <h2>Your Personalized PATH</h2>
                        <span>
                            Summit visualizes your high school journey so every credit,
                            elective, club, and opportunity lines up with your ambitions.
                        </span>
                    </div>
                    <div className="pathway-panel">
                        <div className="pathway-grid">
                            {pathwayYears.map((year) => (
                                <article className="pathway-year" key={year.year}>
                                    <h3>{year.year}</h3>
                                    {year.courses.map(([name, meta]) => (
                                        <div className="course-chip" key={`${year.year}-${name}`}>
                                            <strong>{name}</strong>
                                            <span>{meta}</span>
                                        </div>
                                    ))}
                                </article>
                            ))}
                        </div>
                        <Link href="/signup" className="home-btn home-btn-outline">
                            Customize My 4-Year Plan
                        </Link>
                    </div>
                </section>

                <section className="home-section recommendations-band reveal-up">
                    <div className="home-container">
                        <div className="split-heading">
                            <div>
                                <p>Make an impact</p>
                                <h2>Personalized Opportunities for You</h2>
                                <span className="opportunities-intro">
                                    Summit helps students discover clubs, apprenticeships,
                                    internships, and local experiences that let them explore
                                    real careers early and build confidence before college.
                                </span>
                            </div>
                            <Link href="/signup" className="home-btn home-btn-primary">
                                Run AI Matcher
                            </Link>
                        </div>
                        <div className="recommendation-grid">
                            {recommendations.map((recommendation) => (
                                <article className="recommendation-card" key={recommendation.title}>
                                    <div>
                                        <div className="card-title-row">
                                            <h3>{recommendation.title}</h3>
                                            <span>{recommendation.badge}</span>
                                        </div>
                                        <div className="tag-row">
                                            {recommendation.tags.map((tag) => (
                                                <small key={tag}>{tag}</small>
                                            ))}
                                        </div>
                                        <p>{recommendation.quote}</p>
                                    </div>
                                    <div className="next-step">
                                        <strong>Next Step</strong>
                                        <span>{recommendation.nextStep}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="home-section home-container feature-grid reveal-up" id="features">
                    <article className="feature-card feature-card-large">
                        <div className="dashboard-mockup" aria-hidden="true">
                            <div className="mockup-header">
                                <span />
                                <span />
                                <span />
                            </div>
                            <div className="mockup-body">
                                <div className="mockup-score">94%</div>
                                <div className="mockup-bars">
                                    <span />
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            </div>
                        </div>
                        <h2>Admin Dashboard</h2>
                        <p>
                            Track graduation requirements, GPA signals, college readiness,
                            extracurricular balance, and recommended next actions in one place.
                        </p>
                    </article>
                    <article className="feature-card dark-feature">
                        <p>Personalized AI</p>
                        <h2>Advice tuned to your transcript and goals.</h2>
                        <div className="pill-row">
                            <span>Personalized Opportunities</span>
                            <span>Club Matching</span>
                            <span>PATH Planning</span>
                        </div>
                    </article>
                    <article className="feature-card step-feature">
                        <p>Only 3 Steps</p>
                        <h2>Setup. Personalize. Generate.</h2>
                        <span>
                            Link to your school, tell Summit what you care about, then get
                            a polished plan built around your target outcomes.
                        </span>
                    </article>
                </section>

                <section className="home-section home-container partners reveal-up" id="partners">
                    <p>Empowering Students Entering Top Institutions</p>
                    <div className="partner-logos">
                        {logos.map(([name, src]) => (
                            <div className="partner-logo" key={name}>
                                <Image src={src} alt={`${name} Logo`} width={170} height={76} />
                            </div>
                        ))}
                    </div>
                </section>
                <section className="home-section counselor-section reveal-up">
                    <div className="home-container counselor-note">
                        <p>Guidance That Stays With You</p>
                        <h2>Get clear answers before every important choice.</h2>
                        <span>
                            Summit helps students and families think through course changes,
                            graduation requirements, college fit, and opportunity decisions
                            without waiting for the next appointment.
                        </span>
                    </div>

                    <div className="home-container counselor-card">
                        <div className="counselor-header">
                            <div>
                                <h2>Ask the Counselor</h2>
                                <p>Always available for academic questions.</p>
                            </div>
                            <span>AI Online</span>
                        </div>
                        <div className="chat-row">
                            <p>
                                Based on your interest in Bio-Medical Engineering, would you
                                like to compare AP Biology and IB Biology requirements?
                            </p>
                        </div>
                        <div className="chat-row user-chat">
                            <p>Yes, please compare those for my junior year schedule.</p>
                        </div>
                        <div className="chat-input">Ask about your schedule or request a change...</div>
                    </div>

                </section>

                <section className="final-cta reveal-up">
                    <div className="home-container">
                        <h2>Your peak is within reach. Let&apos;s build the plan.</h2>
                        <p>
                            Join students using Summit AI to navigate high school with
                            clearer choices and a stronger path forward.
                        </p>
                        <div className="hero-actions">
                            <Link href="/signup" className="home-btn cta-btn">
                                Create My Free Account
                            </Link>
                            <Link href="/login" className="home-btn cta-secondary">
                                Log In
                            </Link>
                        </div>
                    </div>
                </section>
            </section>
        </main>
    );
}
