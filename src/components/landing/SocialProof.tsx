import React from "react";
import { motion } from "framer-motion";
import { Building2, Users, Award, TrendingUp, Shield, Zap } from "lucide-react";

const companies = [
  { name: "Bauer AG", logo: "🏗️" },
  { name: "Hochtief", logo: "🏢" },
  { name: "Strabag", logo: "🏛️" },
  { name: "Bilfinger", logo: "⚡" },
  { name: "Züblin", logo: "🔨" },
];

const stats = [
  {
    icon: Building2,
    value: "1,000+",
    label: "Active Projects",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    value: "50,000+",
    label: "Team Members",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Award,
    value: "98%",
    label: "Satisfaction Rate",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: TrendingUp,
    value: "€2.5B+",
    label: "Projects Managed",
    color: "from-orange-500 to-red-500",
  },
];

const achievements = [
  { icon: Shield, text: "ISO 27001 Certified", color: "text-blue-600" },
  {
    icon: Award,
    text: "Best Construction Software 2024",
    color: "text-purple-600",
  },
  { icon: Zap, text: "99.9% Uptime SLA", color: "text-green-600" },
];

export const SocialProof: React.FC = () => {
  return (
    <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trusted by section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Trusted by Industry Leaders
          </p>

          {/* Company logos */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 mb-12">
            {companies.map((company, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer"
              >
                <div className="text-4xl">{company.logo}</div>
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {company.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="relative group"
              >
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg">
                  {/* Icon */}
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${stat.color} mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Value */}
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>

                  {/* Label */}
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center gap-6"
        >
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 px-6 py-3 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Icon className={`w-5 h-5 ${achievement.color}`} />
                <span className="font-medium text-foreground">
                  {achievement.text}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
