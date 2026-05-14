package com.jose.mediaserver.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.jose.mediaserver.data.local.entities.ResumeEntity

@Dao
interface ResumeDao {

    @Query("SELECT * FROM resume WHERE contentId = :id LIMIT 1")
    suspend fun get(id: String): ResumeEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: ResumeEntity)

    @Query("DELETE FROM resume WHERE contentId = :id")
    suspend fun delete(id: String)
}
