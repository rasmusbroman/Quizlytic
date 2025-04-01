# Quizlytic

Quizlytic is a modern, interactive quiz and survey platform designed to create engaging real-time experiences for educators, presenters, and event organizers.

## 🌟 Features

- **Multiple Quiz Modes**
  - Real-time quizzes with host control
  - Self-paced surveys participants complete at their own pace
  
- **Versatile Question Types**
  - Single-choice questions
  - Multiple-choice questions
  - Free-text responses

- **Easy Sharing**
  - Unique PIN codes for each quiz
  - Automatically generated QR codes
  - Copy link to join
  - Public or private visibility options

- **Comprehensive Results**
  - Detailed analytics and statistics
  - Option to grade free-text responses

- **Administrative Controls**
  - Quiz modification
  - Session monitoring
  - Grade free-text responese

## 🚀 Technology Stack

### Frontend
- **Next.js** with TypeScript
- **Tailwind CSS** for styling
- **React Context API** for state management
- **SignalR client** for real-time communication

### Backend
- **.NET Core** with C# minimal API
- **Entity Framework Core** for database access
- **SignalR** for real-time communication
- **PostgreSQL** database

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v22.x or higher)
- [.NET SDK](https://dotnet.microsoft.com/download) (v9.0 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v17.x or higher)

## 💻 Installation

### Clone the Repository

```bash
git clone https://github.com/rasmusbroman/Quizlytic.git
cd quizlytic
```

### Backend Setup

Navigate to the API project directory:

```bash
cd Quizlytic.API
```

Update the database connection string in `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=quizlytic;Username=postgres;Password=your_chosen_password"
}
```

Create database named **"quizlytic"** in PostgreSQL

Apply database migrations and run the backend:

```bash
dotnet ef database update
dotnet run
```

The API will run at: [https://localhost:7066](https://localhost:7066)

### Frontend Setup

Navigate to the web project directory:

```bash
cd ../quizlytic.web
```

Install dependencies:

```bash
npm install
```

In /quizlytic.web directory, create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://localhost:7066
```

Start the development server:

```bash
npm run dev
```

The frontend will run at: [http://localhost:3000](http://localhost:3000)

---

## 🔧 Configuration

### Themes

Customize themes by editing CSS variables in `globals.css`. Default theme is green, you can switch to an orange theme or create a new one.

### Authentication

The demo uses local storage authentication. As per demo use these credentials to log in as administrator to bring up Admin page:

```bash
User: admin
Password: 1234
```

---

## 🎮 Usage Guide

### Creating a Quiz

1. Click **"Create Quiz"** on the dashboard or in the header.
2. Enter quiz details:
   - Title and description
   - Quiz mode (real-time/self-paced)
   - Visibility (public/private)
   - Correct answers option
3. Add questions and answers.
4. Save the quiz.

### Hosting a Quiz

1. Log in as **admin**.
2. Go to **Admin** page.
1. Select a quiz from the list.
2. Click **"Start Quiz"**.
3. Share PIN or QR code, or the "Copy Join Link".
4. Manage real-time quiz flow manually.

### Joining a Quiz

1. Click **"Join Quiz"** on the dashboard or click **"Join"** in the header, then enter PIN code. Or scan the QR code, use link or choose quiz from the list.
2. Enter your name (optional if allowed on self-paced quiz).
3. Respond to questions.

### Viewing Results

- Access results from the **"Results"** section.
- View statistics and answer distributions.

---

## 📂 Project Structure

```
Quizlytic/
├── Quizlytic.API/              # Backend API
│   ├── Data/                   # EF Core context
│   ├── DTOs/                   # Data transfer objects
│   ├── Endpoints/              # API endpoints
│   ├── Extensions/             # Extension methods
│   ├── Hubs/                   # SignalR hubs
│   └── Models/                 # Domain models
├── quizlytic.web/              # Frontend Next.js
│   ├── public/                 # Static assets
│   └── src/
│       ├── app/                # Application routes
│       ├── components/         # React components
│       ├── contexts/           # React contexts
│       ├── hooks/              # Custom React hooks
│       └── lib/                # Utilities and services
└── README.md                   # Documentation
```


##
