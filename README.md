# GymLibrary Server 🏋️‍♂️

The backend API for GymLibrary, providing secure authentication, media streaming (shorts-style videos), and resource management. Built with robust and modern backend technologies.

## 🚀 Tech Stack

- **Runtime Environment:** [Node.js](https://nodejs.org/)
- **Framework:** [Express](https://expressjs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
- **Authentication:** JWT (JSON Web Tokens) with HTTP-only cookies
- **Validation:** [Zod](https://zod.dev/)
- **Security:** Helmet, CORS, Express Rate Limit, bcryptjs

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher recommended)
- npm or yarn
- MongoDB (local or Atlas cluster)

## 🛠️ Installation & Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd gym-library-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your environment variables:**
   Create a `.env` file in the root directory (you can use `.env.example` if available) and add the following variables:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/gym-library # Or your MongoDB Atlas URI
   JWT_SECRET=your_super_secret_jwt_key
   CLIENT_URL=http://localhost:3000
   ```

4. **Seed the database (Optional):**
   If you want to populate your local database with initial media assets:
   ```bash
   npx ts-node src/scripts/seed-media.ts
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000`.

## 📜 Available Scripts

- `npm run dev`: Starts the application in development mode with `nodemon` and `ts-node` for hot-reloading.
- `npm run build`: Compiles the TypeScript source code into JavaScript in the `dist` directory.
- `npm start`: Runs the compiled output in the `dist` directory (intended for production).

## 🗂️ Project Structure

```text
src/
├── config/       # Environment and Database configuration
├── middleware/   # Custom Express middlewares (e.g., errorHandler, auth)
├── models/       # Mongoose Schemas (User, MediaAsset, AccessRequest)
├── modules/      # Domain-driven feature modules (Auth, Media)
│   ├── auth/     # Authentication routes and controllers
│   └── media/    # Media streaming routes and controllers
├── scripts/      # Standalone utility scripts (e.g., DB seeding)
├── utils/        # Shared helper functions
├── app.ts        # Express application setup and middleware mounting
└── server.ts     # Application entry point & server listener
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - Check if the server is running.

### Authentication (`/api/auth`)
- `POST /register` - Register a new user account.
- `POST /login` - Authenticate a user and set a session cookie.
- `POST /logout` - Clear the user session cookie.
- `GET /me` - Get the current authenticated user's profile.

### Media (`/api/media`)
- `GET /api/media` - Fetch a list of available media assets.
- `GET /api/media/stream/:id` - Stream a specific media video (supports partial content ranges for HTML5 video players).

## 🔒 Security Measures

- **HTTP-only Cookies**: JWTs are stored in HTTP-only cookies to prevent XSS attacks.
- **Helmet**: Secures Express apps by setting various HTTP headers.
- **CORS Configured**: Restricted to the trusted client origin (`http://localhost:3000`).
- **Rate Limiting**: Protects endpoints against brute-force and DDoS attacks.
- **Password Hashing**: Uses `bcryptjs` before persisting user credentials.
