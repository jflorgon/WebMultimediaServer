package com.jose.mediaserver.di

import android.content.Context
import androidx.room.Room
import com.jose.mediaserver.data.local.MediaDatabase
import com.jose.mediaserver.data.local.ResumeDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext ctx: Context): MediaDatabase =
        Room.databaseBuilder(ctx, MediaDatabase::class.java, "mediaserver.db").build()

    @Provides
    fun provideResumeDao(db: MediaDatabase): ResumeDao = db.resumeDao()
}
