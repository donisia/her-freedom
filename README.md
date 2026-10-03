SAUTI

Publish Freely. Own Your Voice. Earn Directly.

SAUTI is a decentralized publishing platform designed to give independent authors greater control over their work, digital identity, distribution and earnings.

The project is developed by HerFreedom, the group behind the repository. By leveraging Nostr for decentralized identity and publishing and Bitcoin Lightning for micropayments, SAUTI aims to help authors publish independently, reach readers and receive direct support without relying entirely on traditional publishing intermediaries.

«Your work. Your identity. Your freedom.»

The Problem

Independent authors, particularly emerging writers, face several challenges:

- Limited publishing opportunities: Traditional publishing can be difficult to access, especially for emerging and independent authors.
- Delayed or limited earnings: Authors may face restrictive royalty arrangements, delayed payments and intermediaries.
- Digital piracy: E-books and digital publications can be copied and redistributed without the author's permission.
- Censorship and platform dependency: Centralized platforms can restrict access to content or accounts, limiting authors' control over their work.
- Limited ownership of identity: Authors can become dependent on individual platforms to maintain their audience and publishing presence.

Our Solution

SAUTI is being developed as a decentralized publishing platform that connects authors directly with their readers.

The platform combines:

- Nostr: For portable author identities, cryptographically signed publishing events and distribution across independent relays.
- Bitcoin Lightning: For small, direct payments that allow readers to support authors and unlock premium content.
- Decentralized distribution: To reduce reliance on a single publishing platform or server.
- Protected premium content: To restrict access to paid chapters through a payment-based unlocking system.

Our goal is to give authors greater control over how they publish, distribute and monetize their work.

Key Features

Feature| Description
Decentralized Identity| Authors use Nostr identities to establish a portable publishing presence.
Independent Publishing| Authors can create books, publish chapters and manage their work.
Nostr Integration| Signed publishing events can be distributed across supported relays.
Lightning Payments| Readers can pay in sats to unlock premium chapters.
Free and Premium Content| Authors can choose which chapters are free and which require payment.
Author Profiles| Public profiles display author information and published works.
Earnings Dashboard| Authors can view their sales and Lightning earnings.
Multi-relay Distribution| Publishing across multiple relays helps reduce dependence on one server.
Content Protection| Paid chapter access is restricted through the platform, while recognizing that digital content cannot be made completely piracy-proof.

Features are being developed and may not all be available in the current prototype.

How It Works

1. Connect: An author connects a Nostr-compatible browser signer to establish their publishing identity.
2. Publish: The author creates a book and publishes its chapters, choosing which are free and which are premium.
3. Discover: Readers explore books and independent authors on the platform.
4. Unlock: Readers can make Lightning payments to access premium chapters.
5. Earn: Authors receive payments for their work and can track their earnings.

Technology Stack

Component| Technology
Backend| Python, Flask
Frontend| HTML, CSS, JavaScript, Bootstrap 5, Jinja2
Database| PostgreSQL
Decentralized Identity| Nostr
Publishing Protocol| Nostr events and relays
Payments| Bitcoin Lightning
Version Control| Git and GitHub
Development Environment| Visual Studio Code

The stack reflects the intended project architecture; integrations are subject to implementation progress.

Project Architecture

her-freedom/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   ├── templates/
│   │   ├── static/
│   │   │   ├── css/
│   │   │   ├── js/
│   │   │   └── images/
│   │   ├── __init__.py
│   │   └── config.py
│   │
│   ├── tests/
│   ├── .env.example
│   ├── requirements.txt
│   └── run.py
│
├── docs/
│
├── .gitignore
├── README.md
└── LICENSE

The Flask backend serves the frontend using Jinja2 templates and static assets. This keeps the project simple to develop and deploy while maintaining a clear separation of responsibilities.

Getting Started

Prerequisites

- Python 3.10 or later
- pip
- Git
- PostgreSQL (when database integration is enabled)

Installation

1. Clone the repository

git clone https://github.com/donisia/her-freedom.git
cd her-freedom

2. Navigate to the backend

cd backend

3. Create a virtual environment

python -m venv venv

Activate it:

Windows:

venv\Scripts\activate

macOS / Linux:

source venv/bin/activate

4. Install dependencies

pip install -r requirements.txt

5. Configure environment variables

Create a ".env" file using ".env.example" as a reference. Configure the required Flask and database settings according to the current implementation.

Never commit private keys, passwords, API credentials or other secrets.

6. Run the application

Use the project's configured Flask entry point. For example, if "run.py" exposes the Flask application:

python run.py

Open the local URL displayed in your terminal.

Security and Privacy

SAUTI aims to minimize unnecessary dependence on centralized identity providers.

- Authors should never share their Nostr private keys with the platform.
- Compatible browser signers should handle signing operations.
- Sensitive configuration and credentials should be stored in environment variables.
- Paid content should be protected by server-side authorization checks.
- Payment confirmation should be verified by the backend before granting access.

Nostr does not guarantee that content can never be removed from relays, and access controls cannot prevent readers from copying content after unlocking it.

Roadmap

- [ ] Responsive publishing platform interface
- [ ] Flask routes and application structure
- [ ] Author registration and profiles
- [ ] Nostr identity connection through browser signers
- [ ] Book and chapter publishing
- [ ] Nostr event signing and relay distribution
- [ ] PostgreSQL integration
- [ ] Free and premium chapter access
- [ ] Lightning invoice generation
- [ ] Verified Lightning payment processing
- [ ] Automated chapter unlocking
- [ ] Author earnings dashboard
- [ ] Multi-relay availability monitoring
- [ ] Testing and deployment

Our Vision

We envision a publishing ecosystem where authors have greater autonomy over their identities, creative work and relationships with readers.

SAUTI aims to make independent publishing more accessible by combining decentralized technology with direct, reader-supported monetization.

Contributing

We welcome contributions, feedback and collaboration as the project develops.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your implementation.
5. Submit a pull request.

Contributors whose pull requests are merged into the repository will appear in the repository's contributor list, provided GitHub can associate their commits with their GitHub accounts. Simply cloning the repository, adding it to your account, or submitting an unmerged pull request does not automatically add you as a contributor.

Team

Built by HerFreedom as a collaborative hackathon project exploring decentralized publishing, digital ownership and financial freedom for independent authors.

License

To be determined.
