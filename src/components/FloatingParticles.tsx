import { motion } from 'framer-motion';

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

export default function FloatingParticles({ count = 40, className = '' }: FloatingParticlesProps) {
  const particles = Array.from({ length: count });

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: ['#FF5FA2', '#FFD9E8', '#F8C8DC', '#F4C27A'][Math.floor(Math.random() * 4)],
            opacity: Math.random() * 0.6 + 0.2,
          }}
          animate={{
            y: [0, Math.random() * 60 - 30, 0],
            opacity: [0.3, 1, 0.3],
            scale: [1, Math.random() * 0.5 + 0.8, 1],
          }}
          transition={{
            duration: Math.random() * 8 + 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}
