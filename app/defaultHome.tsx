"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export default function DefaultHomePage() {
    const contentRef = useRef<HTMLDivElement>(null);

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
            { threshold: 0 }
        );

        if (contentRef.current) {
            observer.observe(contentRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <div className="hero-section">
                <h1 className="summit-title">SUMMIT</h1>
                <Image
                    src="/background.png"
                    alt="Mountain Foreground"
                    fill
                    className="mountain-foreground"
                    priority
                />
            </div>

            <section ref={contentRef} className="content-card">
                <div className="login-container">
                    <div className="text-group">
                        <h2 className="text-group-header">
                            Summit is your own
                            <span style={{ color: "var(--foreground)", marginLeft:"0.25em"}}> personalized AI</span>
                        </h2>
                        <hr className="text-group-line" />
                        <div className="text-group-body">
                            Tuned to guide you through class selections and
                            extracurriculars to help you get into your dream college.
                        </div>
                    </div>

                    <button className="btn pop-text" style={{ fontSize: "1.5rem" }}>
                        BEGIN YOUR CLIMB
                    </button>
                </div>
            </section>
        </>
    );
}
