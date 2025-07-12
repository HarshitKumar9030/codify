import { AlertTriangle, ExternalLink, Database } from "lucide-react";

export default function DatabaseSetupRequired() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-zinc-200">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-zinc-600 rounded-xl flex items-center justify-center">
              <Database className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-zinc-900 mb-4">
            Database Setup Required
          </h1>
          
          <div className="flex items-center justify-center gap-2 mb-6 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">MongoDB connection needed</span>
          </div>
          
          <p className="text-zinc-600 mb-8 leading-relaxed">
            CodiFY needs a MongoDB database to store user accounts, classrooms, and assignments. 
            Please set up MongoDB Atlas (free & easy) or install MongoDB locally.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">
                🚀 MongoDB Atlas (Recommended)
              </h3>
              <p className="text-purple-700 text-sm mb-4">
                Free cloud database, no local installation needed
              </p>
              <a 
                href="https://cloud.mongodb.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Get started free <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            
            <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-xl p-6 border border-zinc-200">
              <h3 className="font-semibold text-zinc-900 mb-2">
                💻 Local MongoDB
              </h3>
              <p className="text-zinc-700 text-sm mb-4">
                Install MongoDB on your computer
              </p>
              <a 
                href="https://www.mongodb.com/try/download/community" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-700 font-medium text-sm"
              >
                Download MongoDB <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          
          <div className="bg-zinc-50 rounded-xl p-6 text-left">
            <h4 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
              📋 Setup Instructions
            </h4>
            <ol className="text-sm text-zinc-700 space-y-2 list-decimal list-inside">
              <li>Choose MongoDB Atlas or install locally</li>
              <li>Get your connection string</li>
              <li>Update the <code className="bg-zinc-200 px-1 rounded">DATABASE_URL</code> in your <code className="bg-zinc-200 px-1 rounded">.env.local</code> file</li>
              <li>Run: <code className="bg-zinc-200 px-1 rounded">npx prisma db push</code></li>
              <li>Restart the development server</li>
            </ol>
          </div>
          
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <p className="text-sm text-zinc-500">
              Need help? Check the <code className="bg-zinc-200 px-1 rounded">MONGODB_SETUP.md</code> file 
              in your project root for detailed instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
