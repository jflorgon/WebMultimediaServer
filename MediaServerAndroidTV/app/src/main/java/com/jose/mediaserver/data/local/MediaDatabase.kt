package com.jose.mediaserver.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.jose.mediaserver.data.local.entities.ResumeEntity

@Database(
    entities = [ResumeEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class MediaDatabase : RoomDatabase() {
    abstract fun resumeDao(): ResumeDao
}
