import mongoose from "mongoose";

const connectDB = async () => {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 3000,
                socketTimeoutMS: 45000,
            });
            console.log("✅ MongoDB connected successfully");
            return true;
        } catch (error) {
            retries++;
            console.error(`❌ MongoDB connection attempt ${retries}/${maxRetries} failed:`, error.message);
            
            if (retries < maxRetries) {
                const delayMs = 2000;
                console.log(`⏳ Retrying in ${delayMs / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    
    console.warn("⚠️ MongoDB not connected. Server will run but database features will be unavailable.");
    console.log("📌 To fix: Whitelist your IP in MongoDB Atlas: https://cloud.mongodb.com → Network Access");
    return false;
};

export default connectDB;