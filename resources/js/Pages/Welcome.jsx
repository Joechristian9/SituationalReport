import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Welcome to CDRRMO" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
                {/* Navigation */}
                <nav className="absolute top-0 right-0 p-6 z-10">
                    {auth.user ? (
                        <Link
                            href="/dashboard"
                            className="px-6 py-2.5 bg-gradient-to-r from-[#003d82] to-[#4472C4] text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <div className="flex gap-4">
                            <Link
                                href={route('login')}
                                className="px-6 py-2.5 bg-gradient-to-r from-[#003d82] to-[#4472C4] text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                                Log in
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Hero Section */}
                <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
                    {/* Decorative circles */}
                    <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200 opacity-20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-300 opacity-20 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10 text-center max-w-5xl">
                        {/* Logo */}
                        <div className="mb-8 flex justify-center">
                            <img 
                                src="/images/ilagan.jpeg" 
                                alt="City of Ilagan Logo" 
                                className="w-40 h-40 rounded-full border-8 border-white shadow-2xl"
                            />
                        </div>
                        
                        {/* Title */}
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
                            City Disaster Risk Reduction
                        </h1>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#003d82] to-[#4472C4] bg-clip-text text-transparent mb-6">
                            and Management Office
                        </h2>
                        
                        {/* Subtitle */}
                        <p className="text-xl text-gray-600 mb-4">
                            City of Ilagan, Province of Isabela
                        </p>
                        <div className="w-32 h-1 bg-gradient-to-r from-[#003d82] to-[#4472C4] mx-auto mb-8 rounded-full"></div>
                        
                        {/* Description */}
                        <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed">
                            Situational Reports System for monitoring, reporting, and coordinating 
                            emergency operations across the City of Ilagan.
                        </p>
                        
                        {/* CTA Button */}
                        {!auth.user && (
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-[#003d82] to-[#4472C4] text-white text-lg font-semibold rounded-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
                            >
                                Get Started
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 mt-20 text-center text-gray-600">
                        <p className="text-sm">
                            © {new Date().getFullYear()} City of Ilagan CDRRMO. All rights reserved.
                        </p>
                        <p className="text-xs mt-2">
                            CDRRMO Building, City Hall Compound, San Vicente, City of Ilagan, Isabela 3300
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
