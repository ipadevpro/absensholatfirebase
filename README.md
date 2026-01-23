# Absen Sholat

Mobile-first web application for tracking student prayer attendance at SMP PGII 1 Bandung.

## Features

- 📱 Mobile-first PWA design
- 🔐 Firebase Authentication (RBAC for teachers and student coordinators)
- 📊 Real-time attendance tracking (Zuhur, Ashar, Jum'at)
- 📈 Automatic grading system
- 🔄 Offline-first data sync with Firestore offline cache
- 🎨 Beautiful UI with shadcn/ui components
- 🌙 Dark mode support

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Backend:** Firebase (Auth, Firestore)
- **Icons:** Lucide React
- **Date Handling:** date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd absensholatbaru
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

4. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your config values to `.env.local`

5. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
absensholatbaru/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   ├── lib/                    # Utility functions
│   └── hooks/                  # Custom React hooks
├── public/                     # Static assets
├── .env.local                  # Environment variables
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
\`\`\`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Firebase Hosting

\`\`\`bash
npm run build
firebase deploy --only hosting
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details
