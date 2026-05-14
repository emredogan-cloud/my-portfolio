"use client";

import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

const PROJECTS = [
  {
    id: "cloud-waste-hunter",
    colSpan: "md:col-span-2",
    title: "Cloud Waste Hunter",
    badge: "SaaS",
    description:
      "An automated SaaS tool designed to identify, report, and optimize unused AWS resources. Built to reduce cloud billing waste at scale.",
    tags: ["AWS", "Python", "Terraform", "Boto3", "Lemon Squeezy"],
  },
  {
    id: "iac",
    colSpan: "md:col-span-1",
    title: "Infrastructure as Code",
    badge: null,
    description:
      "Production-grade automated provisioning using Terraform and GitHub Actions for EC2, S3, and IAM.",
    tags: ["Terraform", "CI/CD", "AWS IAM"],
  },
  {
    id: "serverless",
    colSpan: "md:col-span-3",
    title: "Serverless Automations",
    badge: null,
    description:
      "Event-driven Lambda functions orchestrating cloud workflows without managing servers.",
    tags: ["AWS Lambda", "API Gateway", "Node.js"],
  },
] as const;

export default function Projects() {
  return (
    <section
      id="projects"
      className="relative max-w-6xl mx-auto px-6 py-32 z-10"
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <span className="text-sm font-medium text-[#00d2ff] tracking-widest uppercase">
          Work
        </span>
        <h2 className="text-4xl md:text-5xl font-bold mt-4 tracking-tight text-white">
          Things I&apos;ve shipped.
        </h2>
      </motion.div>

      {/* Bento grid */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {PROJECTS.map((project, i) => (
          <motion.div
            key={project.id}
            className={`liquid-glass rounded-2xl p-8 flex flex-col gap-5 ${project.colSpan}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.1 }}
            whileHover={{ scale: 1.01 }}
          >
            {/* Card header */}
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-white leading-snug">
                {project.title}
              </h3>
              {project.badge && (
                <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/20">
                  {project.badge}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-white/60 text-sm leading-relaxed grow">
              {project.description}
            </p>

            {/* Tech tags */}
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
