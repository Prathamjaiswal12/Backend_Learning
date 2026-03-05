import dotenv from "dotenv"
import app from "./app.js"
import connectDB from "./db/index.js";
dotenv.config({
    path: "./.env",
});


const port = process.env.PORT || 3000;

// Try to connect to MongoDB, but don't block server startup
connectDB();

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});


 

