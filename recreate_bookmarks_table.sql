-- Recreate user_bookmarks table with font_size column
-- This will drop the existing table and create a new one with font_size support

DROP TABLE IF EXISTS user_bookmarks CASCADE;

CREATE TABLE user_bookmarks (
  user_id VARCHAR(255),
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  scroll_position INTEGER NOT NULL DEFAULT 0,
  font_size INTEGER DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, book_title, book_author)
);

-- Verify the table structure
\d user_bookmarks;