import { useNavigate } from 'react-router-dom';

function VendorHeader({ vendor }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendor');
    navigate('/vendor/login');
  };

  return (
    <div className="fixed top-0 right-0 left-0 z-50 border-b border-pink-100 bg-white/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
            M
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            MyPinkShop <span className="text-xs font-normal text-gray-400">Seller Center</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{vendor?.brandName || vendor?.name}</p>
              <p className="text-xs text-gray-400">{vendor?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {vendor?.brandName?.charAt(0) || vendor?.name?.charAt(0) || 'S'}
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-pink-500 transition p-2">
              🚪
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorHeader;
