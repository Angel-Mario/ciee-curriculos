-- Refuse to apply if existing normalized emails conflict; never delete candidate data.
IF EXISTS (
    SELECT LOWER(LTRIM(RTRIM([email])))
    FROM [dbo].[candidates]
    GROUP BY LOWER(LTRIM(RTRIM([email])))
    HAVING COUNT(*) > 1
)
    THROW 50001, 'Duplicate candidate emails must be resolved before applying this migration.', 1;

UPDATE [dbo].[candidates] SET [email] = LOWER(LTRIM(RTRIM([email])));
ALTER TABLE [dbo].[candidates] ADD CONSTRAINT [UQ_candidates_email] UNIQUE ([email]);
