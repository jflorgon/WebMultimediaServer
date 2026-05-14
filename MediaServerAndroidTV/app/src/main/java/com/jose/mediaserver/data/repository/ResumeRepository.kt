package com.jose.mediaserver.data.repository

import com.jose.mediaserver.data.local.ResumeDao
import com.jose.mediaserver.data.local.entities.ResumeEntity
import com.jose.mediaserver.domain.model.MediaKind
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ResumeRepository @Inject constructor(
    private val dao: ResumeDao,
) {
    suspend fun get(id: String): ResumeEntity? = dao.get(id)

    suspend fun save(id: String, kind: MediaKind, positionMs: Long, durationMs: Long) {
        // Si quedan menos de 30s o ya casi al final → no guardar
        if (positionMs < 30_000) {
            return
        }
        if (durationMs > 0 && positionMs >= (durationMs * 0.95).toLong()) {
            dao.delete(id)
            return
        }
        dao.upsert(
            ResumeEntity(
                contentId = id,
                contentKind = kind.name,
                positionMs = positionMs,
                durationMs = durationMs,
                updatedAt = System.currentTimeMillis(),
            ),
        )
    }

    suspend fun clear(id: String) = dao.delete(id)
}
