const db = require("../config/db");


// Save offline data
exports.saveOfflineData = (req, res) => {

    const {
        device_id,
        data_type,
        record_data
    } = req.body;


    const sql = `
        INSERT INTO offline_sync_queue
        (
            device_id,
            data_type,
            record_data
        )
        VALUES (?, ?, ?)
    `;


    db.query(
        sql,
        [
            device_id,
            data_type,
            JSON.stringify(record_data)
        ],
        (err, result) => {

            if(err){
                console.log(err);
                return res.status(500).json({
                    message:"Database error",
                    error:err.message
                });
            }


            res.json({
                message:"Offline data saved successfully",
                sync_id: result.insertId
            });

        }
    );

};

// Upload offline data to main database
exports.uploadOfflineData = (req, res) => {

    const getDataSQL = `
        SELECT *
        FROM offline_sync_queue
        WHERE sync_status = 'PENDING'
    `;


    db.query(getDataSQL, (err, results) => {

        if(err){
            return res.status(500).json({
                message:"Database error",
                error:err.message
            });
        }


        if(results.length === 0){
            return res.json({
                message:"No pending data to sync"
            });
        }


        results.forEach((row)=>{

            const data = JSON.parse(row.record_data);


            const insertSQL = `
                INSERT INTO emergency_registrations
                (
                    family_name,
                    member_count,
                    location,
                    priority,
                    sync_status
                )
                VALUES (?, ?, ?, ?, ?)
            `;


            db.query(
                insertSQL,
                [
                    data.name,
                    data.members,
                    data.location,
                    data.priority || "MEDIUM",
                    "SYNCED"
                ],
                (err)=>{

                    if(err){
                        console.log(err);
                    }
                    else{

                        const updateSQL = `
                            UPDATE offline_sync_queue
                            SET 
                            sync_status='SYNCED',
                            synced_at=NOW()
                            WHERE sync_id=?
                        `;


                        db.query(
                            updateSQL,
                            [row.sync_id]
                        );

                    }

                }
            );

        });


        res.json({
            message:"Offline data synced successfully",
            synced_records: results.length
        });


    });

};