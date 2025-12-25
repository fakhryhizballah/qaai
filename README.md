# QAAI - Assistant AI for RSUD dr. Abdul Aziz

QAAI is an intelligent chatbot backend designed for **RSUD dr. Abdul Aziz Singkawang**. It integrates natural language processing (NLP) with hospital management systems to facilitate patient services, including BPJS integration, registration, and general inquiries.

## 🚀 Features

- **Automated Registration**: Register patients for tomorrow's clinic visits (BPJS & General).
- **BPJS Integration**: Real-time checking of BPJS cards, referrals, and clinic availability.
- **AI-Powered Chat**: Uses Ollama/Gemini for natural conversations.
- **OTP Generation**: Secure OTP delivery via WhatsApp for authentication.
- **Redis Caching**: Efficient session management and data caching.
- **Interactive Flow**: Multi-stage chat flows for data validation and selections.

## 🛠 Tech Stack

- **Backend**: [Express.js](https://expressjs.com/)
- **NLP**: [node-nlp](https://github.com/axa-group/nlp.js)
- **Database**: [Sequelize](https://sequelize.org/) (MariaDB)
- **Caching**: [Redis](https://redis.io/)
- **AI Models**: [Google Generative AI (Gemini)](https://ai.google.dev/), [Ollama](https://ollama.com/)
- **WA Integration**: WhatsApp API for notifications.

## 📁 Project Structure

```text
├── config/             # Database & environment configurations
├── controllers/        # Business logic for message processing
├── data/               # Training data for NLP
├── helper/             # BPJS, WhatsApp, and Token utilities
├── migrations/         # Sequelize database migrations
├── models/             # Sequelize database models
├── nlp/                # NLP model training and logic
├── routes/             # API endpoint definitions
├── app.js              # Main server entry point
└── nlpModel.js         # NLP Manager initialization
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v16+)
- MariaDB / MySQL
- Redis Server
- Ollama (optional, if using local AI)

### Installation
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd qaai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=yourpassword
   DB_NAME=qaai

   # Redis
   REDIS_URL=your-redis-url
   REDIS_URL_PORT=6379
   REDIS_PASSWORD=your-redis-password

   # AI Keys
   GEMINI_API_KEY=your-gemini-key
   SECRET_OTP=your-otp-secret

   # External APIs
   BPJS_API_URL=https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev/
   # ... add other necessary BPJS/WA configs
   ```

4. **Run the server**:
   ```bash
   npm start
   ```

## 🔌 API Endpoints

### NLP Processing
- **POST** `/api/nlp/message`
  - **Body**: `{ "message": "halo", "nowa": "628xxx" }`
  - **Description**: Primary endpoint for processing incoming user messages.

## 📝 License
This project is licensed under the **ISC License**.
