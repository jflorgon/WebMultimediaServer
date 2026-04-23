IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'MediaServerDb')
BEGIN
    CREATE DATABASE MediaServerDb
        COLLATE Latin1_General_100_CI_AS_SC_UTF8;
END
GO
-- Las tablas son gestionadas por EF Core migrations en el arranque de la API
