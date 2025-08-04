# Code Review Platform

A web-based platform designed for collecting code reviews from participants as part of a thesis research study. This platform presents code snippets to reviewers and collects structured feedback to analyze code review practices and effectiveness.

## Purpose

This application is developed for academic research purposes to study code review processes, reviewer behavior, and the effectiveness of different code review approaches. Participants can review code snippets and provide feedback through a structured interface.

## Features

- **Code Snippet Presentation**: Display code snippets in a clean, syntax-highlighted format
- **Review Collection**: Structured forms for collecting reviewer feedback
- **User-Friendly Interface**: Intuitive design for seamless review experience
- **Data Export**: Ability to export collected review data for analysis
- **Responsive Design**: Works across desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd code-review-platform
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to access the platform.

## Usage

### For Reviewers
1. Navigate to the platform URL
2. Read the instructions and consent information
3. Review the presented code snippets
4. Complete the feedback forms for each snippet
5. Submit your reviews

### For Researchers
- Access the admin panel to manage code snippets and review sessions
- Export collected data for analysis
- Monitor review completion rates and participant engagement

## Project Structure

```
├── app/                    # Next.js app directory
├── components/             # Reusable React components
├── lib/                   # Utility functions and configurations
├── public/                # Static assets
└── styles/                # CSS and styling files
```

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Database**: [Specify your database choice]
- **Authentication**: [If applicable]
- **Deployment**: Vercel (recommended)

## Data Collection

This platform collects:
- Code review comments and ratings
- Time spent on each review
- Reviewer demographics (if consented)
- Review completion metrics

All data collection follows ethical research guidelines and participant consent protocols.

## Contributing

This is a research project. If you encounter issues or have suggestions:
1. Check existing issues in the repository
2. Create a new issue with detailed description
3. For major changes, discuss with the research team first

## Research Ethics

This platform is designed for academic research. All participants should:
- Provide informed consent before participating
- Understand how their data will be used
- Have the option to withdraw from the study

## Deployment

### Vercel (Recommended)
1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Configure environment variables if needed
4. Deploy with automatic CI/CD

### Other Platforms
The application can be deployed on any platform supporting Next.js applications.

## License

This project is for academic research purposes. Please contact the research team for usage permissions.

## Contact

For questions about this research platform or to report issues:
- **Researcher**: [Your Name]
- **Institution**: [Your Institution]
- **Email**: [Your Email]
- **Thesis Supervisor**: [Supervisor Name and Contact]

## Acknowledgments

- Built with Next.js and modern web technologies
- Thanks to all participants contributing to this research
- Special acknowledgment to thesis advisors and research committee
