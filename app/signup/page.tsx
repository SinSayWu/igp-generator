import Link from "next/link";

export default function Signup() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 border border-black rounded-2xl">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-[#d70026] tracking-tight">
                        Join Summit
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Choose your path to get started.
                    </p>
                </div>

                <div className="mt-8 space-y-4">
                    <Link
                        href="/student/signup"
                        className="group relative w-full flex flex-col items-center justify-center py-6 px-4 border border-black rounded-xl bg-white hover:bg-gray-50 transition-all duration-200"
                    >
                         <span className="text-3xl mb-2">🎓</span>
                        <span className="text-lg font-bold text-gray-900 group-hover:text-[#d70026]">
                            Sign Up as Student
                        </span>
                        <span className="text-sm text-gray-500 mt-1">
                            Build your personalized IGP
                        </span>
                    </Link>

                    <Link
                        href="/admin/signup"
                        className="group relative w-full flex flex-col items-center justify-center py-6 px-4 border border-black rounded-xl bg-white hover:bg-gray-50 transition-all duration-200"
                    >
                         <span className="text-3xl mb-2">🛡️</span>
                        <span className="text-lg font-bold text-gray-900 group-hover:text-gray-700">
                            Sign Up as Admin
                        </span>
                         <span className="text-sm text-gray-500 mt-1">
                            Manage school data
                        </span>
                    </Link>
                </div>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-[#d70026] hover:text-[#b00020] transition-colors">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}