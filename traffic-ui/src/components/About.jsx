import React from "react";
import {
  FaReact,
  FaPython,
  FaBrain,
  FaLaptopCode,
  FaTrafficLight,
  FaUsers,
  FaGithub,
  FaLinkedin,
  FaLightbulb,
  FaRocket,
  FaShieldAlt,
  FaChartLine
} from "react-icons/fa";
import { SiTailwindcss, SiFlask, SiOpencv } from "react-icons/si";

const About = () => {
  const features = [
    {
      icon: <FaBrain />,
      title: "AI-Powered Detection",
      description: "YOLOv8 deep learning model for accurate vehicle detection and counting",
      color: "violet"
    },
    {
      icon: <FaChartLine />,
      title: "Traffic Analytics",
      description: "Advanced analytics and visualization for traffic patterns and trends",
      color: "blue"
    },
    {
      icon: <FaChartLine />,
      title: "Smart Timing",
      description: "Dynamic signal duration based on real-time traffic density",
      color: "emerald"
    },
    {
      icon: <FaRocket />,
      title: "Real-time Updates",
      description: "WebSocket-based live updates across all connected clients",
      color: "amber"
    }
  ];

  const techStack = [
    { icon: <FaReact />, name: "React 19", desc: "Frontend Framework", color: "cyan" },
    { icon: <SiTailwindcss />, name: "Tailwind CSS", desc: "Styling", color: "cyan" },
    { icon: <FaPython />, name: "Python", desc: "Backend Language", color: "amber" },
    { icon: <SiFlask />, name: "Flask", desc: "API Framework", color: "white" },
    { icon: <FaBrain />, name: "YOLOv8", desc: "Object Detection", color: "violet" },
    { icon: <SiOpencv />, name: "OpenCV", desc: "Image Processing", color: "emerald" },
  ];

  const team = [
    { initials: "OM", name: "Om Mane", role: "Full-Stack Developer" },
    { initials: "VN", name: "Varad Nagre", role: "ML Engineer" },
    { initials: "SP", name: "Sanket Patni", role: "Backend Developer" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="glass-card p-8 lg:p-12 text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-6">
          <FaTrafficLight className="text-4xl text-white" />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gradient mb-4">
          TrafficIQ
        </h1>
        <p className="text-xl text-white/70 max-w-2xl mx-auto">
          AI-powered smart traffic management system revolutionizing urban mobility
        </p>
      </div>

      {/* About Description */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <FaLightbulb className="text-brand-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">About TrafficIQ</h2>
        </div>
        <p className="text-white/70 leading-relaxed mb-6">
          TrafficIQ is a next-generation traffic management solution that leverages real-time image processing
          and machine learning to optimize traffic signals in urban environments. Our system uses YOLOv8
          deep learning for vehicle detection, achieving over 95% accuracy in real-world conditions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl bg-${feature.color}-500/10 border border-${feature.color}-500/20`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-${feature.color}-400 text-xl`}>{feature.icon}</span>
                <h3 className="font-semibold text-white">{feature.title}</h3>
              </div>
              <p className="text-sm text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <FaRocket className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Technology Stack</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {techStack.map((tech, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all text-center group"
            >
              <div className={`text-3xl text-${tech.color}-400 mb-3 group-hover:scale-110 transition-transform`}>
                {tech.icon}
              </div>
              <p className="font-medium text-white text-sm">{tech.name}</p>
              <p className="text-xs text-white/50">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <FaUsers className="text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Our Team</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((member, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all text-center"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-xl font-bold text-white shadow-lg mb-4">
                {member.initials}
              </div>
              <h3 className="font-semibold text-white text-lg">{member.name}</h3>
              <p className="text-sm text-white/50 mb-4">{member.role}</p>
              <div className="flex justify-center gap-3">
                <a href="#" className="text-white/40 hover:text-brand-400 transition-colors">
                  <FaLinkedin className="text-lg" />
                </a>
                <a href="#" className="text-white/40 hover:text-white transition-colors">
                  <FaGithub className="text-lg" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <FaTrafficLight className="text-brand-400 text-xl" />
            <div>
              <p className="font-semibold text-gradient">TrafficIQ</p>
              <p className="text-xs text-white/50">B.Tech Final Year Project – G.H. Raisoni College</p>
            </div>
          </div>
          <p className="text-sm text-white/40">© 2025 All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
};

export default About;