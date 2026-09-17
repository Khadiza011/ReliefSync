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



const getAvailableShelters = (req,res)=>{

    const sql = `
        SELECT 
        shelter_name,
        total_capacity AS capacity,
        current_occupancy,
        GREATEST(total_capacity - current_occupancy,0) AS available_space,
        CASE
            WHEN current_occupancy >= total_capacity
            THEN 'FULL'
            ELSE 'AVAILABLE'
        END AS status
        FROM shelters
    `;


    db.query(sql,(err,result)=>{

        if(err){
            return res.status(500).json({
                message:"Database error",
                error:err
            });
        }


        res.json(result);

    });

};

const recommendShelter = (req,res)=>{

    const {district, upazila} = req.query;


    const sql = `
        SELECT
            shelter_id,
            shelter_name,
            address,
            total_capacity,
            current_occupancy,

            GREATEST(total_capacity-current_occupancy,0)
            AS available_space

        FROM shelters

        WHERE district = ?
        AND upazila = ?

        AND current_occupancy < total_capacity

        ORDER BY available_space DESC
    `;


    db.query(
        sql,
        [district, upazila],
        (err,result)=>{

            if(err){
                return res.status(500).json({
                    message:"Database error",
                    error:err.message
                });
            }


            if(result.length === 0){

                return res.json({
                    message:"No available shelter found"
                });

            }


            res.json(result);

        }
    );

};

module.exports = {
    getAllShelters,
    getAvailableShelters,
    recommendShelter
};