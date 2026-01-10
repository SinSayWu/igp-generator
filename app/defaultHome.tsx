"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

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
                        <div className="text-group-body" style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                            <span className="highlight-red">Summit</span> is your own{" "}
                            <span className="highlight-red">personalized AI,</span> tuned to focus and
                            guide you through class selections and extracurriculars to{" "}
                            <span className="highlight-red">
                                help you get into the college you want
                            </span>
                            .
                        </div>
                    </div>

                    {/* Plot Your Future Section */}
                    <div className="text-group section-spacer">
                        <h2 className="text-group-header red-header">PLOT YOUR FUTURE</h2>
                        {/* <hr className="text-group-line" /> */}
                        <div className="text-group-body" style={{ maxWidth: "800px" }}>
                            <span className="highlight-red">Summit</span> combs through hundreds of colleges and
                            databases to give you the best idea of what you need to
                            accomplish to reach your <span className="highlight-red">peak</span>. It recommends classes and
                            extracurricular based on where you want to attend and what
                            you want to achieve, packed into a <span className="highlight-red">personalized IGP</span> just for
                            you.
                        </div>
                    </div>
              
                    {/* Floating Logos Placeholder */}
                    <div className="logo-placeholder">
                        <div className="logo-wrapper">
                            <img src="/logos/Clemson.png" alt="Clemson Logo"/>
                        </div>
                        <div className="logo-wrapper">
                            <img src="/logos/USC.png" alt="USC Logo"/>
                        </div>
                        <div className="logo-wrapper">
                            <img src="/logos/MIT.png" alt="MIT Logo"/>
                        </div>
                         <div className="logo-wrapper">
                            <img src="/logos/Furman.png" alt="Furman Logo"/>
                        </div>
                         <div className="logo-wrapper">
                            <img src="/logos/Harvard.png" alt="Harvard Logo"/>
                        </div>
                    </div>

                    {/* 3 Steps Section */}
                    <div className="section-spacer" style={{ width: "100%" }}>
                        <h2 className="text-group-header red-header" style={{ justifyContent: "center" }}>
                            Only 3 Steps!
                        </h2>
                        <div className="steps-container">
                            <div className="step-item">
                                <div className="step-title">Basic Setup</div>
                                <div className="text-group-body-left step-description">
                                    Simply upload your school's graduation
                                    requirements and provided classes to get
                                    started.
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-title">Personalization</div>
                                <div className="text-group-body-left step-description">
                                    Establish Summit's new personalized task. Tell it
                                    what classes and clubs you have participated in
                                    and what colleges you are interested in
                                    applying to.
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-title">Results</div>
                                <div className="text-group-body-left step-description">
                                    Summit will gather all of the provided
                                    information and furnish a polished IGP to
                                    highlight your needs and outline a plan to
                                    help you apply to your dream college
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Why Us Section */}
                    <div className="text-group section-spacer">
                        <h2 className="text-group-header red-header">WHY US?</h2>
                        <div className="text-group-body" style={{ maxWidth: "800px" }}>
                            We want to provide a streamlined and simplified service that
                            will help you <span className="highlight-red">jumpstart your future</span>. By creating Summit as a
                            personalized AI that takes your interests and goals to provide
                            assistance for your college interests, we hope to make a
                            positive impact and make the process less stressful for
                            everybody who uses it.
                        </div>
                    </div>

                    <Link
                        href="/signup"
                        className="btn pop-text"
                        style={{ fontSize: "1.5rem" }}
                        >
                        BEGIN YOUR CLIMB
                        </Link>
                </div>
            </section>
        </>
    );
}
