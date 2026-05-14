import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Profile() {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    mobile: '',
    mobileVerified: false,
    emailVerified: false,
    joinedDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

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
    setTimeout(() => {
      setVerificationSent(true);
      setLoading(false);
      alert(`Verification link sent to ${userData.email}`);
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

          {/* Main Content - Email Verification Section */}
          <div className="md:col-span-2 space-y-6">
            {/* Email Verification Card - Important */}
            <div className={`rounded-2xl shadow-sm border-2 p-6 ${!userData.emailVerified ? 'border-yellow-200 bg-yellow-50/30' : 'border-green-100 bg-white'}`}>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${!userData.emailVerified ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    {!userData.emailVerified ? (
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Email Verification</h3>
                    <p className="text-sm text-gray-500">{userData.email}</p>
                  </div>
                </div>
                {!userData.emailVerified ? (
                  <button
                    onClick={sendEmailVerification}
                    disabled={loading || verificationSent}
                    className="bg-pink-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-pink-600 transition disabled:opacity-50 shadow-sm"
                  >
                    {loading ? 'Sending...' : verificationSent ? 'Sent! Check Email' : 'Verify Email →'}
                  </button>
                ) : (
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              {!userData.emailVerified && (
                <p className="text-xs text-yellow-600 mt-3 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify your email to get order updates and reset password easily.
                </p>
              )}
            </div>

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
                        <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">Verified</span>
                      )}
                    </div>
                  </div>
                  <button className="text-pink-500 text-sm hover:underline">Update</button>
                </div>
              </div>
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
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
