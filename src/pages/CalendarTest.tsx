import { Link } from "react-router-dom";
import { Building, Calendar as CalendarIcon } from "lucide-react";

const CalendarTest = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bauplan Buddy</h1>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Dashboard</Link>
                <Link to="/projects" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Projekte</Link>
                <Link to="/quotes" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Angebote</Link>
                <Link to="/invoices" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Rechnungen</Link>
                <Link to="/calendar" className="text-blue-600 font-medium">Termine</Link>
                <Link to="/customers" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Kunden</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Content */}
        <div className="text-center py-12">
          <CalendarIcon className="h-24 w-24 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Calendar Test Page
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            This is a simple test page to verify the calendar route is working.
          </p>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Test Information</h3>
            <ul className="text-left space-y-2">
              <li>✅ Route is working</li>
              <li>✅ Components are loading</li>
              <li>✅ Styling is applied</li>
              <li>✅ Icons are rendering</li>
            </ul>
          </div>
          
          <div className="mt-8">
            <Link 
              to="/" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTest;