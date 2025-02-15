import { Cpu, BarChart2, Users, Zap } from "lucide-react"

export const insights = [
    { name: "AI-Powered Predictions", icon: Cpu, color: "#3B82F6", dataKey: "predictions" },
    { name: "Real-time Analytics", icon: BarChart2, color: "#10B981", dataKey: "analytics" },
    { name: "Team Productivity", icon: Users, color: "#6366F1", dataKey: "productivity" },
    { name: "System Performance", icon: Zap, color: "#F59E0B", dataKey: "performance" },
]

export const generateData = () => {
    return Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        predictions: Math.floor(Math.random() * 100) + 50,
        analytics: Math.floor(Math.random() * 100) + 30,
        productivity: Math.floor(Math.random() * 100) + 60,
        performance: Math.floor(Math.random() * 100) + 40,
    }))
}

