const variants = {
  blue: {
    iconBg:    'bg-ikn-blue-light',
    iconColor: 'text-ikn-blue',
    accent:    'from-ikn-blue to-ikn-blue-mid',
    valueCls:  'text-ikn-dark',
  },
  green: {
    iconBg:    'bg-ikn-green-light',
    iconColor: 'text-ikn-green',
    accent:    'from-ikn-green to-ikn-green-dark',
    valueCls:  'text-ikn-dark',
  },
  gold: {
    iconBg:    'bg-ikn-gold-light',
    iconColor: 'text-ikn-gold-dark',
    accent:    'from-ikn-gold to-ikn-gold-dark',
    valueCls:  'text-ikn-dark',
  },
  // legacy aliases
  orange: {
    iconBg:    'bg-ikn-gold-light',
    iconColor: 'text-ikn-gold-dark',
    accent:    'from-ikn-gold to-ikn-gold-dark',
    valueCls:  'text-ikn-dark',
  },
}

export default function StatCard({ title, value, subtitle, color = 'blue', icon: Icon }) {
  const v = variants[color] || variants.blue
  return (
    <div className="ikn-card relative overflow-hidden p-6 hover:shadow-card-hover transition-shadow duration-200 group">
      {/* Top accent gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${v.accent} opacity-80`} />

      {/* Decorative circle bg */}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${v.iconBg} opacity-40 pointer-events-none`} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{title}</p>
          <p className="text-2xl font-extrabold text-ikn-dark leading-none">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-2 font-medium">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-2xl ${v.iconBg} flex items-center justify-center flex-shrink-0 ml-4
                          group-hover:scale-110 transition-transform duration-200`}>
            <Icon className={`w-5 h-5 ${v.iconColor}`} />
          </div>
        )}
      </div>
    </div>
  )
}
