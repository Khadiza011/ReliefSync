const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Development fallback so a fresh copy still runs before .env is created
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "reliefsync-dev-secret-change-me";
    console.warn("JWT_SECRET is not set - using an insecure development default. Copy .env.example to .env.");
}


const db = require("./config/db");


// Routes
const shelterRoutes = require("./routes/shelterRoutes");
const familyRoutes = require("./routes/familyRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const disasterRoutes = require("./routes/disasterRoutes");
const reliefRequestRoutes = require("./routes/reliefRequestRoutes");
const distributionRoutes = require("./routes/distributionRoutes");
const distributionItemRoutes = require("./routes/distributionItemRoutes");
const syncRoutes = require("./routes/syncRoutes");
const medicalRoutes = require("./routes/medicalRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const reliefRequestItemRoutes = require("./routes/reliefRequestItemRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const shelterAdmissionRoutes = require("./routes/shelterAdmissionRoutes");
const donationRoutes = require("./routes/donationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const lookupRoutes = require("./routes/lookupRoutes");


const app = express();


app.use(cors());

app.use(express.json());



// Test
app.get("/", (req,res)=>{

     res.send("ReliefSync Backend Running");

});



// API Routes

app.use("/api/shelters", shelterRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/disasters", disasterRoutes);
app.use("/api/requests", reliefRequestRoutes);
app.use("/api/distributions", distributionRoutes);
app.use("/api/distribution-items",distributionItemRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/medical", medicalRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use( "/api/request-items", reliefRequestItemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admissions",shelterAdmissionRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api", lookupRoutes);

const PORT = process.env.PORT || 5000;


app.listen(PORT,()=>{

    console.log(`Server running on port ${PORT}`);

});