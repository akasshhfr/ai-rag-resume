"""
PDF processing service: extracts text from uploaded PDF files using PyMuPDF.
"""
import fitz  # PyMuPDF is imported as 'fitz'


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract all text from a PDF file.

    Args:
        pdf_bytes: Raw bytes of the PDF file.

    Returns:
        Extracted text as a single string, with pages separated by newlines.

    How it works:
        - fitz.open() opens the PDF from bytes (stream=pdf_bytes, filetype="pdf")
        - We iterate over each page and extract its text
        - get_text("text") extracts plain text preserving layout order
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text_parts = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        if text.strip():  # Skip empty pages
            text_parts.append(text)

    doc.close()
    return "\n\n".join(text_parts)
