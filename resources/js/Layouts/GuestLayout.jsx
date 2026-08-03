export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="grid md:grid-cols-2">
                        {/* Left Side - Branding */}
                        <div className="bg-gradient-to-br from-[#003d82] to-[#4472C4] p-12 text-white flex flex-col justify-center items-center relative overflow-hidden">
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
                            
                            <div className="relative z-10 text-center">
                                {/* Logo */}
                                <div className="mb-6 flex justify-center">
                                    <img 
                                        src="/images/ilagan.jpeg" 
                                        alt="City of Ilagan Logo" 
                                        className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                                    />
                                </div>
                                
                                {/* Title */}
                                <h1 className="text-3xl font-bold mb-2">CDRRMO</h1>
                                <h2 className="text-xl font-semibold mb-4">City of Ilagan</h2>
                                <div className="w-24 h-1 bg-white mx-auto mb-6 rounded-full"></div>
                                
                                {/* Description */}
                                <p className="text-blue-100 text-sm leading-relaxed max-w-sm">
                                    City Disaster Risk Reduction and Management Office
                                </p>
                                <p className="text-blue-200 text-xs mt-4 leading-relaxed max-w-sm">
                                    Situational Reports System
                                </p>
                                
                                {/* Additional Info */}
                                <div className="mt-8 pt-8 border-t border-blue-400/30">
                                    <p className="text-xs text-blue-200">
                                        Province of Isabela, Philippines
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Login Form */}
                        <div className="p-12 flex flex-col justify-center">
                            {children}
                        </div>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="text-center mt-6 text-sm text-gray-600">
                    <p>© {new Date().getFullYear()} City of Ilagan CDRRMO. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
