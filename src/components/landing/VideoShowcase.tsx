import React from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoShowcaseProps {
  title?: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  features?: string[];
}

export const VideoShowcase: React.FC<VideoShowcaseProps> = ({
  title = "See Bauplan Buddy in Action",
  description = "Watch how leading construction companies are transforming their project management",
  videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ",
  thumbnailUrl,
  features = [
    "Real-time project tracking",
    "Automated document workflows",
    "AI-powered scheduling",
    "Team collaboration tools",
  ],
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">{description}</p>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-foreground font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Free Trial
            </Button>
          </motion.div>

          {/* Right: Video Player */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-sm bg-white/10 dark:bg-black/10">
              {!isPlaying ? (
                // Thumbnail with play button
                <div
                  className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center group cursor-pointer"
                  onClick={() => setIsPlaying(true)}
                >
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt="Video thumbnail"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
                  )}

                  {/* Play button overlay */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 w-20 h-20 rounded-full bg-white/90 dark:bg-white/80 flex items-center justify-center shadow-2xl group-hover:bg-white transition-colors"
                  >
                    <Play
                      className="w-8 h-8 text-blue-600 ml-1"
                      fill="currentColor"
                    />
                  </motion.div>

                  {/* Pulse effect */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/30 animate-ping" />
                  </div>
                </div>
              ) : (
                // Embedded video
                <div className="aspect-video">
                  <iframe
                    src={`${videoUrl}?autoplay=1`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* Floating stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">98%</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    Customer Satisfaction
                  </div>
                  <div className="text-sm text-muted-foreground">
                    1000+ reviews
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="absolute -top-6 -right-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl p-4 text-white"
            >
              <div className="font-bold text-2xl">4.9★</div>
              <div className="text-sm opacity-90">Top Rated</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
