import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function Profile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Get user data from localStorage
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    mobile: '',
    mobileVerified: false,
    emailVerified: false,
    joinedDate: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserData({
        name: parsed.name || '',
        email: parsed.email || '',
        mobile: parsed.mobile || '',
        mobileVerified: parsed.mobileVerified || false,
        emailVerified: parsed.emailVerified || false,
        joinedDate: parsed.createdAt ? new Date(parsed.createdAt).toLocaleDateString() : '2025-01-01',
      });
    }
  }, []);

  const sendEmailVerification = async () => {
    setLoading(true);
    // Simulate sending verification email
    setTimeout(() => {
      setVerificationSent(true);
      setLoading(false);
      alert(`Verification email sent to ${userData.email}`);
      setTimeout(() => setVerificationSent(false), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-pink-100 py-4 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-block hover:opacity-80 transition">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">MyPinkShop</h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 h-fit">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                <span className="text-white text-3xl font-bold">{userData.name?.charAt(0) || 'U'}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{userData.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Member since {userData.joinedDate}</p>
            </div>

            <nav className="space-y-2">
              <button className="w-full text-left px-4 py-2 rounded-lg bg-pink-50 text-pink-600 font-medium">Profile Information</button>
              <button className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition">Address Book</button>
              <button className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition">Payment Methods</button>
              <button className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition">Change Password</button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{userData.name}</p>
                  </div>
                  <button className="text-pink-500 text-sm hover:underline">Edit</button>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500">Mobile Number</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{userData.mobile || 'Not added'}</p>
                      {userData.mobileVerified && (
                        <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">Verified ✓</span>
                      )}
                    </div>
                  </div>
                  <button className="text-pink-500 text-sm hover:underline">Update</button>
                </div>
              </div>
            </div>

            {/* Email Verification */}
            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Email Address</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{userData.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {userData.emailVerified ? (
                      <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>✓</span> Verified
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-0.5 rounded-full">Not verified</span>
                    )}
                  </div>
                </div>
                {!userData.emailVerified && (
                  <button
                    onClick={sendEmailVerification}
                    disabled={loading || verificationSent}
                    className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-600 transition disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : verificationSent ? 'Sent!' : 'Verify Email'}
                  </button>
                )}
              </div>
              {!userData.emailVerified && (
                <p className="text-xs text-gray-400 mt-3">
                  Verify your email to access all features and receive order updates.
                </p>
              )}
            </div>

            {/* Account Security */}
            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Security</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                  </div>
                  <button className="text-pink-500 text-sm hover:underline">Change</button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <button className="text-pink-500 text-sm hover:underline">Enable</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
