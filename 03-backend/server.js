const express = require("express");
const cors = require("cors");
require("dotenv").config();


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
const shelterAdmissionRoutes = require("./routes/shelterAdmissionRoutes");
const donationRoutes = require("./routes/donationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const alertsRoutes = require("./routes/alertsRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const reportRoutes = require("./routes/reportRoutes");


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
app.use("/api/admissions",shelterAdmissionRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 5000;


app.listen(PORT,()=>{

    console.log(`Server running on port ${PORT}`);

});