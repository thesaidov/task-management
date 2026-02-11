import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-8 px-4">
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Task Management App
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Organize your tasks, collaborate with your team, and boost your
            productivity
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
          >
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2 text-gray-600">✓</div>
            <h3 className="font-bold text-lg mb-2 text-gray-600">
              Task Management
            </h3>
            <p className="text-gray-600 text-sm">
              Create, organize, and track your tasks efficiently
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-bold text-lg mb-2">Team Collaboration</h3>
            <p className="text-gray-600 text-sm">
              Work together with your team seamlessly
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold text-lg mb-2">Track Progress</h3>
            <p className="text-gray-600 text-sm">
              Monitor your productivity and achievements
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
