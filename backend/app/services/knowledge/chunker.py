from typing import List, Dict, Any

class TextChunker:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> List[str]:
        """
        Split text into overlapping chunks using a character-based sliding window.
        Attempts to respect paragraph/line boundaries where possible.
        """
        if not text:
            return []
            
        chunks = []
        text_len = len(text)
        
        start = 0
        while start < text_len:
            end = start + self.chunk_size
            
            # If we aren't at the end of the text, try to find a natural boundary (newline, period)
            if end < text_len:
                # Look back up to 150 characters for a paragraph boundary or period
                lookback_range = text[max(start, end - 150):end]
                
                # Check for paragraph boundary first
                p_boundary = lookback_range.rfind("\n\n")
                if p_boundary != -1:
                    end = max(start + 50, start + p_boundary + (end - 150))
                else:
                    # Check for sentence boundary (period, question mark, exclamation)
                    s_boundary = -1
                    for char in [". ", "? ", "! "]:
                        pos = lookback_range.rfind(char)
                        if pos > s_boundary:
                            s_boundary = pos
                            
                    if s_boundary != -1:
                        # Include the punctuation mark in the current chunk
                        end = max(start + 50, start + s_boundary + 1 + (end - 150))
                    else:
                        # Check for single newline or space
                        space_boundary = max(lookback_range.rfind("\n"), lookback_range.rfind(" "))
                        if space_boundary != -1:
                            end = max(start + 50, start + space_boundary + (end - 150))
            
            # Slice and clean the chunk
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
                
            # Move the window forward
            start = end - self.chunk_overlap
            if start >= text_len - self.chunk_overlap:
                break
                
        return chunks
