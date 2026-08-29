<div align="center">
  <img src="https://raw.githubusercontent.com/mdrijoanmaruf/Gym-Library-Client/main/public/logo.png" alt="GymLibrary Logo" width="250" />
  
  # GymLibrary 🏋️‍♂️ (Backend Server)
  
  **The high-performance API powering the ultimate modern fitness library.**
  
  [Frontend Repo](https://github.com/mdrijoanmaruf/Gym-Library-Client) • [Live Demo](https://gym.rijoan.com)

  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=flat&logo=express)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?style=flat&logo=cloudflare)](https://www.cloudflare.com/)
</div>

<br />

The GymLibrary Backend is a robust, scalable, and secure RESTful API built with **Node.js, Express, and TypeScript**. It acts as the core engine for the GymLibrary ecosystem, managing user data, workout plans, and orchestrating secure edge media delivery via Cloudflare R2.

---

## ✨ Key Capabilities

- **☁️ Cloudflare R2 Integration:** Generates secure, short-lived pre-signed URLs for edge streaming. Offloads heavy media serving from the backend directly to Cloudflare's global edge network.
- **🔐 Secure Authentication:** Seamlessly integrates with the frontend's NextAuth implementation, storing user credentials securely using `bcryptjs`.
- **📅 Workout Plan Management:** Stores and manages personalized user workout schedules (Saved Exercises by Day of the Week) in MongoDB.
- **🛡️ Enterprise-grade Security:** Hardened with `helmet`, strict `cors` policies, and comprehensive request validation using `Zod`.
- **🚀 Advanced Seeding Scripts:** Includes heavily automated, robust TypeScript scripts (`seed-and-upload.ts`) to effortlessly sync massive local media directories to Cloudflare R2 and MongoDB in one go.

---

## 🚀 Tech Stack

- **Runtime Environment:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
- **Edge Storage SDK:** [@aws-sdk/client-s3](https://aws.amazon.com/sdk-for-javascript/) (for R2 Pre-signed URLs)
- **Validation:** [Zod](https://zod.dev/)

---

## 🗂️ Project Structure

```text
src/
├── config/       # Environment, AWS/R2 SDK, and Database config
├── middleware/   # Express middlewares (errorHandler, requireAdmin)
├── models/       # Mongoose Schemas (User, MediaAsset, SavedExercise)
├── modules/      # Domain-driven feature modules
│   ├── auth/     # Authentication routes and logic
│   ├── media/    # Media & Pre-signed URL orchestration
│   └── savedExercise/ # Workout plan management
├── scripts/      # Advanced DB & R2 seeding/migration tools
├── services/     # Core business logic (R2Service)
├── utils/        # Shared helper functions (AppError, asyncHandler)
├── app.ts        # Express application setup
└── server.ts     # Application entry point
```

---

## ⚙️ Local Setup & Installation

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- A MongoDB instance (Local or Atlas)
- A Cloudflare R2 Bucket and API Tokens

### 2. Clone and Install
```bash
git clone https://github.com/mdrijoanmaruf/Gym-Library-Server.git
cd Gym-Library-Server
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Server Config
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB Connection
MONGODB_URI=mongodb://your_db_connection_string

# Cloudflare R2 Credentials
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=gym-library-media
PRESIGNED_URL_EXPIRES=3600
```

### 4. Running the Server
```bash
npm run dev
```
The server will start on `http://localhost:5000` with hot-reloading enabled.

---

## 📦 Media Seeding & Upload Scripts

The server includes a powerful tool to automatically upload local media directories to Cloudflare R2 and sync them with MongoDB.

1. Place your media in a `GYM/` directory in the root of the server, structured as:
   `GYM / <Category> / <Video|GIF> / file.mp4`
2. Run the unified uploader:
   ```bash
   npx ts-node src/scripts/seed-and-upload.ts
   ```
   *The script is idempotent—it will automatically skip files that have already been uploaded.*

---

<div align="center">
  <p>Developed by <b><a href="https://rijoan.com">Md Rijoan Maruf</a></b></p>
</div>
