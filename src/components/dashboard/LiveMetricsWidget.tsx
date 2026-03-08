import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface LiveMetric {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: LucideIcon;
  color: "blue" | "purple" | "green" | "orange";
}

interface LiveMetricsWidgetProps {
  metrics: LiveMetric[];
}

export const LiveMetricsWidget: React.FC<LiveMetricsWidgetProps> = ({
  metrics,
}) => {
  const colorClasses = {
    blue: {
      gradient: "from-blue-500/20 to-blue-600/20",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/30",
    },
    purple: {
      gradient: "from-purple-500/20 to-purple-600/20",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-500/30",
    },
    green: {
      gradient: "from-green-500/20 to-green-600/20",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-500/30",
    },
    orange: {
      gradient: "from-orange-500/20 to-orange-600/20",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-500/30",
    },
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600 dark:text-green-400";
    if (change < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const colors = colorClasses[metric.color];
        const TrendIcon = getTrendIcon(metric.change);
        const trendColor = getTrendColor(metric.change);

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden border-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              {/* Gradient Overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.title}
                </CardTitle>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`p-2 rounded-lg bg-gradient-to-br ${colors.gradient} border ${colors.border}`}
                >
                  <metric.icon className={`h-4 w-4 ${colors.text}`} />
                </motion.div>
              </CardHeader>

              <CardContent className="relative z-10">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                  className={`text-3xl font-bold ${colors.text} mb-2`}
                >
                  {metric.value}
                </motion.div>

                <div className="flex items-center gap-2 text-sm">
                  <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                  <span className={trendColor}>
                    {metric.change > 0 ? "+" : ""}
                    {metric.change}%
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {metric.changeLabel}
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <motion.div
                  className="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.4 }}
                >
                  <motion.div
                    className={`h-full bg-gradient-to-r ${colors.gradient}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.abs(metric.change) * 10}%` }}
                    transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                  />
                </motion.div>
              </CardContent>

              {/* Bottom Glow */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default LiveMetricsWidget;
