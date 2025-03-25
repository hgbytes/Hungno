# Meal Management System

A web application that allows users to login, select meals for tomorrow, and provide feedback for today's meals. Includes an admin dashboard for managing meals and viewing feedback.

## Features

- User authentication (login/register)
- Meal selection for tomorrow
- Feedback system for meals
- Admin dashboard for meal management
- Responsive design with Material-UI

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd meal-management
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Create a PostgreSQL database named 'meal_management'

5. Create a `.env` file in the root directory with the following variables:
```
DB_NAME=meal_management
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
JWT_SECRET=your-secret-key
PORT=5000
```

## Running the Application

1. Start the backend server:
```bash
npm run dev
```

2. In a new terminal, start the frontend development server:
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user

### Meals
- GET /api/meals - Get all meals
- POST /api/meals - Create a new meal (admin only)
- PUT /api/meals/:id - Update a meal (admin only)
- DELETE /api/meals/:id - Delete a meal (admin only)
- POST /api/meals/select/:id - Select a meal for tomorrow
- GET /api/meals/selected - Get user's selected meals

### Feedback
- POST /api/feedback/:mealId - Add feedback for a meal
- GET /api/feedback/:mealId - Get feedback for a meal
- GET /api/feedback - Get all feedback (admin only)

## Technologies Used

- Frontend:
  - React
  - Material-UI
  - React Router
  - Axios

- Backend:
  - Node.js
  - Express
  - PostgreSQL
  - Sequelize ORM
  - JWT Authentication
  - Express Validator "# Hungno" 
