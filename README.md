SQL Chatbot – React Frontend

A simple React app that connects to the Python FastAPI backend to generate SQL queries and explanations.

⭐ Getting Started
1. Install
   npm install

2. Run the app
   npm run dev

Your app will open at:
  http://localhost:5173

🌐 API Configuration
Edit config.js and choose one of the options below.

Localhost
keyword: "http://localhost:9001/generate_sql",
cluster: "http://localhost:9001/generate_sql_premium",

Custom Domain (chat.local)
keyword: "https://chat.local/generate_sql",
cluster: "https://chat.local/generate_sql_premium",

📦 Build for Production

npm run build
This creates a dist/ folder ready for deployment.

✔️ Requirements

Node.js installed

Python FastAPI backend running

CORS allowed for your frontend URL

📝 Notes

If using chat.local, add it to your hosts file:
127.0.0.1  chat.local

Use HTTPS if your frontend is served over HTTPS.

