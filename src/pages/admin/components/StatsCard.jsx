function StatsCard({ title, value, icon, trend, trendValue }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue} from last week
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatsCard;
