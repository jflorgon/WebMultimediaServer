package com.jose.mediaserver.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "resume")
data class ResumeEntity(
    @PrimaryKey val contentId: String,
    val contentKind: String,     // "Movie" | "Series" | "Documentary" | "Episode"
    val positionMs: Long,
    val durationMs: Long,
    val updatedAt: Long,
)
