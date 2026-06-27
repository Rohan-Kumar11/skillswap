# SkillSwap

SkillSwap is a modern full-stack skill-sharing and social learning platform built with Next.js.
The platform allows users to connect, share skills, communicate in real-time, explore profiles, schedule sessions, and collaborate through an interactive community-based environment.

---

# 🚀 Features

## 🔐 Authentication System

* User Signup & Login
* Authentication Callbacks
* User Session Management
* Protected Routes

## 👤 User Profiles

* Dynamic User Profiles
* Profile Editing
* Skill Badges
* Media Upload Support
* Avatar & Image Editing
* Profile Statistics

## 🌍 Explore Section

* Discover users and posts
* Explore community content
* Search users by interests and skills

## 💬 Real-Time Messaging System

* Chat Interface
* Emoji Picker
* File Upload Support
* Typing Indicators
* Message Actions
* Online Status System
* Swap Request System

## 📞 Calling System

* Audio/Video Calling
* Incoming Call Screen
* Call History
* WebRTC Integration
* Real-Time Signaling

## 📅 Session Scheduling & Tracking

* Session Scheduler
* Session Notes
* Progress Dashboard
* Session Timer

## 🏆 Leaderboard System

* User Rankings
* Hall of Fame
* Stats Overview
* Search & Filters
* Current User Badge

## 🎵 Media Features

* Music Browser
* Music Picker
* Audio Trimming
* Story Editor & Viewer
* Video Player

## 🔔 Notifications

* Notification System
* User Activity Tracking

---

# 🛠️ Tech Stack

## Frontend

* Next.js
* React.js
* JavaScript
* CSS3

## Backend

* Next.js API Routes
* Node.js

## Database & Services

* Supabase

## Real-Time Communication

* WebRTC
* Custom Signaling System

## Development Tools

* Git & GitHub
* ESLint

---

# 📂 Project Structure

```bash
my-app/
│
├── app/
│   ├── api/
│   ├── components/
│   ├── explore/
│   ├── leaderboard/
│   ├── messages/
│   ├── notification/
│   ├── onboarding/
│   ├── profile/
│   └── search/
│
├── lib/
│   ├── calls/
│   ├── authHelpers.js
│   ├── supabaseClient.js
│   └── userHelpers.js
│
├── public/
├── src/
├── package.json
└── README.md
```

---

# ⚙️ Installation

## Clone the Repository

```bash
git clone https://github.com/your-username/SkillSwap.git
```

## Navigate to the Project

```bash
cd SkillSwap/my-app
```

## Install Dependencies

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

---

# 🌐 Environment Variables

Create a `.env.local` file in the root directory and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

# 🚀 Running the Application

After starting the server, open:

```bash
http://localhost:3000
```

---

# 📸 Core Modules

## Authentication

Handles signup, login, session handling, and user authentication.

## Messaging

Provides real-time chat, typing indicators, swap requests, and file sharing.

## Calling System

Implements peer-to-peer calling using WebRTC and signaling services.

## Profile Management

Supports profile editing, media uploads, stories, and skill management.

## Leaderboard

Tracks active and top-performing users within the community.

---

# 🎯 Project Goal

SkillSwap aims to create a collaborative platform where users can:

* Share skills
* Learn from others
* Build meaningful connections
* Track learning progress
* Communicate in real-time
* Exchange knowledge through interactive sessions

---

# 🔮 Future Improvements

* AI Skill Recommendations
* Group Video Calls
* Dark Mode
* Push Notifications
* Mobile App Support
* Advanced Analytics
* Skill Verification System
* Community Forums

---

# 🤝 Contributing

Contributions are welcome.

## Steps to Contribute

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Added new feature"
```

4. Push to GitHub

```bash
git push origin feature-name
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

Rohan Kumar

---

# ⭐ Support

If you like this project, consider giving it a star on GitHub.
