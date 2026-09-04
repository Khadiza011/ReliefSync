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


const PORT = process.env.PORT || 5000;


app.listen(PORT,()=>{

    console.log(`Server running on port ${PORT}`);

});