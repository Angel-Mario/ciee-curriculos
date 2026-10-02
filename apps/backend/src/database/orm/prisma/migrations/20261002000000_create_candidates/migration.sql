IF OBJECT_ID(N'dbo.todo', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[todo] (
        [id] NVARCHAR(36) NOT NULL,
        [createdAt] DATETIME2 NOT NULL CONSTRAINT [todo_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
        [updatedAt] DATETIME2 NOT NULL,
        [title] NVARCHAR(1000) NOT NULL,
        [description] NVARCHAR(1000) NULL,
        [completed] BIT NOT NULL CONSTRAINT [todo_completed_df] DEFAULT 0,
        CONSTRAINT [todo_pkey] PRIMARY KEY CLUSTERED ([id])
    );
END;

IF OBJECT_ID(N'dbo.candidates', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[candidates] (
        [id] INT NOT NULL IDENTITY(1,1),
        [full_name] NVARCHAR(200) NOT NULL,
        [email] NVARCHAR(254) NOT NULL,
        [phone] NVARCHAR(32) NULL,
        [interest_area] NVARCHAR(200) NULL,
        [professional_summary] NVARCHAR(2000) NULL,
        CONSTRAINT [candidates_pkey] PRIMARY KEY CLUSTERED ([id])
    );
END;
