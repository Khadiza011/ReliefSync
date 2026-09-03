const db = require("../config/db");


const getAllShelters = (req,res)=>{


    const sql = `
        SELECT *
        FROM shelters
    `;


    db.query(sql,(err,result)=>{


        if(err){

            console.log(err);

            return res.status(500).json({
                message:"Database error"
            });

        }


        res.json(result);


    });


};



module.exports = {
    getAllShelters
};