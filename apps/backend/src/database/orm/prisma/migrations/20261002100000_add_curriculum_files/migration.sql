CREATE TABLE [dbo].[curriculum_files] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [candidate_id] INT NOT NULL,
    [storage_key] NVARCHAR(500) NOT NULL,
    [original_name] NVARCHAR(260) NOT NULL,
    [mime_type] NVARCHAR(100) NOT NULL,
    [size_bytes] INT NOT NULL,
    [uploaded_at] DATETIME2(7) NOT NULL CONSTRAINT [DF_curriculum_files_uploaded_at] DEFAULT GETDATE(),
    CONSTRAINT [PK_curriculum_files] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_curriculum_files_candidate] UNIQUE ([candidate_id]),
    CONSTRAINT [FK_curriculum_files_candidates] FOREIGN KEY ([candidate_id])
        REFERENCES [dbo].[candidates] ([id]) ON DELETE CASCADE
);
