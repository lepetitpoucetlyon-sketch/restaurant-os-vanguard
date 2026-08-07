"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from 'next/image';
import { TESTIMONIALS } from "@/app/(client)/(public)/landing/constants";

export function TestimonialsSection() {
    return (
        <section id="testimonials" className="relative py-32 px-6 bg-surface-sidebar">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <span className="text-brand text-sm font-bold uppercase tracking-[0.3em] mb-4 block">Témoignages</span>
                    <h2 className="text-4xl md:text-6xl font-brand font-semibold text-text-primary mb-6">
                        Ils nous font confiance
                    </h2>
                </motion.div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map((testimonial, idx) => (
                        <motion.div
                            key={testimonial.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className="p-8 rounded-3xl bg-surface-card border border-border-default hover:border-focus/30 transition-all duration-500"
                        >
                            {/* Stars */}
                            <div className="flex gap-1 mb-6">
                                {Array.from({ length: testimonial.rating }).map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-brand text-brand" />
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-text-primary/80 text-lg leading-relaxed mb-8 italic">
                                "{testimonial.quote}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-4">
                                <Image
                                    src={testimonial.avatar}
                                    alt={testimonial.author}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-focus/30"
                                />
                                {testimonial.author && (
                                    <div>
                                        <div className="text-text-primary font-semibold">{testimonial.author}</div>
                                        <div className="text-text-primary/50 text-sm">{testimonial.role}</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
